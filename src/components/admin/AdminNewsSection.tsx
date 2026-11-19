import {
  AlertTriangle,
  Archive,
  Edit3,
  Eye,
  EyeOff,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from 'react';
import { ApiError, cmsApi, NEWS_CATEGORIES } from '../../services/cmsApi';
import {
  CmsNewsArticle,
  CmsNewsCategory,
  MediaStorageSummary,
  PhpUploadEnvironment,
  PublishStatus,
} from '../../types/cms';
import {
  formatDisplayDate,
  formatFileSize,
  splitParagraphs,
  toDatetimeLocalInput,
} from '../../utils/formatting';
import { ConfirmDialog } from './ConfirmDialog';
import { PublishStatusLabel } from './StatusLabel';

type StatusTab = 'all' | 'published' | 'draft' | 'archived';

export function AdminNewsSection() {
  const [articles, setArticles] = useState<CmsNewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [statusTab, setStatusTab] = useState<StatusTab>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<CmsNewsCategory>('General News');
  const [status, setStatus] = useState<PublishStatus>('draft');
  const [publishedAt, setPublishedAt] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [removeCoverImage, setRemoveCoverImage] = useState(false);
  const [saving, setSaving] = useState(false);

  // Preview & Delete modals
  const [previewArticle, setPreviewArticle] = useState<CmsNewsArticle | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<CmsNewsArticle | null>(null);
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

  const loadArticles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cmsApi.listAdminNews({
        status: statusTab,
        category: categoryFilter,
        q: searchQuery,
      });
      setArticles(res.items);
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to load news articles.',
      );
    } finally {
      setLoading(false);
    }
  }, [statusTab, categoryFilter, searchQuery]);

  useEffect(() => {
    void loadArticles();
    void loadStorageInfo();
  }, [loadArticles, loadStorageInfo]);

  const resetEditor = () => {
    setEditingId(null);
    setTitle('');
    setSummary('');
    setContent('');
    setCategory('General News');
    setStatus('draft');
    setPublishedAt('');
    setCoverFile(null);
    setCoverPreview(null);
    setRemoveCoverImage(false);
  };

  const openCreate = () => {
    resetEditor();
    setEditorOpen(true);
  };

  const openEdit = (article: CmsNewsArticle) => {
    setEditingId(article.id);
    setTitle(article.title);
    setSummary(article.summary);
    setContent(article.content);
    setCategory(article.category);
    setStatus(article.status || 'draft');
    setPublishedAt(toDatetimeLocalInput(article.publishedAt));
    setCoverFile(null);
    setCoverPreview(article.coverThumbnailUrl || article.coverImageUrl);
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

  const handleSave = async (e: FormEvent, overrideStatus?: PublishStatus) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFeedback(null);

    const targetStatus = overrideStatus || status;
    const formData = new FormData();
    if (editingId) formData.append('id', editingId);
    formData.append('title', title.trim());
    formData.append('summary', summary.trim());
    formData.append('content', content.trim());
    formData.append('category', category);
    formData.append('status', targetStatus);
    if (publishedAt) {
      formData.append('publishedAt', `${publishedAt}:00Z`);
    } else if (editingId) {
      formData.append('publishedAt', '');
    }
    if (coverFile) {
      formData.append('coverImage', coverFile);
    }
    if (removeCoverImage) {
      formData.append('removeCoverImage', '1');
    }

    try {
      if (editingId) {
        await cmsApi.updateNewsArticle(formData);
        setFeedback('News article updated.');
      } else {
        await cmsApi.createNewsArticle(formData);
        setFeedback(
          targetStatus === 'published'
            ? 'News article created and published.'
            : 'News article saved as draft.',
        );
      }
      setEditorOpen(false);
      resetEditor();
      await loadArticles();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save article.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (
    article: CmsNewsArticle,
    nextStatus: PublishStatus,
  ) => {
    try {
      await cmsApi.publishNewsArticle(article.id, nextStatus);
      setFeedback(`Article "${article.title}" marked as ${nextStatus}.`);
      await loadArticles();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Status update failed.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await cmsApi.deleteNewsArticle(deleteTarget.id);
      setDeleteTarget(null);
      setFeedback('Article deleted.');
      await loadArticles();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  const openEditorPreview = () => {
    setPreviewArticle({
      id: editingId || 'preview',
      title: title || 'Untitled Article',
      slug: 'preview',
      summary: summary || 'Article summary preview.',
      content: content || 'No body content entered yet.',
      coverImageUrl: coverPreview,
      coverThumbnailUrl: coverPreview,
      category,
      status,
      updatedAt: new Date().toISOString(),
      publishedAt: publishedAt ? `${publishedAt}:00Z` : new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#0F213E]">
            School News Articles
          </h2>
          <p className="text-sm text-[#5B6472]">
            Create, preview, publish, unpublish, or archive school articles.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F213E] text-[#FBF9F5] text-sm font-medium hover:bg-[#172E54] transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Article</span>
        </button>
      </div>

      {feedback && (
        <div
          role="status"
          className="p-4 bg-[#FFFFFF] border border-[#B58E43] text-sm text-[#0F213E] flex items-center justify-between gap-4"
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

      {/* Editor Panel */}
      {editorOpen && (
        <form
          onSubmit={(e) => handleSave(e)}
          className="bg-[#FFFFFF] border border-[#E6DFD3] p-6 sm:p-8 space-y-5"
        >
          <div className="flex items-center justify-between pb-4 border-b border-[#E6DFD3]">
            <h3 className="font-serif text-2xl font-semibold text-[#0F213E]">
              {editingId ? 'Edit News Article' : 'Create News Article'}
            </h3>
            <button
              type="button"
              onClick={() => setEditorOpen(false)}
              className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center text-[#5B6472]"
              aria-label="Close editor"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#0F213E] mb-1">
                Article Title <span className="text-[#8D6A26]">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 bg-[#FBF9F5] border border-[#D4C8B4] text-sm"
                placeholder="e.g. Term One Orientation & Parent Meeting"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0F213E] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CmsNewsCategory)}
                className="w-full min-h-[44px] px-3.5 py-2 bg-[#FBF9F5] border border-[#D4C8B4] text-sm"
              >
                {NEWS_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
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
                Short Summary <span className="text-[#8D6A26]">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#FBF9F5] border border-[#D4C8B4] text-sm"
                placeholder="Concise 1-2 sentence summary shown on news listings..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#0F213E] mb-1">
                Full Article Content (Plain Text Paragraphs){' '}
                <span className="text-[#8D6A26]">*</span>
              </label>
              <textarea
                rows={7}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FBF9F5] border border-[#D4C8B4] text-sm leading-relaxed"
                placeholder="Separate paragraphs with a blank line. HTML/script tags are stripped automatically for safety."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#0F213E] mb-1.5">
                Cover Photograph (Optional)
              </label>
              <div className="flex flex-wrap items-center gap-4">
                <label className="min-h-[40px] inline-flex items-center gap-2 px-4 py-2 border border-[#D4C8B4] bg-[#FBF9F5] text-xs font-medium text-[#0F213E] hover:border-[#0F213E] cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Cover Image</span>
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
                      alt="Cover preview"
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
                      Remove Cover
                    </button>
                  </div>
                )}
              </div>
              {phpEnv && (
                <p className="text-xs text-[#5B6472] mt-1.5 tabular-nums">
                  Stored privately until article publication. Server limit:{' '}
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
                        ? `Media storage limit reached (${formatFileSize(storage.totalBytes)}). Cover upload will be blocked.`
                        : `Storage at ${storage?.usagePercent}% of limit (${formatFileSize(storage?.remainingBytes || 0)} remaining).`}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#E6DFD3] flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={openEditorPreview}
              className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 border border-[#D4C8B4] bg-[#FBF9F5] text-sm font-medium text-[#0F213E] hover:border-[#0F213E] cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Preview Article</span>
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={(e) => handleSave(e, 'draft')}
                className="min-h-[40px] px-4 py-2 border border-[#D4C8B4] bg-[#FFFFFF] text-sm font-medium text-[#0F213E] hover:border-[#0F213E] cursor-pointer"
              >
                Save as Draft
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={(e) => handleSave(e, 'published')}
                className="min-h-[40px] px-5 py-2 bg-[#0F213E] text-[#FBF9F5] text-sm font-medium hover:bg-[#172E54] cursor-pointer"
              >
                {saving ? 'Saving...' : 'Publish Article'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="bg-[#FFFFFF] border border-[#E6DFD3] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="inline-flex flex-wrap gap-1 p-1 bg-[#F4EFE6] border border-[#E6DFD3]">
          {(['all', 'published', 'draft', 'archived'] as StatusTab[]).map(
            (tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusTab(tab)}
                className={`min-h-[38px] px-3.5 py-1.5 text-xs font-medium capitalize cursor-pointer ${
                  statusTab === tab
                    ? 'bg-[#0F213E] text-[#FBF9F5]'
                    : 'text-[#333D4D] hover:text-[#0F213E]'
                }`}
              >
                {tab}
              </button>
            ),
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#5B6472] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              className="min-h-[40px] pl-9 pr-3 py-1.5 bg-[#FBF9F5] border border-[#D4C8B4] text-sm"
            />
          </div>

          <select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="min-h-[40px] px-3 py-1.5 bg-[#FBF9F5] border border-[#D4C8B4] text-sm"
          >
            <option value="All">All Categories</option>
            {NEWS_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Articles List */}
      {loading ? (
        <div className="h-48 bg-[#FFFFFF] border border-[#E6DFD3] animate-pulse" />
      ) : articles.length === 0 ? (
        <div className="p-12 bg-[#FFFFFF] border border-[#E6DFD3] text-center space-y-2">
          <p className="font-serif text-2xl font-semibold text-[#0F213E]">
            No news articles in this view
          </p>
          <p className="text-sm text-[#5B6472]">
            Click "New Article" to write a draft or publish school news.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <article
              key={article.id}
              className="bg-[#FFFFFF] border border-[#E6DFD3] p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
            >
              <div className="flex items-start gap-4 flex-1">
                {article.coverThumbnailUrl && (
                  <img
                    src={article.coverThumbnailUrl}
                    alt={article.title}
                    className="w-24 h-20 object-cover border border-[#E6DFD3] shrink-0 hidden sm:block"
                  />
                )}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs uppercase tracking-[0.14em] text-[#8D6A26] font-medium">
                      {article.category}
                    </span>
                    <span aria-hidden="true" className="text-[#D4C8B4]">
                      ·
                    </span>
                    <PublishStatusLabel status={article.status} />
                  </div>
                  <h3 className="font-serif text-2xl font-semibold text-[#0F213E]">
                    {article.title}
                  </h3>
                  <p className="text-sm text-[#333D4D] line-clamp-2">
                    {article.summary}
                  </p>
                  <p className="text-xs text-[#5B6472] tabular-nums">
                    Slug: /news/{article.slug} · Updated{' '}
                    {formatDisplayDate(article.updatedAt)}
                    {article.publishedAt
                      ? ` · Published ${formatDisplayDate(article.publishedAt)}`
                      : ''}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewArticle(article)}
                  className="min-h-[38px] inline-flex items-center gap-1 px-3 py-1.5 border border-[#D4C8B4] bg-[#FBF9F5] text-xs font-medium text-[#0F213E] cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(article)}
                  className="min-h-[38px] inline-flex items-center gap-1 px-3 py-1.5 border border-[#D4C8B4] bg-[#FFFFFF] text-xs font-medium text-[#0F213E] cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                {article.status !== 'published' ? (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(article, 'published')}
                    className="min-h-[38px] inline-flex items-center gap-1 px-3 py-1.5 bg-[#0F213E] text-[#FBF9F5] text-xs font-medium cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Publish</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(article, 'draft')}
                    className="min-h-[38px] inline-flex items-center gap-1 px-3 py-1.5 border border-[#D4C8B4] bg-[#FFFFFF] text-xs font-medium text-[#0F213E] cursor-pointer"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Unpublish</span>
                  </button>
                )}
                {article.status !== 'archived' && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(article, 'archived')}
                    className="min-h-[38px] inline-flex items-center gap-1 px-3 py-1.5 border border-[#D4C8B4] bg-[#FFFFFF] text-xs font-medium text-[#5B6472] cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Archive</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDeleteTarget(article)}
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

      {/* Preview Modal */}
      {previewArticle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A1629]/75"
          role="dialog"
          aria-modal="true"
          aria-label="Article preview"
        >
          <div className="w-full max-w-2xl max-h-[90vh] bg-[#FBF9F5] border border-[#E6DFD3] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 px-6 py-4 bg-[#0F213E] text-[#FBF9F5] flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.16em] text-[#D4B46E]">
                Article Preview · {previewArticle.category}
              </span>
              <button
                type="button"
                onClick={() => setPreviewArticle(null)}
                className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center text-[#FBF9F5]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 sm:p-8 space-y-5">
              {previewArticle.coverImageUrl && (
                <img
                  src={previewArticle.coverImageUrl}
                  alt={previewArticle.title}
                  className="w-full aspect-[16/9] object-cover border border-[#E6DFD3]"
                />
              )}
              <h3 className="font-serif text-3xl font-semibold text-[#0F213E]">
                {previewArticle.title}
              </h3>
              <p className="text-sm font-medium text-[#5B6472]">
                {previewArticle.summary}
              </p>
              <div className="pt-4 border-t border-[#E6DFD3] space-y-4 text-base text-[#333D4D] leading-relaxed">
                {splitParagraphs(previewArticle.content).map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete News Article"
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
