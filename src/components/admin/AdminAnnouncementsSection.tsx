import {
  Archive,
  Edit3,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  ANNOUNCEMENT_PRIORITIES,
  ApiError,
  cmsApi,
} from '../../services/cmsApi';
import {
  AnnouncementPriority,
  CmsAnnouncement,
  PublishStatus,
} from '../../types/cms';
import {
  formatDisplayDate,
  splitParagraphs,
  toDatetimeLocalInput,
} from '../../utils/formatting';
import { ConfirmDialog } from './ConfirmDialog';
import { PriorityLabel, PublishStatusLabel } from './StatusLabel';

export function AdminAnnouncementsSection() {
  const [items, setItems] = useState<CmsAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  // Form state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<AnnouncementPriority>('Normal');
  const [publishedAt, setPublishedAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);

  const [previewItem, setPreviewItem] = useState<CmsAnnouncement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CmsAnnouncement | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cmsApi.listAdminAnnouncements({ status: statusFilter });
      setItems(res.items);
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to load announcements.',
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setMessage('');
    setPriority('Normal');
    setPublishedAt('');
    setExpiresAt('');
  };

  const openEdit = (item: CmsAnnouncement) => {
    setEditingId(item.id);
    setTitle(item.title);
    setMessage(item.message);
    setPriority(item.priority);
    setPublishedAt(toDatetimeLocalInput(item.publishedAt));
    setExpiresAt(item.expiresAt || '');
    setEditorOpen(true);
  };

  const handleSave = async (e: FormEvent, status: PublishStatus) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFeedback(null);

    try {
      if (editingId) {
        await cmsApi.updateAnnouncement({
          id: editingId,
          title: title.trim(),
          message: message.trim(),
          priority,
          status,
          publishedAt: publishedAt ? `${publishedAt}:00Z` : '',
          expiresAt: expiresAt.trim(),
        });
        setFeedback('Announcement updated.');
      } else {
        await cmsApi.createAnnouncement({
          title: title.trim(),
          message: message.trim(),
          priority,
          status,
          publishedAt: publishedAt ? `${publishedAt}:00Z` : undefined,
          expiresAt: expiresAt.trim() || undefined,
        });
        setFeedback(
          status === 'published'
            ? 'Announcement published.'
            : 'Announcement saved as draft.',
        );
      }
      setEditorOpen(false);
      resetForm();
      await loadItems();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to save announcement.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (
    item: CmsAnnouncement,
    status: PublishStatus,
  ) => {
    try {
      await cmsApi.publishAnnouncement(item.id, status);
      setFeedback(`Announcement "${item.title}" marked as ${status}.`);
      await loadItems();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Status update failed.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await cmsApi.deleteAnnouncement(deleteTarget.id);
      setDeleteTarget(null);
      setFeedback('Announcement permanently deleted.');
      await loadItems();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#0F213E]">
            School Announcements
          </h2>
          <p className="text-sm text-[#5B6472]">
            Publish urgent, important, or normal parent notices with optional
            expiry dates.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            resetForm();
            setEditorOpen(true);
          }}
          className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F213E] text-[#FBF9F5] text-sm font-medium hover:bg-[#172E54] cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Announcement</span>
        </button>
      </div>

      {feedback && (
        <div
          role="status"
          className="p-4 bg-[#FFFFFF] border border-[#B58E43] text-sm text-[#0F213E] flex items-center justify-between"
        >
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs text-[#5B6472]"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="p-4 bg-[#FFF5F2] border border-[#E6B8A8] text-sm text-[#9A3412]"
        >
          {error}
        </div>
      )}

      {editorOpen && (
        <form
          onSubmit={(e) => handleSave(e, 'draft')}
          className="bg-[#FFFFFF] border border-[#E6DFD3] p-6 sm:p-8 space-y-5"
        >
          <div className="flex items-center justify-between pb-4 border-b border-[#E6DFD3]">
            <h3 className="font-serif text-2xl font-semibold text-[#0F213E]">
              {editingId ? 'Edit Announcement' : 'Create Announcement'}
            </h3>
            <button
              type="button"
              onClick={() => setEditorOpen(false)}
              className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center text-[#5B6472]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#0F213E] mb-1">
                Announcement Title <span className="text-[#8D6A26]">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 bg-[#FBF9F5] border border-[#D4C8B4] text-sm"
                placeholder="e.g. Term Reopening Reminder"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0F213E] mb-1">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as AnnouncementPriority)
                }
                className="w-full min-h-[44px] px-3.5 py-2 bg-[#FBF9F5] border border-[#D4C8B4] text-sm"
              >
                {ANNOUNCEMENT_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0F213E] mb-1">
                Optional Expiry Date (Leave blank for no expiry)
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 bg-[#FBF9F5] border border-[#D4C8B4] text-sm tabular-nums"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#0F213E] mb-1">
                Publication Date & Time (UTC, Optional)
              </label>
              <input
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 bg-[#FBF9F5] border border-[#D4C8B4] text-sm tabular-nums"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#0F213E] mb-1">
                Message <span className="text-[#8D6A26]">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#FBF9F5] border border-[#D4C8B4] text-sm"
                placeholder="Write the clear notice for parents and guardians..."
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#E6DFD3] flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() =>
                setPreviewItem({
                  id: 'preview',
                  title: title || 'Untitled Announcement',
                  message: message || 'Announcement message preview.',
                  priority,
                  publishedAt: publishedAt
                    ? `${publishedAt}:00Z`
                    : new Date().toISOString(),
                  expiresAt: expiresAt || null,
                })
              }
              className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 border border-[#D4C8B4] bg-[#FBF9F5] text-sm font-medium text-[#0F213E] cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={(e) => handleSave(e, 'draft')}
                className="min-h-[40px] px-4 py-2 border border-[#D4C8B4] bg-[#FFFFFF] text-sm font-medium text-[#0F213E] cursor-pointer"
              >
                Save Draft
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={(e) => handleSave(e, 'published')}
                className="min-h-[40px] px-5 py-2 bg-[#0F213E] text-[#FBF9F5] text-sm font-medium hover:bg-[#172E54] cursor-pointer"
              >
                {saving ? 'Saving...' : 'Publish Announcement'}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="bg-[#FFFFFF] border border-[#E6DFD3] p-4 flex flex-wrap gap-1.5">
        {['all', 'published', 'draft', 'archived'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-medium capitalize cursor-pointer ${
              statusFilter === st
                ? 'bg-[#0F213E] text-[#FBF9F5]'
                : 'bg-[#F4EFE6] text-[#333D4D]'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-44 bg-[#FFFFFF] border border-[#E6DFD3] animate-pulse" />
      ) : items.length === 0 ? (
        <div className="p-12 bg-[#FFFFFF] border border-[#E6DFD3] text-center space-y-2">
          <p className="font-serif text-2xl font-semibold text-[#0F213E]">
            No announcements found
          </p>
          <p className="text-sm text-[#5B6472]">
            Create an announcement to notify parents on the public homepage and
            news page.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <article
              key={item.id}
              className="bg-[#FFFFFF] border border-[#E6DFD3] p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <PriorityLabel priority={item.priority} />
                  <span aria-hidden="true" className="text-[#D4C8B4]">
                    ·
                  </span>
                  <PublishStatusLabel status={item.status} />
                  {item.isExpired && (
                    <>
                      <span aria-hidden="true" className="text-[#D4C8B4]">
                        ·
                      </span>
                      <span className="text-xs font-semibold text-[#9A3412] uppercase tracking-[0.12em]">
                        Expired
                      </span>
                    </>
                  )}
                </div>

                <h3 className="font-serif text-2xl font-semibold text-[#0F213E]">
                  {item.title}
                </h3>
                <p className="text-sm text-[#333D4D]">{item.message}</p>
                <p className="text-xs text-[#5B6472] tabular-nums">
                  Published: {formatDisplayDate(item.publishedAt)} · Expiry:{' '}
                  {item.expiresAt ? formatDisplayDate(item.expiresAt) : 'None'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  className="min-h-[38px] inline-flex items-center gap-1 px-3 py-1.5 border border-[#D4C8B4] bg-[#FFFFFF] text-xs font-medium text-[#0F213E] cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                {item.status !== 'published' ? (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(item, 'published')}
                    className="min-h-[38px] inline-flex items-center gap-1 px-3 py-1.5 bg-[#0F213E] text-[#FBF9F5] text-xs font-medium cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Publish</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(item, 'draft')}
                    className="min-h-[38px] inline-flex items-center gap-1 px-3 py-1.5 border border-[#D4C8B4] bg-[#FFFFFF] text-xs font-medium text-[#0F213E] cursor-pointer"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Unpublish</span>
                  </button>
                )}
                {item.status !== 'archived' && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(item, 'archived')}
                    className="min-h-[38px] inline-flex items-center gap-1 px-3 py-1.5 border border-[#D4C8B4] bg-[#FFFFFF] text-xs font-medium text-[#5B6472] cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Archive</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDeleteTarget(item)}
                  className="min-h-[38px] inline-flex items-center gap-1 px-3 py-1.5 border border-[#E6B8A8] bg-[#FFFFFF] text-xs font-medium text-[#9A3412] cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A1629]/75"
          role="dialog"
          aria-modal="true"
          aria-label="Announcement preview"
        >
          <div className="w-full max-w-lg bg-[#FBF9F5] border border-[#E6DFD3] shadow-2xl">
            <div className="px-6 py-4 bg-[#0F213E] text-[#FBF9F5] flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.16em] text-[#D4B46E]">
                Announcement Preview
              </span>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <PriorityLabel priority={previewItem.priority} />
              <h3 className="font-serif text-2xl font-semibold text-[#0F213E]">
                {previewItem.title}
              </h3>
              <div className="space-y-3 text-sm text-[#333D4D] leading-relaxed">
                {splitParagraphs(previewItem.message).map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Announcement"
        description={
          deleteTarget
            ? `Permanently delete "${deleteTarget.title}"?`
            : ''
        }
        confirmLabel="Delete Permanently"
        isDanger
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
