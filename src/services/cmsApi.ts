import {
  AdminOverviewData,
  AnnouncementPriority,
  BackupFileInfo,
  CmsAnnouncement,
  CmsEvent,
  CmsGalleryCategory,
  CmsGalleryPhoto,
  CmsNewsArticle,
  CmsNewsCategory,
  PublishStatus,
  SessionState,
} from '../types/cms';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '';

let inMemoryCsrfToken = '';

export function setCsrfToken(token: string) {
  inMemoryCsrfToken = token;
}

export class ApiError extends Error {
  status: number;
  details?: Record<string, unknown>;

  constructor(message: string, status: number, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function requestJson<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});

  if (method !== 'GET' && method !== 'HEAD') {
    if (!inMemoryCsrfToken) {
      try {
        const session = await fetchSessionInternal();
        inMemoryCsrfToken = session.csrfToken;
      } catch {
        // Proceed; server will respond clearly if CSRF is missing
      }
    }
    if (inMemoryCsrfToken) {
      headers.set('X-CSRF-Token', inMemoryCsrfToken);
    }
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      method,
      headers,
      credentials: 'include',
    });
  } catch {
    throw new ApiError(
      'Unable to reach the school PHP API server. Ensure the PHP backend is running or deployed.',
      0,
    );
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new ApiError(
      'The PHP API endpoint is unavailable in this static environment. Start the PHP server or deploy to cPanel PHP hosting.',
      response.status || 503,
    );
  }

  const payload = (await response.json()) as {
    ok: boolean;
    data?: T;
    error?: string;
    details?: Record<string, unknown>;
  };

  if (!response.ok || !payload.ok) {
    throw new ApiError(
      payload.error || 'Request failed.',
      response.status,
      payload.details,
    );
  }

  return payload.data as T;
}

async function fetchSessionInternal(): Promise<SessionState> {
  const data = await requestJson<SessionState>('/api/auth/session.php', {
    method: 'GET',
  });
  if (data.csrfToken) {
    inMemoryCsrfToken = data.csrfToken;
  }
  return data;
}

