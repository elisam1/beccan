import {
  AlertTriangle,
  Archive,
  CalendarDays,
  Edit3,
  Eye,
  EyeOff,
  MapPin,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from 'react';
import { ApiError, cmsApi } from '../../services/cmsApi';
import {
  CmsEvent,
  MediaStorageSummary,
  PhpUploadEnvironment,
  PublishStatus,
} from '../../types/cms';
import {
  formatDisplayDate,
  formatFileSize,
  formatTimeRange,
  splitParagraphs,
} from '../../utils/formatting';
import { ConfirmDialog } from './ConfirmDialog';
import { EventTimeStatusLabel, PublishStatusLabel } from './StatusLabel';

export function AdminEventsSection() {
  const [events, setEvents] = useState<CmsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venue, setVenue] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [removeCoverImage, setRemoveCoverImage] = useState(false);
  const [saving, setSaving] = useState(false);

  const [previewEvent, setPreviewEvent] = useState<CmsEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CmsEvent | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [storage, setStorage] = useState<MediaStorageSummary | null>(null);
  const [phpEnv, setPhpEnv] = useState<PhpUploadEnvironment | null>(null);

  const loadStorageInfo = useCallback(async () => {
    try {
      const res = await cmsApi.getStorageAndLimits();
      setStorage(res.storage);
      setPhpEnv(res.phpEnvironment);
    } catch {
      // Non-blocking
    }
  }, []);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cmsApi.listAdminEvents(statusFilter);
      setEvents(res.items);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadEvents();
    void loadStorageInfo();
  }, [loadEvents, loadStorageInfo]);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setEventDate('');
    setStartTime('');
    setEndTime('');
    setVenue('');
    setCoverFile(null);
    setCoverPreview(null);
    setRemoveCoverImage(false);
  };

  const openEdit = (ev: CmsEvent) => {
    setEditingId(ev.id);
    setTitle(ev.title);
    setDescription(ev.description);
    setEventDate(ev.eventDate);
    setStartTime(ev.startTime || '');
    setEndTime(ev.endTime || '');
    setVenue(ev.venue);
    setCoverFile(null);
    setCoverPreview(ev.coverThumbnailUrl || ev.coverImageUrl);
    setRemoveCoverImage(false);
    setEditorOpen(true);
  };

  const handleCoverChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setRemoveCoverImage(false);
  };

  const handleSave = async (e: FormEvent, status: PublishStatus) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFeedback(null);

    const formData = new FormData();
    if (editingId) formData.append('id', editingId);
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('eventDate', eventDate);
    formData.append('startTime', startTime);
    formData.append('endTime', endTime);
    formData.append('venue', venue.trim());
    formData.append('status', status);
    if (coverFile) formData.append('coverImage', coverFile);
    if (removeCoverImage) formData.append('removeCoverImage', '1');

    try {
      if (editingId) {
        await cmsApi.updateEvent(formData);
        setFeedback('Event updated.');
      } else {
        await cmsApi.createEvent(formData);
        setFeedback(
          status === 'published'
            ? 'Event created and published.'
            : 'Event saved as draft.',
        );
      }
      setEditorOpen(false);
      resetForm();
      await loadEvents();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save event.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (ev: CmsEvent, status: PublishStatus) => {
    try {
      await cmsApi.publishEvent(ev.id, status);
      setFeedback(`Event "${ev.title}" marked as ${status}.`);
      await loadEvents();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Status update failed.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await cmsApi.deleteEvent(deleteTarget.id);
      setDeleteTarget(null);
      setFeedback('Event permanently deleted.');
      await loadEvents();
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
            School Events
          </h2>
          <p className="text-sm text-[#5B6472]">
            Manage school calendar events. Published events automatically group
            into upcoming and past on the website.
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
          <span>New Event</span>
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
              {editingId ? 'Edit Event' : 'Create Event'}
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
                Event Title <span className="text-[#8D6A26]">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 bg-[#FBF9F5] border border-[#D4C8B4] text-sm"
                placeholder="e.g. Parent-Teacher Association Open Day"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0F213E] mb-1">
                Event Date <span className="text-[#8D6A26]">*</span>
              </label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 bg-[#FBF9F5] border border-[#D4C8B4] text-sm tabular-nums"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0F213E] mb-1">
                Venue <span className="text-[#8D6A26]">*</span>
              </label>
              <input
                type="text"
                required
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 bg-[#FBF9F5] border border-[#D4C8B4] text-sm"
                placeholder="e.g. Beccan School Courtyard, Dodowa"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0F213E] mb-1">
                Start Time (Optional)
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 bg-[#FBF9F5] border border-[#D4C8B4] text-sm tabular-nums"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0F213E] mb-1">
                End Time (Optional)
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 bg-[#FBF9F5] border border-[#D4C8B4] text-sm tabular-nums"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#0F213E] mb-1">
                Description <span className="text-[#8D6A26]">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#FBF9F5] border border-[#D4C8B4] text-sm"
                placeholder="Event schedule, participants, and parent notes..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#0F213E] mb-1.5">
                Optional Event Image
              </label>
              <div className="flex flex-wrap items-center gap-4">
                <label className="min-h-[40px] inline-flex items-center gap-2 px-4 py-2 border border-[#D4C8B4] bg-[#FBF9F5] text-xs font-medium text-[#0F213E] cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Image</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleCoverChange}
                    className="sr-only"
                  />
                </label>

                {coverPreview && (
                  <div className="flex items-center gap-3">
                    <img
                      src={coverPreview}
                      alt="Event preview"
                      className="w-20 h-14 object-cover border border-[#E6DFD3]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCoverFile(null);
                        setCoverPreview(null);
                        setRemoveCoverImage(true);
                      }}
                      className="text-xs text-[#9A3412] underline cursor-pointer"
                    >
                      Remove Image
                    </button>
                  </div>
                )}
              </div>
              {phpEnv && (
                <p className="text-xs text-[#5B6472] mt-1.5 tabular-nums">
                  Stored privately until event publication. Server limit:{' '}
                  {phpEnv.uploadMaxFilesize} per file.
                </p>
              )}
              {(storage?.approachingLimit ||
                storage?.overLimit ||
                (phpEnv && (!phpEnv.gdLoaded || !phpEnv.fileinfoLoaded))) && (
                <p className="mt-2 text-xs text-[#9A3412] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {phpEnv && (!phpEnv.gdLoaded || !phpEnv.fileinfoLoaded)
                      ? 'Image uploads disabled until PHP GD and Fileinfo extensions are enabled.'
                      : storage?.overLimit
                        ? `Media storage limit reached (${formatFileSize(storage.totalBytes)}). Event image upload will be blocked.`
                        : `Storage at ${storage?.usagePercent}% of limit (${formatFileSize(storage?.remainingBytes || 0)} remaining).`}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#E6DFD3] flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() =>
                setPreviewEvent({
                  id: 'preview',
                  title: title || 'Untitled Event',
                  description: description || 'Event description preview.',
                  eventDate: eventDate || new Date().toISOString().slice(0, 10),
                  startTime: startTime || null,
                  endTime: endTime || null,
                  venue: venue || 'Beccan School Campus',
                  coverImageUrl: coverPreview,
                  coverThumbnailUrl: coverPreview,
                  isUpcoming: true,
                })
              }
              className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 border border-[#D4C8B4] bg-[#FBF9F5] text-sm font-medium text-[#0F213E] cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Preview Event</span>
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
                {saving ? 'Saving...' : 'Publish Event'}
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
      ) : events.length === 0 ? (
        <div className="p-12 bg-[#FFFFFF] border border-[#E6DFD3] text-center space-y-2">
          <p className="font-serif text-2xl font-semibold text-[#0F213E]">
            No events scheduled
          </p>
          <p className="text-sm text-[#5B6472]">
            Add a school event to publish it to the public calendar.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((ev) => (
            <article
              key={ev.id}
              className="bg-[#FFFFFF] border border-[#E6DFD3] p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4 flex-1">
                {ev.coverThumbnailUrl && (
                  <img
                    src={ev.coverThumbnailUrl}
                    alt={ev.title}
                    className="w-24 h-20 object-cover border border-[#E6DFD3] shrink-0 hidden sm:block"
                  />
                )}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <EventTimeStatusLabel isUpcoming={Boolean(ev.isUpcoming)} />
                    <span aria-hidden="true" className="text-[#D4C8B4]">
                      ·
                    </span>
                    <PublishStatusLabel status={ev.status} />
                  </div>
                  <h3 className="font-serif text-2xl font-semibold text-[#0F213E]">
                    {ev.title}
                  </h3>
                  <p className="text-sm text-[#333D4D]">{ev.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#5B6472] pt-1 tabular-nums">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-[#8D6A26]" />
                      {formatDisplayDate(ev.eventDate)} ·{' '}
                      {formatTimeRange(ev.startTime, ev.endTime)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#8D6A26]" />
                      {ev.venue}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(ev)}
                  className="min-h-[38px] inline-flex items-center gap-1 px-3 py-1.5 border border-[#D4C8B4] bg-[#FFFFFF] text-xs font-medium text-[#0F213E] cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                {ev.status !== 'published' ? (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(ev, 'published')}
                    className="min-h-[38px] inline-flex items-center gap-1 px-3 py-1.5 bg-[#0F213E] text-[#FBF9F5] text-xs font-medium cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Publish</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(ev, 'draft')}
                    className="min-h-[38px] inline-flex items-center gap-1 px-3 py-1.5 border border-[#D4C8B4] bg-[#FFFFFF] text-xs font-medium text-[#0F213E] cursor-pointer"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Unpublish</span>
                  </button>
                )}
                {ev.status !== 'archived' && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(ev, 'archived')}
                    className="min-h-[38px] inline-flex items-center gap-1 px-3 py-1.5 border border-[#D4C8B4] bg-[#FFFFFF] text-xs font-medium text-[#5B6472] cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Archive</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDeleteTarget(ev)}
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

      {previewEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A1629]/75"
          role="dialog"
          aria-modal="true"
          aria-label="Event preview"
        >
          <div className="w-full max-w-lg bg-[#FBF9F5] border border-[#E6DFD3] shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-[#0F213E] text-[#FBF9F5] flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.16em] text-[#D4B46E]">
                Event Preview
              </span>
              <button
                type="button"
                onClick={() => setPreviewEvent(null)}
                className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {previewEvent.coverImageUrl && (
                <img
                  src={previewEvent.coverImageUrl}
                  alt={previewEvent.title}
                  className="w-full aspect-[16/9] object-cover border border-[#E6DFD3]"
                />
              )}
              <h3 className="font-serif text-2xl font-semibold text-[#0F213E]">
                {previewEvent.title}
              </h3>
              <p className="text-xs text-[#5B6472] tabular-nums">
                {formatDisplayDate(previewEvent.eventDate)} ·{' '}
                {formatTimeRange(previewEvent.startTime, previewEvent.endTime)}{' '}
                · {previewEvent.venue}
              </p>
              <div className="space-y-2 text-sm text-[#333D4D] leading-relaxed">
                {splitParagraphs(previewEvent.description).map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Event"
        description={
          deleteTarget
            ? `Permanently delete "${deleteTarget.title}" and any uploaded cover image?`
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
