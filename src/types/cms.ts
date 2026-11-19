export type PublishStatus = 'draft' | 'published' | 'archived';

export type CmsGalleryCategory =
  | 'School Life'
  | 'Academics'
  | 'Sports'
  | 'Events'
  | 'Facilities'
  | 'Activities';

export type CmsNewsCategory =
  | 'Academic News'
  | 'School Activities'
  | 'Achievements'
  | 'Sports'
  | 'General News';

export type AnnouncementPriority = 'Normal' | 'Important' | 'Urgent';

export type CmsCollectionName = 'gallery' | 'news' | 'announcements' | 'events';

export interface SessionState {
  authenticated: boolean;
  username: string | null;
  csrfToken: string;
  setupRequired: boolean;
  webSetupEnabled: boolean;
}

export interface CmsGalleryPhoto {
  id: string;
  caption: string;
  description: string;
  category: CmsGalleryCategory;
  imageUrl: string;
  thumbnailUrl: string;
  originalFilename?: string;
  mimeType?: string;
  width: number | null;
  height: number | null;
  fileSizeBytes?: number;
  status?: 'draft' | 'published';
  uploadedAt: string;
  updatedAt?: string;
  publishedAt: string | null;
}

export interface CmsNewsArticle {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverImageUrl: string | null;
  coverThumbnailUrl: string | null;
  category: CmsNewsCategory;
  status?: PublishStatus;
  createdAt?: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface CmsAnnouncement {
  id: string;
  title: string;
  message: string;
  priority: AnnouncementPriority;
  status?: PublishStatus;
  createdAt?: string;
  publishedAt: string | null;
  expiresAt: string | null;
  updatedAt?: string;
  isExpired?: boolean;
}

export interface CmsEvent {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  venue: string;
  coverImageUrl: string | null;
  coverThumbnailUrl: string | null;
  status?: PublishStatus;
  createdAt?: string;
  updatedAt?: string;
  isUpcoming?: boolean;
}

export interface CategoryStorageMetrics {
  originalsCount: number;
  thumbnailsCount: number;
  originalsBytes: number;
  thumbnailsBytes: number;
  totalBytes: number;
  publishedCount?: number;
  draftCount?: number;
}

export interface MediaStorageSummary {
  totalBytes: number;
  totalOriginalsCount: number;
  totalThumbnailsCount: number;
  backupsBytes: number;
  gallery: CategoryStorageMetrics;
  news: CategoryStorageMetrics;
  events: CategoryStorageMetrics;
  configuredLimitBytes: number | null;
  storageWarningPercent: number;
  remainingBytes: number | null;
  usagePercent: number | null;
  approachingLimit: boolean;
  overLimit: boolean;
}

export interface PhpUploadEnvironment {
  uploadMaxFilesize: string;
  uploadMaxFilesizeBytes: number;
  postMaxSize: string;
  postMaxSizeBytes: number;
  maxFileUploads: number;
  memoryLimit: string;
  memoryLimitBytes: number;
  gdLoaded: boolean;
  fileinfoLoaded: boolean;
  exifLoaded: boolean;
  zipLoaded: boolean;
}

export interface CmsSettings {
  storageLimitBytes: number | null;
  storageWarningPercent: number;
  backupRetentionCount: number;
}

export interface AdminOverviewData {
  counts: {
    publishedPhotos: number;
    draftPhotos: number;
    publishedNews: number;
    draftNews: number;
    archivedNews: number;
    activeAnnouncements: number;
    totalAnnouncements: number;
    upcomingEvents: number;
    pastEvents: number;
    backupCount: number;
  };
  storage: MediaStorageSummary;
  phpEnvironment: PhpUploadEnvironment;
  recentActivity: {
    type: 'gallery' | 'news' | 'announcement' | 'event';
    id: string;
    title: string;
    status: string;
    updatedAt: string;
  }[];
}

export interface BackupFileInfo {
  filename: string;
  collection: CmsCollectionName;
  createdAt: string;
  kind: 'complete-snapshot' | 'json-records' | 'legacy-json-only';
  includesMedia: boolean;
  recordCount: number;
  mediaFilesCount: number;
  jsonBytes: number;
  mediaBytes: number;
  sizeBytes: number;
}

export interface BackupCapabilities {
  zipArchiveSupported: boolean;
  retentionCount: number;
  archiveUnavailableReason: string | null;
}

export interface RestoreBackupResult {
  collection: string;
  restoredFrom: string;
  recordCount: number;
  restoredMediaFiles: number;
  safetyBackupId: string | null;
}
