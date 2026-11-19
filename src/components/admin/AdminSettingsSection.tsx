import {
  AlertTriangle,
  Archive,
  Download,
  HardDrive,
  Info,
  KeyRound,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ApiError, cmsApi } from '../../services/cmsApi';
import {
  BackupCapabilities,
  BackupFileInfo,
  CmsCollectionName,
  MediaStorageSummary,
} from '../../types/cms';
import { formatDisplayDate, formatFileSize } from '../../utils/formatting';
import { ConfirmDialog } from './ConfirmDialog';

export function AdminSettingsSection({ username }: { username: string | null }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [storage, setStorage] = useState<MediaStorageSummary | null>(null);
  const [limitMbInput, setLimitMbInput] = useState('');
  const [retentionInput, setRetentionInput] = useState('30');
  const [savingStorage, setSavingStorage] = useState(false);
  const [storageFeedback, setStorageFeedback] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);

  const [backups, setBackups] = useState<BackupFileInfo[]>([]);
  const [capabilities, setCapabilities] = useState<BackupCapabilities | null>(
    null,
  );
  const [loadingBackups, setLoadingBackups] = useState(true);
  const [snapshotCollection, setSnapshotCollection] =
    useState<CmsCollectionName>('gallery');
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);
  const [backupFeedback, setBackupFeedback] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<BackupFileInfo | null>(
    null,
  );
  const [restoring, setRestoring] = useState(false);

  const loadStorageAndSettings = useCallback(async () => {
    try {
      const res = await cmsApi.getStorageAndLimits();
      setStorage(res.storage);
      setLimitMbInput(
        res.settings.storageLimitBytes !== null
          ? String(Math.round(res.settings.storageLimitBytes / (1024 * 1024)))
          : '',
      );
      setRetentionInput(String(res.settings.backupRetentionCount));
      setStorageError(null);
    } catch (err) {
      setStorageError(
        err instanceof ApiError
          ? err.message
          : 'Failed to load storage statistics.',
      );
    }
  }, []);

  const loadBackups = useCallback(async () => {
    setLoadingBackups(true);
    try {
      const res = await cmsApi.listBackups();
      setBackups(res.backups);
      setCapabilities(res.capabilities);
      setBackupError(null);
    } catch (err) {
      setBackupError(
        err instanceof ApiError ? err.message : 'Failed to load backups.',
      );
    } finally {
      setLoadingBackups(false);
    }
  }, []);

  useEffect(() => {
    void loadStorageAndSettings();
    void loadBackups();
  }, [loadStorageAndSettings, loadBackups]);

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordFeedback(null);
    setSavingPassword(true);
    try {
      const res = await cmsApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setPasswordFeedback(res.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(
        err instanceof ApiError ? err.message : 'Password change failed.',
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveStorageSettings = async (e: FormEvent) => {
    e.preventDefault();
    setSavingStorage(true);
    setStorageFeedback(null);
    setStorageError(null);

    const trimmedLimit = limitMbInput.trim();
    let storageLimitBytes: number | null = null;
    if (trimmedLimit !== '') {
      const parsedMb = Number(trimmedLimit);
      if (!Number.isFinite(parsedMb) || parsedMb <= 0) {
        setStorageError(
          'Storage limit must be a positive number in MB, or leave blank for no application limit.',
        );
        setSavingStorage(false);
        return;
      }
      storageLimitBytes = Math.round(parsedMb * 1024 * 1024);
    }

    const retention = Number(retentionInput);
    if (!Number.isInteger(retention) || retention < 1 || retention > 200) {
      setStorageError('Backup retention must be a whole number between 1 and 200.');
      setSavingStorage(false);
      return;
    }

    try {
      const res = await cmsApi.updateStorageSettings({
        storageLimitBytes,
        backupRetentionCount: retention,
      });
      setStorage(res.storage);
      setStorageFeedback(
        res.settings.storageLimitBytes !== null
          ? `Settings saved. Storage limit set to ${formatFileSize(res.settings.storageLimitBytes)}, retention ${res.settings.backupRetentionCount} snapshots.`
          : `Settings saved. No application-level storage limit configured, retention ${res.settings.backupRetentionCount} snapshots.`,
      );
      await loadBackups();
    } catch (err) {
      setStorageError(
        err instanceof ApiError ? err.message : 'Failed to save settings.',
      );
    } finally {
      setSavingStorage(false);
    }
  };

  const handleCreateSnapshot = async () => {
    setCreatingSnapshot(true);
    setBackupError(null);
    setBackupFeedback(null);
    try {
      const res = await cmsApi.createBackup(snapshotCollection);
      setBackupFeedback(
        `Created complete snapshot "${res.snapshotId}" for ${res.collection}.`,
      );
      await Promise.all([loadBackups(), loadStorageAndSettings()]);
    } catch (err) {
      setBackupError(
        err instanceof ApiError ? err.message : 'Failed to create snapshot.',
      );
    } finally {
      setCreatingSnapshot(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setRestoring(true);
    setBackupError(null);
    setBackupFeedback(null);
    try {
      const res = await cmsApi.restoreBackup(restoreTarget.filename);
      setRestoreTarget(null);
      setBackupFeedback(
        `Restored ${res.collection} from "${res.restoredFrom}" (${res.recordCount} records, ${res.restoredMediaFiles} media files verified). Safety backup created: ${res.safetyBackupId || 'n/a'}.`,
      );
      await Promise.all([loadBackups(), loadStorageAndSettings()]);
    } catch (err) {
      setRestoreTarget(null);
      setBackupError(
        err instanceof ApiError ? err.message : 'Restore failed.',
      );
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Password Management */}
        <form
          onSubmit={handleChangePassword}
          className="bg-[#FFFFFF] border border-[#E6DFD3] p-6 sm:p-8 space-y-5"
        >
          <div className="flex items-start gap-3">
            <KeyRound className="w-5 h-5 text-[#8D6A26] shrink-0 mt-1" />
            <div>
              <h2 className="font-serif text-2xl font-semibold text-[#0F213E]">
                Account Security ({username || 'administrator'})
              </h2>
              <p className="text-xs sm:text-sm text-[#5B6472] mt-1">
                Passwords require at least 10 characters with uppercase,
                lowercase, and a digit, stored using PHP password_hash().
              </p>
            </div>
          </div>

          {passwordFeedback && (
            <div
              role="status"
              className="p-3.5 bg-[#FBF9F5] border border-[#B58E43] text-sm text-[#0F213E]"
            >
              {passwordFeedback}
            </div>
          )}
          {passwordError && (
            <div
              role="alert"
              className="p-3.5 bg-[#FFF5F2] border border-[#E6B8A8] text-sm text-[#9A3412]"
            >
              {passwordError}
            </div>
          )}

          <div>
            <label
              htmlFor="pwd-current"
              className="block text-sm font-medium text-[#0F213E] mb-1"
            >
              Current Password
            </label>
            <input
              id="pwd-current"
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 bg-[#FBF9F5] border border-[#D4C8B4] text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="pwd-new"
              className="block text-sm font-medium text-[#0F213E] mb-1"
            >
              New Password
            </label>
            <input
              id="pwd-new"
              type="password"
              required
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 bg-[#FBF9F5] border border-[#D4C8B4] text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="pwd-confirm"
              className="block text-sm font-medium text-[#0F213E] mb-1"
            >
              Confirm New Password
            </label>
            <input
              id="pwd-confirm"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 bg-[#FBF9F5] border border-[#D4C8B4] text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="min-h-[44px] px-6 py-2.5 bg-[#0F213E] text-[#FBF9F5] text-sm font-medium hover:bg-[#172E54] cursor-pointer disabled:opacity-60"
          >
            {savingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        {/* Storage Quota & Retention Configuration */}
        <form
          onSubmit={handleSaveStorageSettings}
          className="bg-[#FFFFFF] border border-[#E6DFD3] p-6 sm:p-8 space-y-5"
        >
          <div className="flex items-start gap-3">
            <HardDrive className="w-5 h-5 text-[#8D6A26] shrink-0 mt-1" />
            <div>
              <h2 className="font-serif text-2xl font-semibold text-[#0F213E]">
                Media Storage & Retention Policy
              </h2>
              <p className="text-xs sm:text-sm text-[#5B6472] mt-1">
                Monitor real private media storage and optionally enforce an
                application-level quota. Leave the quota blank if no fixed
                limit is desired.
              </p>
            </div>
          </div>

          {storage && (
            <div className="p-4 bg-[#FBF9F5] border border-[#E6DFD3] space-y-1.5 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-[#5B6472]">Current Media Used:</span>
                <span className="font-semibold text-[#0F213E] tabular-nums">
                  {formatFileSize(storage.totalBytes)} (
                  {storage.totalOriginalsCount} orig ·{' '}
                  {storage.totalThumbnailsCount} thumb)
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#5B6472]">Configured Limit:</span>
                <span className="font-medium text-[#0F213E] tabular-nums">
                  {storage.configuredLimitBytes !== null
                    ? `${formatFileSize(storage.configuredLimitBytes)} (${formatFileSize(storage.remainingBytes || 0)} remaining)`
                    : 'None configured'}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#5B6472]">Backup Storage Used:</span>
                <span className="font-medium text-[#0F213E] tabular-nums">
                  {formatFileSize(storage.backupsBytes)}
                </span>
              </div>
            </div>
          )}

          {storageFeedback && (
            <div
              role="status"
              className="p-3.5 bg-[#FBF9F5] border border-[#B58E43] text-sm text-[#0F213E]"
            >
              {storageFeedback}
            </div>
          )}
          {storageError && (
            <div
              role="alert"
              className="p-3.5 bg-[#FFF5F2] border border-[#E6B8A8] text-sm text-[#9A3412]"
            >
              {storageError}
            </div>
          )}

          <div>
            <label
              htmlFor="storage-limit-mb"
              className="block text-sm font-medium text-[#0F213E] mb-1"
            >
              Application Media Storage Limit (MB, Optional)
            </label>
            <input
              id="storage-limit-mb"
              type="number"
              min={1}
              step={1}
              value={limitMbInput}
              onChange={(e) => setLimitMbInput(e.target.value)}
              placeholder="Leave blank for no application limit"
              className="w-full min-h-[44px] px-3.5 py-2 bg-[#FBF9F5] border border-[#D4C8B4] text-sm tabular-nums"
            />
          </div>

          <div>
            <label
              htmlFor="backup-retention"
              className="block text-sm font-medium text-[#0F213E] mb-1"
            >
              Snapshots Retained Per Collection (1–200)
            </label>
            <input
              id="backup-retention"
              type="number"
              min={1}
              max={200}
              required
              value={retentionInput}
              onChange={(e) => setRetentionInput(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 bg-[#FBF9F5] border border-[#D4C8B4] text-sm tabular-nums"
            />
          </div>

          <button
            type="submit"
            disabled={savingStorage}
            className="min-h-[44px] px-6 py-2.5 bg-[#0F213E] text-[#FBF9F5] text-sm font-medium hover:bg-[#172E54] cursor-pointer disabled:opacity-60"
          >
            {savingStorage ? 'Saving...' : 'Save Storage & Retention'}
          </button>
        </form>
      </div>

      {/* Backups & Recovery */}
      <div className="bg-[#FFFFFF] border border-[#E6DFD3] p-6 sm:p-8 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="font-serif text-2xl font-semibold text-[#0F213E]">
              Complete Media-Aware Backups & Recovery
            </h2>
            <p className="text-sm text-[#5B6472] max-w-3xl">
              Snapshots in <span className="font-mono text-xs">private/backups/</span>{' '}
              preserve JSON records <strong>plus all referenced original images and thumbnails</strong>{' '}
              for Gallery, News, and Events (Announcements store JSON records).
              Restoring creates a fresh safety backup first and verifies every
              image file before replacing live data.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <select
              aria-label="Collection for manual snapshot"
              value={snapshotCollection}
              onChange={(e) =>
                setSnapshotCollection(e.target.value as CmsCollectionName)
              }
              className="min-h-[40px] px-3 py-1.5 bg-[#FBF9F5] border border-[#D4C8B4] text-sm capitalize"
            >
              <option value="gallery">Gallery</option>
              <option value="news">News</option>
              <option value="events">Events</option>
              <option value="announcements">Announcements</option>
            </select>
            <button
              type="button"
              disabled={creatingSnapshot}
              onClick={handleCreateSnapshot}
              className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F213E] text-[#FBF9F5] text-xs font-medium hover:bg-[#172E54] cursor-pointer disabled:opacity-60"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>
                {creatingSnapshot ? 'Creating...' : 'Create Snapshot Now'}
              </span>
            </button>
          </div>
        </div>

        {capabilities && !capabilities.zipArchiveSupported && (
          <div
            role="note"
            className="p-4 bg-[#FBF9F5] border border-[#D4C8B4] text-xs sm:text-sm text-[#333D4D] flex items-start gap-3"
          >
            <Info className="w-4 h-4 text-[#8D6A26] shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-[#0F213E]">
                Downloadable Complete ZIP Archive Unavailable on This Server
              </p>
              <p className="mt-0.5 text-[#5B6472]">
                {capabilities.archiveUnavailableReason}
              </p>
            </div>
          </div>
        )}

        {backupFeedback && (
          <div
            role="status"
            className="p-3.5 bg-[#FBF9F5] border border-[#B58E43] text-sm text-[#0F213E]"
          >
            {backupFeedback}
          </div>
        )}
        {backupError && (
          <div
            role="alert"
            className="p-3.5 bg-[#FFF5F2] border border-[#E6B8A8] text-sm text-[#9A3412] flex items-start gap-2"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{backupError}</span>
          </div>
        )}

        {loadingBackups ? (
          <div className="h-32 bg-[#FBF9F5] border border-[#E6DFD3] animate-pulse" />
        ) : backups.length === 0 ? (
          <p className="text-sm text-[#5B6472] py-6">
            No backups created yet. Backups are automatically generated whenever
            content is updated or deleted, or when you click "Create Snapshot
            Now".
          </p>
        ) : (
          <div className="overflow-x-auto border border-[#E6DFD3]">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-[#FBF9F5] border-b border-[#E6DFD3] text-xs uppercase tracking-[0.14em] text-[#5B6472]">
                  <th className="py-3 px-4 font-semibold">Collection & ID</th>
                  <th className="py-3 px-4 font-semibold">Contents</th>
                  <th className="py-3 px-4 font-semibold">Created (UTC)</th>
                  <th className="py-3 px-4 font-semibold">Total Size</th>
                  <th className="py-3 px-4 font-semibold text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DFD3] text-sm">
                {backups.map((b) => (
                  <tr key={b.filename}>
                    <td className="py-3 px-4 font-medium text-[#0F213E] capitalize">
                      {b.collection}
                      <span className="block text-xs font-mono text-[#5B6472] normal-case">
                        {b.filename}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#333D4D] tabular-nums">
                      <span className="font-medium text-[#0F213E]">
                        {b.kind === 'complete-snapshot'
                          ? 'Complete (JSON + Media)'
                          : b.kind === 'legacy-json-only'
                            ? 'Legacy JSON Only'
                            : 'JSON Records'}
                      </span>
                      <span className="block text-[#5B6472] mt-0.5">
                        {b.recordCount} record{b.recordCount === 1 ? '' : 's'}
                        {b.includesMedia
                          ? ` · ${b.mediaFilesCount} media file${b.mediaFilesCount === 1 ? '' : 's'}`
                          : ''}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#333D4D] tabular-nums">
                      {formatDisplayDate(b.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-[#5B6472] tabular-nums">
                      <span className="font-medium text-[#0F213E]">
                        {formatFileSize(b.sizeBytes)}
                      </span>
                      {b.includesMedia && (
                        <span className="block text-xs">
                          JSON {formatFileSize(b.jsonBytes)} + Media{' '}
                          {formatFileSize(b.mediaBytes)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      {capabilities?.zipArchiveSupported &&
                        b.kind === 'complete-snapshot' && (
                          <a
                            href={cmsApi.getBackupZipDownloadUrl(b.filename)}
                            className="min-h-[36px] inline-flex items-center gap-1 px-3 py-1.5 border border-[#B58E43] bg-[#FBF9F5] text-xs font-medium text-[#0F213E] hover:border-[#0F213E]"
                            title="Download complete archive containing JSON metadata and all backed-up media files"
                          >
                            <Archive className="w-3.5 h-3.5 text-[#8D6A26]" />
                            <span>Complete (.zip)</span>
                          </a>
                        )}
                      <a
                        href={cmsApi.getBackupJsonDownloadUrl(b.filename)}
                        className="min-h-[36px] inline-flex items-center gap-1 px-3 py-1.5 border border-[#D4C8B4] bg-[#FFFFFF] text-xs font-medium text-[#0F213E] hover:border-[#0F213E]"
                        title="Downloads JSON metadata records only (does not contain image files)"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>JSON Only</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => setRestoreTarget(b)}
                        className="min-h-[36px] inline-flex items-center gap-1 px-3 py-1.5 bg-[#0F213E] text-[#FBF9F5] text-xs font-medium hover:bg-[#172E54] cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(restoreTarget)}
        title="Restore Collection Backup"
        description={
          restoreTarget
            ? `Restore ${restoreTarget.collection} from "${restoreTarget.filename}" (${restoreTarget.recordCount} records${restoreTarget.includesMedia ? `, ${restoreTarget.mediaFilesCount} media files` : ''})? A fresh safety backup of the current live records and media will be created first.`
            : ''
        }
        confirmLabel="Restore Backup"
        busy={restoring}
        onConfirm={handleRestore}
        onCancel={() => setRestoreTarget(null)}
      />
    </div>
  );
}
