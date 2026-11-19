import {
  Check,
  Edit3,
  Eye,
  EyeOff,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from 'react';
import {
  ApiError,
  cmsApi,
  GALLERY_CATEGORIES,
} from '../../services/cmsApi';
import { CmsGalleryCategory, CmsGalleryPhoto } from '../../types/cms';
import { formatDisplayDate, formatFileSize } from '../../utils/formatting';
import { ConfirmDialog } from './ConfirmDialog';
import { PublishStatusLabel } from './StatusLabel';

interface StagedUpload {
  file: File;
  previewUrl: string;
  caption: string;
  description: string;
  category: CmsGalleryCategory;
}

export function AdminGallerySection() {
  const [items, setItems] = useState<CmsGalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Staged local previews prior to upload
  const [staged, setStaged] = useState<StagedUpload[]>([]);
  const [uploading, setUploading] = useState(false);

  // Editing modal state
  const [editing, setEditing] = useState<CmsGalleryPhoto | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] =
    useState<CmsGalleryCategory>('School Life');
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<CmsGalleryPhoto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cmsApi.listAdminGallery({
        category: filterCategory,
        status: filterStatus,
        q: searchQuery,
      });
      setItems(res.items);
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to load gallery.',
      );
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterStatus, searchQuery]);

  useEffect(() => {
    void loadPhotos();
  }, [loadPhotos]);

  useEffect(() => {
    return () => {
      staged.forEach((s) => URL.revokeObjectURL(s.previewUrl));
    };
  }, [staged]);

  const handleSelectFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(e.target.files || []);
    if (fileList.length === 0) return;

    const nextStaged: StagedUpload[] = fileList.slice(0, 12).map((file) => {
      const baseCaption = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
      return {
        file,
        previewUrl: URL.createObjectURL(file),
        caption: baseCaption,
        description: '',
        category: 'School Life',
      };
    });
    setStaged((prev) => [...prev, ...nextStaged].slice(0, 12));
    e.target.value = '';
  };

  const removeStaged = (index: number) => {
    setStaged((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleUploadSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (staged.length === 0) return;
    setUploading(true);
    setError(null);
    setFeedback(null);

    try {
      const formData = new FormData();
      staged.forEach((item) => {
        formData.append('photos[]', item.file);
        formData.append('captions[]', item.caption.trim() || 'Campus Photograph');
        formData.append('descriptions[]', item.description.trim());
        formData.append('categories[]', item.category);
      });
      const res = await cmsApi.uploadGalleryPhotos(formData);
      staged.forEach((s) => URL.revokeObjectURL(s.previewUrl));
      setStaged([]);
      setFeedback(
        `${res.items.length} photograph${res.items.length === 1 ? '' : 's'} uploaded as unpublished draft${res.items.length === 1 ? '' : 's'}. Review and click Publish when ready.`,
      );
      await loadPhotos();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const togglePublish = async (photo: CmsGalleryPhoto) => {
    const nextStatus = photo.status === 'published' ? 'draft' : 'published';
    setError(null);
    try {
      await cmsApi.updateGalleryPhoto({ id: photo.id, status: nextStatus });
      setFeedback(
        nextStatus === 'published'
          ? `"${photo.caption}" is now published on the public gallery.`
          : `"${photo.caption}" was unpublished and hidden from public view.`,
      );
      await loadPhotos();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Status update failed.');
    }
  };

  const openEdit = (photo: CmsGalleryPhoto) => {
    setEditing(photo);
    setEditCaption(photo.caption);
    setEditDescription(photo.description);
    setEditCategory(photo.category);
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSavingEdit(true);
    setError(null);
    try {
      await cmsApi.updateGalleryPhoto({
        id: editing.id,
        caption: editCaption,
        description: editDescription,
        category: editCategory,
      });
      setEditing(null);
      setFeedback('Photograph details updated.');
      await loadPhotos();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Update failed.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await cmsApi.deleteGalleryPhoto(deleteTarget.id);
      setDeleteTarget(null);
      setFeedback('Photograph and image files permanently deleted.');
      await loadPhotos();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Upload & Preview Queue */}
      <form
        onSubmit={handleUploadSubmit}
        className="bg-[#FFFFFF] border border-[#E6DFD3] p-6 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-[#0F213E]">
              Upload Photographs
            </h2>
            <p className="text-xs sm:text-sm text-[#5B6472] mt-1">
              Accepts JPEG, PNG, or WebP up to 6 MB each. Uploaded photos stay{' '}
              <strong>unpublished</strong> until you confirm publication.
            </p>
          </div>

          <label className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F213E] text-[#FBF9F5] text-sm font-medium hover:bg-[#172E54] transition-colors cursor-pointer whitespace-nowrap shrink-0">
            <Upload className="w-4 h-4" />
            <span>Select Photos</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleSelectFiles}
              className="sr-only"
            />
          </label>
        </div>

        {staged.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-[#E6DFD3]">
            <p className="text-xs uppercase tracking-[0.14em] text-[#8D6A26] font-medium">
              Preview Before Upload ({staged.length} selected)
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {staged.map((item, idx) => (
                <div
                  key={`${item.file.name}-${idx}`}
                  className="p-4 bg-[#FBF9F5] border border-[#E6DFD3] space-y-3"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={item.previewUrl}
                      alt={item.caption}
                      className="w-24 h-20 object-cover border border-[#E6DFD3] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#0F213E] truncate">
                        {item.file.name}
                      </p>
                      <p className="text-xs text-[#5B6472] tabular-nums">
                        {formatFileSize(item.file.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStaged(idx)}
                      className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center text-[#5B6472] hover:text-[#9A3412]"
                      aria-label="Remove staged photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#0F213E] mb-1">
                      Caption
                    </label>
                    <input
                      type="text"
                      required
                      value={item.caption}
                      onChange={(e) =>
                        setStaged((prev) =>
                          prev.map((s, i) =>
                            i === idx ? { ...s, caption: e.target.value } : s,
                          ),
                        )
                      }
                      className="w-full min-h-[40px] px-3 py-1.5 bg-[#FFFFFF] border border-[#D4C8B4] text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#0F213E] mb-1">
                        Category
                      </label>
                      <select
                        value={item.category}
                        onChange={(e) =>
                          setStaged((prev) =>
                            prev.map((s, i) =>
                              i === idx
                                ? {
                                    ...s,
                                    category: e.target.value as CmsGalleryCategory,
                                  }
                                : s,
                            ),
                          )
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 bg-[#FFFFFF] border border-[#D4C8B4] text-sm"
                      >
                        {GALLERY_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#0F213E] mb-1">
                        Description (Optional)
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          setStaged((prev) =>
                            prev.map((s, i) =>
                              i === idx
                                ? { ...s, description: e.target.value }
                                : s,
                            ),
                          )
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 bg-[#FFFFFF] border border-[#D4C8B4] text-sm"
                        placeholder="Short context"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  staged.forEach((s) => URL.revokeObjectURL(s.previewUrl));
                  setStaged([]);
                }}
                className="min-h-[44px] px-4 py-2 border border-[#D4C8B4] text-sm text-[#0F213E] cursor-pointer"
              >
                Clear Queue
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="min-h-[44px] px-6 py-2 bg-[#B58E43] text-[#0A1629] text-sm font-semibold hover:bg-[#D4B46E] transition-colors cursor-pointer disabled:opacity-60"
              >
                {uploading
                  ? 'Uploading & Optimising...'
                  : `Upload ${staged.length} as Draft`}
              </button>
            </div>
          </div>
        )}
      </form>

      {feedback && (
        <div
          role="status"
          className="p-4 bg-[#FFFFFF] border border-[#B58E43] text-sm text-[#0F213E] flex items-center justify-between gap-4"
        >
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs text-[#5B6472] hover:text-[#0F213E]"
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

      {/* Search & Filters */}
      <div className="bg-[#FFFFFF] border border-[#E6DFD3] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#5B6472] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search captions or descriptions..."
            className="w-full min-h-[40px] pl-9 pr-3 py-2 bg-[#FBF9F5] border border-[#D4C8B4] text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Filter by category"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="min-h-[40px] px-3 py-2 bg-[#FBF9F5] border border-[#D4C8B4] text-sm"
          >
            <option value="All">All Categories</option>
            {GALLERY_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by publication status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="min-h-[40px] px-3 py-2 bg-[#FBF9F5] border border-[#D4C8B4] text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published Only</option>
            <option value="draft">Unpublished Drafts</option>
          </select>
        </div>
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-72 bg-[#FFFFFF] border border-[#E6DFD3] animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 bg-[#FFFFFF] border border-[#E6DFD3] text-center space-y-2">
          <p className="font-serif text-2xl font-semibold text-[#0F213E]">
            No photographs found
          </p>
          <p className="text-sm text-[#5B6472]">
            Upload photographs above or adjust your search and category filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((photo) => (
            <article
              key={photo.id}
              className="bg-[#FFFFFF] border border-[#E6DFD3] flex flex-col justify-between"
            >
              <div>
                <div className="aspect-[4/3] bg-[#F4EFE6] overflow-hidden border-b border-[#E6DFD3]">
                  <img
                    src={photo.thumbnailUrl || photo.imageUrl}
                    alt={photo.caption}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="p-5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs uppercase tracking-[0.14em] text-[#8D6A26] font-medium">
                      {photo.category}
                    </span>
                    <PublishStatusLabel status={photo.status} />
                  </div>

                  <h3 className="font-serif text-xl font-semibold text-[#0F213E] leading-snug">
                    {photo.caption}
                  </h3>

                  {photo.description && (
                    <p className="text-sm text-[#333D4D] leading-relaxed">
                      {photo.description}
                    </p>
                  )}

                  <p className="text-xs text-[#5B6472] tabular-nums">
                    Uploaded {formatDisplayDate(photo.uploadedAt)}
                    {photo.width && photo.height
                      ? ` · ${photo.width}×${photo.height}`
                      : ''}
                  </p>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-[#FBF9F5] border-t border-[#E6DFD3] flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => togglePublish(photo)}
                  className={`min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                    photo.status === 'published'
                      ? 'border border-[#D4C8B4] bg-[#FFFFFF] text-[#0F213E] hover:border-[#0F213E]'
                      : 'bg-[#0F213E] text-[#FBF9F5] hover:bg-[#172E54]'
                  }`}
                >
                  {photo.status === 'published' ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Unpublish</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Publish</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(photo)}
                    className="min-h-[38px] inline-flex items-center gap-1 px-3 py-1.5 border border-[#D4C8B4] bg-[#FFFFFF] text-xs font-medium text-[#0F213E] hover:border-[#0F213E] cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(photo)}
                    className="min-h-[38px] inline-flex items-center gap-1 px-3 py-1.5 border border-[#E6B8A8] bg-[#FFFFFF] text-xs font-medium text-[#9A3412] hover:bg-[#FFF5F2] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A1629]/70"
          role="dialog"
          aria-modal="true"
          aria-label="Edit photograph metadata"
        >
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-lg bg-[#FFFFFF] border border-[#E6DFD3] shadow-xl"
          >
            <div className="px-6 py-4 bg-[#FBF9F5] border-b border-[#E6DFD3] flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold text-[#0F213E]">
                Edit Photograph Details
              </h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center text-[#5B6472]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0F213E] mb-1">
                  Caption
                </label>
                <input
                  type="text"
                  required
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 bg-[#FBF9F5] border border-[#D4C8B4] text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0F213E] mb-1">
                  Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) =>
                    setEditCategory(e.target.value as CmsGalleryCategory)
                  }
                  className="w-full min-h-[44px] px-3.5 py-2 bg-[#FBF9F5] border border-[#D4C8B4] text-sm"
                >
                  {GALLERY_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0F213E] mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#FBF9F5] border border-[#D4C8B4] text-sm"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-[#F4EFE6] border-t border-[#E6DFD3] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="min-h-[40px] px-4 py-2 bg-[#FFFFFF] border border-[#D4C8B4] text-sm font-medium text-[#0F213E]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="min-h-[40px] inline-flex items-center gap-1.5 px-5 py-2 bg-[#0F213E] text-[#FBF9F5] text-sm font-medium"
              >
                <Check className="w-4 h-4" />
                <span>{savingEdit ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Photograph"
        description={
          deleteTarget
            ? `Permanently delete "${deleteTarget.caption}" and remove its uploaded image files from the server?`
            : ''
        }
        confirmLabel="Delete Permanently"
        isDanger
        busy={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
