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
  collection: 'gallery' | 'news' | 'announcements' | 'events';
  createdAt: string;
  sizeBytes: number;
}
