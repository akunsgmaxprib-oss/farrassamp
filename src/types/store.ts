export const PRODUCT_CATEGORIES = [
  'Hosting SA-MP',
  'Paket On Server SA-MP',
  'Modpack GTA SA-MP',
  'Jasa Developer',
  'Jasa SA-MP',
  'Review & Streaming',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const STOCK_STATUSES = ['Tersedia', 'Stok Terbatas', 'Habis'] as const;
export type StockStatus = (typeof STOCK_STATUSES)[number];

export const YT_CATEGORIES = [
  'Mod & Config',
  'Preset & Editing',
  'Dokumen & Tool',
] as const;

export type YoutubeCategory = (typeof YT_CATEGORIES)[number];

export const PAYMENT_METHODS = ['QRIS', 'Transfer Bank', 'E-Wallet', 'COD'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const ORDER_STATUSES = ['Menunggu', 'Diproses', 'Selesai', 'Dibatalkan'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const FIELD_LIMITS = {
  PRODUCT_TITLE_MAX: 120,
  PRODUCT_DESC_MAX: 1500,
  PRODUCT_VARIANT_MAX: 120,
  PRODUCT_DELIVERY_MAX: 300,
  YT_TITLE_MAX: 140,
  YT_NOTES_MAX: 1000,
  YT_FILENAME_MAX: 120,
  YT_FILESIZE_MAX: 40,
  YT_VERSION_MAX: 30,
  ORDER_NAME_MAX: 100,
  ORDER_WA_MAX: 30,
  ORDER_NOTE_MAX: 500,
  URL_MAX: 500,
  PRODUCT_IMAGE_URL_MAX: 300000,
  PRODUCT_IMAGE_LABEL_MAX: 80,
  BRAND_NAME_MAX: 40,
  HERO_TAGLINE_MAX: 80,
  HERO_TITLE_MAX: 160,
  HERO_SUBTITLE_MAX: 500,
  HERO_CAPTION_TITLE_MAX: 80,
  HERO_CAPTION_SUBTITLE_MAX: 140,
  SECTION_EYEBROW_MAX: 80,
  SECTION_TITLE_MAX: 100,
  ABOUT_ROLE_MAX: 80,
  OWNER_DISPLAY_NAME_MAX: 80,
  ABOUT_DESC_MAX: 600,
  OFFICIAL_SUBTITLE_MAX: 120,
  FOOTER_TEXT_MAX: 160,
  YT_TAB_LABEL_MAX: 40,
  CATALOG_TAB_LABEL_MAX: 40,
} as const;

export interface SavedProductImage {
  id: string;
  label: string;
  imageUrl: string;
  ownerId: string;
}

export type FirestoreTimestampLike =
  | string
  | number
  | Date
  | {
      seconds?: number;
      nanoseconds?: number;
      _seconds?: number;
      _nanoseconds?: number;
      toMillis?: () => number;
      toDate?: () => Date;
    };

export interface Product {
  id: string;
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
  ownerId: string;
  isDemo?: boolean;
  createdAt?: FirestoreTimestampLike;
  updatedAt?: FirestoreTimestampLike;
}

export interface YoutubeDownload {
  id: string;
  title: string;
  category: YoutubeCategory;
  youtubeUrl: string;
  youtubeVideoId: string;
  downloadUrl: string;
  fileName: string;
  fileSize: string;
  version: string;
  notes: string;
  downloadCount: number;
  ownerId: string;
  isDemo?: boolean;
  createdAt?: FirestoreTimestampLike;
  updatedAt?: FirestoreTimestampLike;
}

export interface CartItem {
  product: Product;
  qty: number;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  orderCode: string;
  customerName: string;
  customerWhatsapp: string;
  paymentMethod: PaymentMethod;
  customerNote?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  buyerUid?: string;
  createdAt?: unknown;
}

export interface StoreSettings {
  whatsappNumber: string;
  youtubeChannelUrl: string;
  discordUsername?: string;
  discordInviteUrl?: string;
  announcement?: string;
  brandName?: string;
  heroTagline?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImageCaptionTitle?: string;
  heroImageCaptionSubtitle?: string;
  catalogEyebrow?: string;
  catalogTitle?: string;
  youtubeEyebrow?: string;
  youtubeTitle?: string;
  aboutRoleLabel?: string;
  ownerDisplayName?: string;
  aboutDescription?: string;
  officialCardSubtitle?: string;
  footerText?: string;
  ytTabAllLabel?: string;
  ytTabModLabel?: string;
  ytTabPresetLabel?: string;
  ytTabDocLabel?: string;
  catTabAllLabel?: string;
  catTabHostingLabel?: string;
  catTabPaketOnLabel?: string;
  catTabModpackLabel?: string;
  catTabDevLabel?: string;
  catTabJasaSampLabel?: string;
  catTabReviewLabel?: string;
  seededCatalogVersion?: string;
  discordGuildId?: string;
  discordSubscribeRoleId?: string;
  requireDiscordEntry?: string;
  ownerId?: string;
}

export interface DiscordSessionUser {
  discordId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  inGuild: boolean;
  hasSubscribeRole: boolean;
}

export interface DownloadAccessStatus {
  allowed: boolean;
  authenticated: boolean;
  inGuild: boolean;
  hasSubscribeRole: boolean;
  guildId: string;
  subscribeRoleId: string;
  discordUser: DiscordSessionUser | null;
}

export interface DiscordConfigStatus {
  configured: boolean;
  requireDiscordEntry: boolean;
  guildId: string;
  subscribeRoleId: string;
}

