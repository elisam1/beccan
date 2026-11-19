import { Download, KeyRound, RotateCcw } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ApiError, cmsApi } from '../../services/cmsApi';
import { BackupFileInfo } from '../../types/cms';
import { formatDisplayDate, formatFileSize } from '../../utils/formatting';
import { ConfirmDialog } from './ConfirmDialog';

export function AdminSettingsSection({ username }: { username: string | null }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [backups, setBackups] = useState<BackupFileInfo[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(true);
  const [backupFeedback, setBackupFeedback] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<BackupFileInfo | null>(
    null,
  );
  const [restoring, setRestoring] = useState(false);

  const loadBackups = useCallback(async () => {
    setLoadingBackups(true);
    try {
      const res = await cmsApi.listBackups();
      setBackups(res.backups);
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
    void loadBackups();
  }, [loadBackups]);

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

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setRestoring(true);
    setBackupError(null);
    setBackupFeedback(null);
    try {
      const res = await cmsApi.restoreBackup(restoreTarget.filename);
      setRestoreTarget(null);
      setBackupFeedback(
        `Restored ${res.collection}.json from ${res.restoredFrom} (${res.recordCount} records).`,
      );
      await loadBackups();
    } catch (err) {
      setBackupError(
        err instanceof ApiError ? err.message : 'Restore failed.',
      );
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Password Management */}
      <form
        onSubmit={handleChangePassword}
        className="bg-[#FFFFFF] border border-[#E6DFD3] p-6 sm:p-8 max-w-xl space-y-5"
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

      {/* Backups & Recovery */}
      <div className="bg-[#FFFFFF] border border-[#E6DFD3] p-6 sm:p-8 space-y-5">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#0F213E]">
            JSON Backups & Recovery
          </h2>
          <p className="text-sm text-[#5B6472] mt-1">
            Private automatic backups stored in{' '}
            <span className="font-mono text-xs">private/backups/</span> before
            each content modification. Download snapshots regularly alongside{' '}
            <span className="font-mono text-xs">public_html/uploads/</span>.
          </p>
        </div>

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
            className="p-3.5 bg-[#FFF5F2] border border-[#E6B8A8] text-sm text-[#9A3412]"
          >
            {backupError}
          </div>
        )}

        {loadingBackups ? (
          <div className="h-32 bg-[#FBF9F5] border border-[#E6DFD3] animate-pulse" />
        ) : backups.length === 0 ? (
          <p className="text-sm text-[#5B6472] py-6">
            No backups created yet. Backups are automatically generated whenever
            content is updated or deleted.
          </p>
        ) : (
          <div className="overflow-x-auto border border-[#E6DFD3]">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-[#FBF9F5] border-b border-[#E6DFD3] text-xs uppercase tracking-[0.14em] text-[#5B6472]">
                  <th className="py-3 px-4 font-semibold">Collection</th>
                  <th className="py-3 px-4 font-semibold">Created (UTC)</th>
                  <th className="py-3 px-4 font-semibold">Size</th>
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
                      <span className="block text-xs font-mono text-[#5B6472]">
                        {b.filename}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#333D4D] tabular-nums">
                      {formatDisplayDate(b.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-[#5B6472] tabular-nums">
                      {formatFileSize(b.sizeBytes)}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      <a
                        href={cmsApi.getBackupDownloadUrl(b.filename)}
                        className="min-h-[36px] inline-flex items-center gap-1 px-3 py-1.5 border border-[#D4C8B4] bg-[#FFFFFF] text-xs font-medium text-[#0F213E] hover:border-[#0F213E]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
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
            ? `Restore ${restoreTarget.collection}.json from "${restoreTarget.filename}"? A fresh backup of the current data will be created first.`
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