export const cmsApi = {
  // Authentication & Session
  getSession: () => fetchSessionInternal(),

  setupAdmin: async (payload: {
    setupToken: string;
    username: string;
    password: string;
    confirmPassword: string;
  }): Promise<SessionState> => {
    const res = await requestJson<{
      authenticated: boolean;
      username: string;
      csrfToken: string;
    }>('/api/auth/setup.php', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    inMemoryCsrfToken = res.csrfToken;
    return {
      authenticated: res.authenticated,
      username: res.username,
      csrfToken: res.csrfToken,
      setupRequired: false,
      webSetupEnabled: false,
    };
  },

  login: async (username: string, password: string): Promise<SessionState> => {
    const res = await requestJson<{
      authenticated: boolean;
      username: string;
      csrfToken: string;
    }>('/api/auth/login.php', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    inMemoryCsrfToken = res.csrfToken;
    return {
      authenticated: res.authenticated,
      username: res.username,
      csrfToken: res.csrfToken,
      setupRequired: false,
      webSetupEnabled: false,
    };
  },

  logout: async (): Promise<void> => {
    await requestJson('/api/auth/logout.php', { method: 'POST', body: '{}' });
    inMemoryCsrfToken = '';
  },

  changePassword: async (payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<{ message: string }> => {
    const res = await requestJson<{ message: string; csrfToken: string }>(
      '/api/auth/change-password.php',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
    if (res.csrfToken) {
      inMemoryCsrfToken = res.csrfToken;
    }
    return { message: res.message };
  },

  // Admin Overview & Backups
  getOverview: () =>
    requestJson<AdminOverviewData>('/api/admin/overview.php', { method: 'GET' }),

  listBackups: () =>
    requestJson<{ backups: BackupFileInfo[] }>('/api/admin/backups.php', {
      method: 'GET',
    }),

  restoreBackup: (filename: string) =>
    requestJson<{ collection: string; restoredFrom: string; recordCount: number }>(
      '/api/admin/backups.php',
      {
        method: 'POST',
        body: JSON.stringify({ filename }),
      },
    ),

  getBackupDownloadUrl: (filename: string) =>
    `${API_BASE}/api/admin/backups.php?download=${encodeURIComponent(filename)}`,

  // Gallery
  listPublicGallery: (category?: string) => {
    const qs = category && category !== 'All' ? `?category=${encodeURIComponent(category)}` : '';
    return requestJson<{ items: CmsGalleryPhoto[] }>(`/api/gallery/list.php${qs}`);
  },

  listAdminGallery: (params?: { category?: string; status?: string; q?: string }) => {
    const query = new URLSearchParams({ scope: 'admin' });
    if (params?.category && params.category !== 'All') query.set('category', params.category);
    if (params?.status && params.status !== 'all') query.set('status', params.status);
    if (params?.q) query.set('q', params.q);
    return requestJson<{ items: CmsGalleryPhoto[] }>(`/api/gallery/list.php?${query.toString()}`);
  },

  uploadGalleryPhotos: (formData: FormData) =>
    requestJson<{ items: CmsGalleryPhoto[] }>('/api/gallery/upload.php', {
      method: 'POST',
      body: formData,
    }),

  updateGalleryPhoto: (payload: {
    id: string;
    caption?: string;
    description?: string;
    category?: CmsGalleryCategory;
    status?: 'draft' | 'published';
  }) =>
    requestJson<{ item: CmsGalleryPhoto }>('/api/gallery/update.php', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteGalleryPhoto: (id: string) =>
    requestJson<{ deletedId: string }>('/api/gallery/delete.php', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),

  // News
  listPublicNews: (category?: string) => {
    const qs = category && category !== 'All' ? `?category=${encodeURIComponent(category)}` : '';
    return requestJson<{ items: CmsNewsArticle[] }>(`/api/news/list.php${qs}`);
  },

  listAdminNews: (params?: { status?: string; category?: string; q?: string }) => {
    const query = new URLSearchParams({ scope: 'admin' });
    if (params?.status && params.status !== 'all') query.set('status', params.status);
    if (params?.category && params.category !== 'All') query.set('category', params.category);
    if (params?.q) query.set('q', params.q);
    return requestJson<{ items: CmsNewsArticle[] }>(`/api/news/list.php?${query.toString()}`);
  },

  getPublicArticle: (slug: string) =>
    requestJson<{ article: CmsNewsArticle }>(
      `/api/news/article.php?slug=${encodeURIComponent(slug)}`,
    ),

  createNewsArticle: (formData: FormData) =>
    requestJson<{ article: CmsNewsArticle }>('/api/news/create.php', {
      method: 'POST',
      body: formData,
    }),

  updateNewsArticle: (formData: FormData) =>
    requestJson<{ article: CmsNewsArticle }>('/api/news/update.php', {
      method: 'POST',
      body: formData,
    }),

  publishNewsArticle: (id: string, status: PublishStatus) =>
    requestJson<{ article: CmsNewsArticle }>('/api/news/publish.php', {
      method: 'POST',
      body: JSON.stringify({ id, status }),
    }),

  deleteNewsArticle: (id: string) =>
    requestJson<{ deletedId: string }>('/api/news/delete.php', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),

  // Announcements
  listPublicAnnouncements: () =>
    requestJson<{ items: CmsAnnouncement[] }>('/api/announcements/list.php'),

  listAdminAnnouncements: (params?: { status?: string; priority?: string }) => {
    const query = new URLSearchParams({ scope: 'admin' });
    if (params?.status && params.status !== 'all') query.set('status', params.status);
    if (params?.priority && params.priority !== 'All') query.set('priority', params.priority);
    return requestJson<{ items: CmsAnnouncement[] }>(
      `/api/announcements/list.php?${query.toString()}`,
    );
  },

  createAnnouncement: (payload: {
    title: string;
    message: string;
    priority: AnnouncementPriority;
    status: PublishStatus;
    publishedAt?: string;
    expiresAt?: string;
  }) =>
    requestJson<{ item: CmsAnnouncement }>('/api/announcements/create.php', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateAnnouncement: (payload: {
    id: string;
    title?: string;
    message?: string;
    priority?: AnnouncementPriority;
    status?: PublishStatus;
    publishedAt?: string;
    expiresAt?: string;
  }) =>
    requestJson<{ item: CmsAnnouncement }>('/api/announcements/update.php', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  publishAnnouncement: (id: string, status: PublishStatus) =>
    requestJson<{ item: CmsAnnouncement }>('/api/announcements/publish.php', {
      method: 'POST',
      body: JSON.stringify({ id, status }),
    }),

  deleteAnnouncement: (id: string) =>
    requestJson<{ deletedId: string }>('/api/announcements/delete.php', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),

  // Events
  listPublicEvents: () =>
    requestJson<{ upcoming: CmsEvent[]; past: CmsEvent[]; items: CmsEvent[] }>(
      '/api/events/list.php',
    ),

  listAdminEvents: (status?: string) => {
    const query = new URLSearchParams({ scope: 'admin' });
    if (status && status !== 'all') query.set('status', status);
    return requestJson<{ upcoming: CmsEvent[]; past: CmsEvent[]; items: CmsEvent[] }>(
      `/api/events/list.php?${query.toString()}`,
    );
  },

  createEvent: (formData: FormData) =>
    requestJson<{ item: CmsEvent }>('/api/events/create.php', {
      method: 'POST',
      body: formData,
    }),

  updateEvent: (formData: FormData) =>
    requestJson<{ item: CmsEvent }>('/api/events/update.php', {
      method: 'POST',
      body: formData,
    }),

  publishEvent: (id: string, status: PublishStatus) =>
    requestJson<{ item: CmsEvent }>('/api/events/publish.php', {
      method: 'POST',
      body: JSON.stringify({ id, status }),
    }),

  deleteEvent: (id: string) =>
    requestJson<{ deletedId: string }>('/api/events/delete.php', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),
};

export const GALLERY_CATEGORIES: CmsGalleryCategory[] = [
  'School Life',
  'Academics',
  'Sports',
  'Events',
  'Facilities',
  'Activities',
];

export const NEWS_CATEGORIES: CmsNewsCategory[] = [
  'Academic News',
  'School Activities',
  'Achievements',
  'Sports',
  'General News',
];

export const ANNOUNCEMENT_PRIORITIES: AnnouncementPriority[] = [
  'Normal',
  'Important',
  'Urgent',
];
