import {
  DiscordConfigStatus,
  DiscordSessionUser,
  DownloadAccessStatus,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  Product,
  ProductCategory,
  SavedProductImage,
  StockStatus,
  StoreSettings,
  YoutubeCategory,
  YoutubeDownload,
} from '../types/store';

const ADMIN_TOKEN_STORAGE_KEY = 'ra_store_admin_token';
const DISCORD_SESSION_STORAGE_KEY = 'ra_store_discord_session';

export interface StoredDiscordSession {
  token: string;
  user: DiscordSessionUser | null;
  savedAt: number;
}

// Hydrated into JS memory from tab-scoped sessionStorage so cross-origin iframe refreshes auto-resume reliably.
let inMemoryDiscordToken = '';

export function getStoredDiscordResumeSession(): StoredDiscordSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(DISCORD_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredDiscordSession> | null;
    if (!parsed || typeof parsed.token !== 'string' || !parsed.token.trim()) {
      window.sessionStorage.removeItem(DISCORD_SESSION_STORAGE_KEY);
      return null;
    }
    return {
      token: parsed.token.trim(),
      user: parsed.user && typeof parsed.user === 'object' ? parsed.user : null,
      savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : Date.now(),
    };
  } catch {
    try {
      window.sessionStorage.removeItem(DISCORD_SESSION_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
    return null;
  }
}

export function saveDiscordResumeSession(
  token: string,
  user: DiscordSessionUser | null = null
): void {
  const cleanToken = token.trim();
  inMemoryDiscordToken = cleanToken;
  if (typeof window === 'undefined' || !cleanToken) return;
  try {
    const payload: StoredDiscordSession = {
      token: cleanToken,
      user,
      savedAt: Date.now(),
    };
    window.sessionStorage.setItem(
      DISCORD_SESSION_STORAGE_KEY,
      JSON.stringify(payload)
    );
  } catch {
    // ignore storage quota errors
  }
}

export function clearDiscordResumeSession(): void {
  inMemoryDiscordToken = '';
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(DISCORD_SESSION_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

export function hydrateDiscordSessionFromStorage(): StoredDiscordSession | null {
  const stored = getStoredDiscordResumeSession();
  if (stored?.token) {
    inMemoryDiscordToken = stored.token;
  }
  return stored;
}

hydrateDiscordSessionFromStorage();

export function setInMemoryDiscordToken(token: string | null): void {
  const clean = token ? token.trim() : '';
  inMemoryDiscordToken = clean;
  if (!clean) {
    clearDiscordResumeSession();
  }
}

export interface PublicStorePayload {
  products: Product[];
  youtubeDownloads: YoutubeDownload[];
  lockedDownloadsCount?: number;
  downloadAccess?: DownloadAccessStatus;
  discordConfig?: DiscordConfigStatus;
  settings: StoreSettings;
}

export interface AdminDataPayload {
  orders: Order[];
  productImages: SavedProductImage[];
}

export interface AuthResponse {
  token: string;
  username: string;
}

export interface ProductMutationInput {
  title: string;
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  stockStatus: StockStatus;
  description: string;
  imageUrl: string;
  variantLabel?: string;
  deliveryNote?: string;
  featured: boolean;
}

export interface YoutubeMutationInput {
  title: string;
  category: YoutubeCategory;
  youtubeUrl: string;
  youtubeVideoId: string;
  downloadUrl: string;
  fileName: string;
  fileSize: string;
  version: string;
  notes: string;
}

export interface CreateOrderInput {
  orderCode: string;
  customerName: string;
  customerWhatsapp: string;
  paymentMethod: PaymentMethod;
  customerNote?: string;
  items: OrderItem[];
  totalAmount: number;
}

export function getStoredAdminToken(): string {
  try {
    return localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredAdminToken(token: string | null): void {
  try {
    if (!token) {
      localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    } else {
      localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
    }
  } catch {
    // ignore storage quota errors
  }
}

async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
  withAuth = false
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (withAuth) {
    const token = getStoredAdminToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  } else {
    const adminToken = getStoredAdminToken();
    if (adminToken) {
      headers.set('Authorization', `Bearer ${adminToken}`);
    }
  }

  if (inMemoryDiscordToken) {
    headers.set('X-Discord-Token', inMemoryDiscordToken);
  }

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });

  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
  } & T;

  if (!res.ok) {
    if (res.status === 401 && withAuth) {
      setStoredAdminToken(null);
    }
    if (res.status === 404 && url.startsWith('/api/')) {
      throw new Error(
        'Backend server (server.ts) tidak aktif di hosting ini (404). Website ini tidak bisa dijalankan hanya dari upload file statis (Netlify Drop). Jalankan di AI Studio / Railway / Render / VPS dengan Node.js.'
      );
    }
    throw new Error(data.error || `Permintaan gagal (${res.status}).`);
  }

  return data;
}

export function subscribeStoreStream(
  onStoreUpdated: () => void,
  onAdminUpdated?: () => void
): () => void {
  if (typeof EventSource === 'undefined') {
    return () => {};
  }

  const source = new EventSource('/api/stream');
  const handleStore = () => onStoreUpdated();
  const handleAdmin = () => onAdminUpdated?.();

  source.addEventListener('store_updated', handleStore);
  if (onAdminUpdated) {
    source.addEventListener('admin_updated', handleAdmin);
  }

  return () => {
    source.removeEventListener('store_updated', handleStore);
    if (onAdminUpdated) {
      source.removeEventListener('admin_updated', handleAdmin);
    }
    source.close();
  };
}

// Public Storefront APIs
export function fetchPublicStore(): Promise<PublicStorePayload> {
  return apiRequest<PublicStorePayload>('/api/store', { cache: 'no-store' });
}

export function createOrder(input: CreateOrderInput): Promise<Order> {
  return apiRequest<Order>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function trackYoutubeDownload(
  id: string
): Promise<{ downloadCount: number }> {
  return apiRequest<{ downloadCount: number }>(
    `/api/youtube-downloads/${encodeURIComponent(id)}/track`,
    { method: 'POST' }
  );
}

// Discord OAuth2 Verification APIs
export function fetchDiscordAuthUrl(): Promise<{ url: string }> {
  const origin = encodeURIComponent(window.location.origin);
  return apiRequest<{ url: string }>(`/api/discord/auth-url?origin=${origin}`, {
    cache: 'no-store',
  });
}

export async function persistDiscordSessionCookie(): Promise<void> {
  if (!inMemoryDiscordToken) return;
  try {
    await apiRequest<{ ok: boolean }>('/api/discord/session', {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
  } catch {
    // non-fatal if browser restricts third-party cookies
  }
}

export async function resumeDiscordSession(): Promise<{
  ok: boolean;
  authenticated: boolean;
  token: string;
  user: DiscordSessionUser;
} | null> {
  try {
    const res = await apiRequest<{
      ok: boolean;
      authenticated: boolean;
      token: string;
      user: DiscordSessionUser;
    }>('/api/discord/resume', {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    if (res.ok && res.authenticated && res.token && res.user) {
      saveDiscordResumeSession(res.token, res.user);
      return res;
    }
    clearDiscordResumeSession();
    return null;
  } catch {
    clearDiscordResumeSession();
    return null;
  }
}

export async function recheckDiscordRole(): Promise<{
  token: string;
  user: DiscordSessionUser;
}> {
  const res = await apiRequest<{ token: string; user: DiscordSessionUser }>(
    '/api/discord/recheck',
    {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    }
  );
  if (res.token) {
    saveDiscordResumeSession(res.token, res.user);
  }
  return res;
}

export async function logoutDiscord(): Promise<void> {
  try {
    await apiRequest<{ ok: boolean }>('/api/discord/logout', {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
  } catch {
    // ignore network error on logout
  } finally {
    clearDiscordResumeSession();
  }
}

// Admin Authentication APIs
export async function fetchCurrentAdmin(): Promise<string | null> {
  const token = getStoredAdminToken();
  if (!token) return null;
  try {
    const res = await apiRequest<{ authenticated: boolean; username: string | null }>(
      '/api/auth/me',
      { cache: 'no-store' },
      true
    );
    if (!res.authenticated || !res.username) {
      setStoredAdminToken(null);
      return null;
    }
    return res.username;
  } catch {
    setStoredAdminToken(null);
    return null;
  }
}

export async function loginAdmin(
  username: string,
  password: string
): Promise<string> {
  const res = await apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  setStoredAdminToken(res.token);
  return res.username;
}

export async function logoutAdmin(): Promise<void> {
  try {
    await apiRequest<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }, true);
  } catch {
    // ignore network failure during logout
  } finally {
    setStoredAdminToken(null);
  }
}

export async function changeAdminCredentials(
  currentPassword: string,
  newUsername: string,
  newPassword: string
): Promise<string> {
  const res = await apiRequest<AuthResponse>(
    '/api/auth/change-password',
    {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newUsername, newPassword }),
    },
    true
  );
  setStoredAdminToken(res.token);
  return res.username;
}

// Admin Dashboard APIs
export function fetchAdminData(): Promise<AdminDataPayload> {
  return apiRequest<AdminDataPayload>(
    '/api/admin/data',
    { cache: 'no-store' },
    true
  );
}

export function createProduct(input: ProductMutationInput): Promise<Product> {
  return apiRequest<Product>(
    '/api/products',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    true
  );
}

export function updateProduct(
  id: string,
  input: ProductMutationInput
): Promise<Product> {
  return apiRequest<Product>(
    `/api/products/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
    true
  );
}

export function deleteProduct(id: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(
    `/api/products/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
    true
  );
}

export function batchPublishProducts(
  templates: ProductMutationInput[]
): Promise<{ count: number }> {
  return apiRequest<{ count: number }>(
    '/api/products/batch',
    {
      method: 'POST',
      body: JSON.stringify({ templates }),
    },
    true
  );
}

export function batchSyncProducts(
  updates: Array<{
    productId: string;
    imageUrl?: string;
    category?: ProductCategory;
  }>
): Promise<{ count: number }> {
  return apiRequest<{ count: number }>(
    '/api/products/batch-sync',
    {
      method: 'POST',
      body: JSON.stringify({ updates }),
    },
    true
  );
}

export function saveProductImage(
  label: string,
  imageUrl: string
): Promise<SavedProductImage> {
  return apiRequest<SavedProductImage>(
    '/api/product-images',
    {
      method: 'POST',
      body: JSON.stringify({ label, imageUrl }),
    },
    true
  );
}

export function deleteProductImage(id: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(
    `/api/product-images/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
    true
  );
}

export function createYoutubeDownload(
  input: YoutubeMutationInput
): Promise<YoutubeDownload> {
  return apiRequest<YoutubeDownload>(
    '/api/youtube-downloads',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    true
  );
}

export function updateYoutubeDownload(
  id: string,
  input: YoutubeMutationInput
): Promise<YoutubeDownload> {
  return apiRequest<YoutubeDownload>(
    `/api/youtube-downloads/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
    true
  );
}

export function deleteYoutubeDownload(id: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(
    `/api/youtube-downloads/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
    true
  );
}

export function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<Order> {
  return apiRequest<Order>(
    `/api/orders/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
    true
  );
}

export function saveStoreSettings(
  settings: Partial<StoreSettings>
): Promise<StoreSettings> {
  return apiRequest<StoreSettings>(
    '/api/settings',
    {
      method: 'PUT',
      body: JSON.stringify(settings),
    },
    true
  );
}
