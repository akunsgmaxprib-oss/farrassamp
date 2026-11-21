import heroAmdEpycImg from '../assets/images/hero_amd_epyc_1795000978901.jpg';
import heroRaStoreImg from '../assets/images/hero_ra_store_1794999337320.jpg';
import productCreatorPackImg from '../assets/images/product_creator_pack_1794999337028.jpg';
import productDeskGearImg from '../assets/images/product_desk_gear_1794999339732.jpg';
import productMerchHoodieImg from '../assets/images/product_merch_hoodie_1794999338332.jpg';
import sampHostingPanelImg from '../assets/images/samp_hosting_panel_showcase_1795183641716.jpg';
import sampModpackLowImg from '../assets/images/samp_modpack_low_1795184091119.jpg';
import sampModpackMediumImg from '../assets/images/samp_modpack_medium_1795184091078.jpg';
import sampModpackHighImg from '../assets/images/samp_modpack_high_1795184092226.jpg';
import sampMappingBannerImg from '../assets/images/samp_jasa_mapping_banner_1795183962670.jpg';
import sampDeveloperSimpleImg from '../assets/images/samp_developer_simple_1795183206759.jpg';
import { ProductCategory, StockStatus, StoreSettings } from '../types/store';

export const PACKAGE_ON_SERVER_IMG = '/assets/aistudio/image_405303b2.png';
export const REVIEW_STREAMING_IMG = '/assets/aistudio/image_7e1ebf44.png';

export const HERO_EPYC_PATH = heroAmdEpycImg;
export const CUSTOM_MODPACK_IMG_PATH = sampModpackHighImg;
export const CUSTOM_MAPPING_IMG_PATH = sampMappingBannerImg;
export const STORE_LOGO_PATH = '/assets/aistudio/image_ed8dee0f.png';
export const OWNER_AVATAR_PATH = '/assets/aistudio/image_2eeb6e5e.png';

const PRODUCT_IMAGE_ALIAS_MAP: Record<string, string> = {
  '/src/assets/images/hero_amd_epyc_1795000978901.jpg': heroAmdEpycImg,
  '/src/assets/images/product_hosting_epyc_1794999994326.jpg': sampHostingPanelImg,
  '/src/assets/images/product_modpack_samp_1794999994856.jpg': sampModpackMediumImg,
  '/src/assets/images/product_jasa_developer_1794999995301.jpg': sampDeveloperSimpleImg,
  '/src/assets/images/product_review_streaming_1794999996582.jpg': REVIEW_STREAMING_IMG,
  '/assets/aistudio/image_7e1ebf44.png': REVIEW_STREAMING_IMG,
  '/src/assets/images/hero_ra_store_1794999337320.jpg': heroRaStoreImg,
  '/src/assets/images/product_creator_pack_1794999337028.jpg': productCreatorPackImg,
  '/src/assets/images/product_desk_gear_1794999339732.jpg': productDeskGearImg,
  '/src/assets/images/product_merch_hoodie_1794999338332.jpg': productMerchHoodieImg,
  '/src/assets/images/samp_modpack_gta_1795088414065.jpg': sampModpackMediumImg,
  '/src/assets/images/samp_onserver_hosting_1795088413033.jpg': PACKAGE_ON_SERVER_IMG,
  '/src/assets/images/samp_mapping_world_1795088411956.jpg': sampMappingBannerImg,
  '/src/assets/images/samp_developer_code_1795088414147.jpg': sampDeveloperSimpleImg,
  '/src/assets/images/samp_hosting_simple_1795183205351.jpg': sampHostingPanelImg,
  '/src/assets/images/samp_hosting_panel_showcase_1795183641716.jpg': sampHostingPanelImg,
  '/src/assets/images/samp_modpack_simple_1795183205938.jpg': sampModpackMediumImg,
  '/src/assets/images/samp_modpack_low_1795184091119.jpg': sampModpackLowImg,
  '/src/assets/images/samp_modpack_medium_1795184091078.jpg': sampModpackMediumImg,
  '/src/assets/images/samp_modpack_high_1795184092226.jpg': sampModpackHighImg,
  '/src/assets/images/samp_onserver_simple_1795183206946.jpg': PACKAGE_ON_SERVER_IMG,
  '/assets/aistudio/image_405303b2.png': PACKAGE_ON_SERVER_IMG,
  '/src/assets/images/samp_mapping_simple_1795183205976.jpg': sampMappingBannerImg,
  '/src/assets/images/samp_jasa_mapping_banner_1795183962670.jpg': sampMappingBannerImg,
  '/src/assets/images/samp_developer_simple_1795183206759.jpg': sampDeveloperSimpleImg,
};

export function resolveProductImageUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (PRODUCT_IMAGE_ALIAS_MAP[trimmed]) {
    return PRODUCT_IMAGE_ALIAS_MAP[trimmed];
  }
  if (trimmed.includes('samp_hosting_panel_showcase_1795183641716')) return sampHostingPanelImg;
  if (trimmed.includes('samp_jasa_mapping_banner_1795183962670')) return sampMappingBannerImg;
  if (trimmed.includes('image_405303b2')) return PACKAGE_ON_SERVER_IMG;
  if (trimmed.includes('image_7e1ebf44')) return REVIEW_STREAMING_IMG;
  if (trimmed.includes('samp_modpack_low_1795184091119')) return sampModpackLowImg;
  if (trimmed.includes('samp_modpack_medium_1795184091078')) return sampModpackMediumImg;
  if (trimmed.includes('samp_modpack_high_1795184092226')) return sampModpackHighImg;
  if (trimmed.includes('samp_hosting_simple_1795183205351')) return sampHostingPanelImg;
  if (trimmed.includes('samp_modpack_simple_1795183205938')) return sampModpackMediumImg;
  if (trimmed.includes('samp_onserver_simple_1795183206946')) return PACKAGE_ON_SERVER_IMG;
  if (trimmed.includes('samp_mapping_simple_1795183205976')) return sampMappingBannerImg;
  if (trimmed.includes('samp_developer_simple_1795183206759')) return sampDeveloperSimpleImg;
  if (trimmed.includes('samp_modpack_gta_1795088414065')) return sampModpackMediumImg;
  if (trimmed.includes('samp_onserver_hosting_1795088413033')) return PACKAGE_ON_SERVER_IMG;
  if (trimmed.includes('samp_mapping_world_1795088411956')) return sampMappingBannerImg;
  if (trimmed.includes('samp_developer_code_1795088414147')) return sampDeveloperSimpleImg;
  if (trimmed.includes('hero_amd_epyc_1795000978901')) return heroAmdEpycImg;
  if (trimmed.includes('product_hosting_epyc_1794999994326')) return sampHostingPanelImg;
  if (trimmed.includes('product_modpack_samp_1794999994856')) return sampModpackMediumImg;
  if (trimmed.includes('product_jasa_developer_1794999995301')) return sampDeveloperSimpleImg;
  if (trimmed.includes('product_review_streaming_1794999996582')) return REVIEW_STREAMING_IMG;
  if (trimmed.includes('hero_ra_store_1794999337320')) return heroRaStoreImg;
  if (trimmed.includes('product_creator_pack_1794999337028')) return productCreatorPackImg;
  if (trimmed.includes('product_desk_gear_1794999339732')) return productDeskGearImg;
  if (trimmed.includes('product_merch_hoodie_1794999338332')) return productMerchHoodieImg;
  if (trimmed.includes('image_ed8dee0f')) return STORE_LOGO_PATH;
  if (trimmed.includes('image_2eeb6e5e')) return OWNER_AVATAR_PATH;
  return trimmed;
}

export const STUDIO_IMAGE_PRESETS = [
  { label: 'Panel Hosting RA STORE', url: sampHostingPanelImg },
  { label: 'Modpack Low (Ringan)', url: sampModpackLowImg },
  { label: 'Modpack Medium (Semi-HD)', url: sampModpackMediumImg },
  { label: 'Modpack High (ENB)', url: sampModpackHighImg },
  { label: 'Paket On Server SA-MP', url: PACKAGE_ON_SERVER_IMG },
  { label: 'Jasa Mapping SA-MP', url: sampMappingBannerImg },
  { label: 'Jasa Developer SA-MP', url: sampDeveloperSimpleImg },
  { label: 'Review & Live Streaming', url: REVIEW_STREAMING_IMG },
  { label: 'Logo RA STORE', url: STORE_LOGO_PATH },
  { label: 'CPU AMD EPYC Server', url: heroAmdEpycImg },
] as const;

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  whatsappNumber: '6285797123671',
  youtubeChannelUrl: 'https://www.youtube.com/@Farrassamp',
  discordUsername: 'farrassamp',
  discordInviteUrl: 'https://discord.gg/ss2WFZK6Zg',
  announcement: '',
  brandName: 'RA STORE',
  heroTagline: 'Farrassamp Official',
  heroTitle: 'Hosting SA-MP EPYC 9750, Modpack & Arsip File YouTube.',
  heroSubtitle:
    'Platform resmi Farrassamp untuk pemesanan hosting AMD EPYC 9750, modpack GTA SA-MP, jasa developer & setup server, hingga review streaming—dilengkapi pusat unduhan file langsung dari video YouTube.',
  heroImageCaptionTitle: 'AMD EPYC 9750 Infrastructure',
  heroImageCaptionSubtitle: 'Performa server stabil untuk komunitas GTA SA-MP',
  catalogEyebrow: 'Belanja di RA STORE',
  catalogTitle: 'Katalog Produk & Jasa',
  youtubeEyebrow: 'Dibagikan dari Kanal YouTube Farrassamp',
  youtubeTitle: 'Pusat Unduhan YouTube',
  aboutRoleLabel: 'Pemilik & Pengelola RA STORE',
  ownerDisplayName: 'Farrassamp',
  aboutDescription:
    'RA STORE adalah toko resmi milik Farrassamp untuk kebutuhan GTA SA-MP, hosting AMD EPYC 9750, modpack, jasa developer, review streaming, serta arsip unduhan file resmi dari kanal YouTube @Farrassamp.',
  officialCardSubtitle: 'Sedia Kebutuhan SA-MP · Hosting, Modpack & Jasa',
  footerText: 'RA STORE · Farrassamp. Seluruh hak cipta dilindungi.',
  ytTabAllLabel: 'Semua',
  ytTabModLabel: 'Mod & Config',
  ytTabPresetLabel: 'Preset & Editing',
  ytTabDocLabel: 'Dokumen & Tool',
  catTabAllLabel: 'Semua',
  catTabHostingLabel: 'Hosting SA-MP',
  catTabPaketOnLabel: 'Paket On Server SA-MP',
  catTabModpackLabel: 'Modpack GTA SA-MP',
  catTabDevLabel: 'Jasa Developer',
  catTabJasaSampLabel: 'Jasa SA-MP',
  catTabReviewLabel: 'Review & Streaming',
};

export function getCatalogCategoryLabel(
  category: string,
  settings?: Partial<StoreSettings>
): string {
  switch (category) {
    case 'Semua':
      return settings?.catTabAllLabel?.trim() || 'Semua';
    case 'Hosting SA-MP':
      return settings?.catTabHostingLabel?.trim() || 'Hosting SA-MP';
    case 'Paket On Server SA-MP':
      return settings?.catTabPaketOnLabel?.trim() || 'Paket On Server SA-MP';
    case 'Modpack GTA SA-MP':
      return settings?.catTabModpackLabel?.trim() || 'Modpack GTA SA-MP';
    case 'Jasa Developer':
      return settings?.catTabDevLabel?.trim() || 'Jasa Developer';
    case 'Jasa SA-MP':
      return settings?.catTabJasaSampLabel?.trim() || 'Jasa SA-MP';
    case 'Review & Streaming':
      return settings?.catTabReviewLabel?.trim() || 'Review & Streaming';
    default:
      return category;
  }
}

export interface ReadyProductTemplate {
  title: string;
  category: ProductCategory;
  price: number;
  stockStatus: StockStatus;
  imageUrl: string;
  variantLabel: string;
  deliveryNote: string;
  description: string;
  featured: boolean;
}

export const READY_TO_PUBLISH_PRODUCTS: ReadyProductTemplate[] = [
  {
    title: 'Jasa Racik Modpack SA-MP — Low',
    category: 'Modpack GTA SA-MP',
    price: 5000,
    stockStatus: 'Tersedia',
    imageUrl: sampModpackLowImg,
    variantLabel: 'Rp5.000 - Rp10.000 · Low / Ringan',
    deliveryNote: 'Konsultasi detail & kirim link via WhatsApp/Discord',
    description:
      'Jasa Racik Modpack GTA SA-MP tingkat LOW (Rp5.000 - Rp10.000). Cocok untuk PC/laptop spek rendah agar FPS tetap stabil. Pilihan racikan: modpack polosan ringan, modpack anti lag, atau modpack compe ringan sesuai request.',
    featured: true,
  },
  {
    title: 'Jasa Racik Modpack SA-MP — Medium',
    category: 'Modpack GTA SA-MP',
    price: 12000,
    stockStatus: 'Tersedia',
    imageUrl: sampModpackMediumImg,
    variantLabel: 'Rp12.000 - Rp15.000 · Medium / Seimbang',
    deliveryNote: 'Konsultasi detail & kirim link via WhatsApp/Discord',
    description:
      'Jasa Racik Modpack GTA SA-MP tingkat MEDIUM (Rp12.000 - Rp15.000). Visual lebih tajam tetap lancar untuk harian maupun war. Bisa pilih style gangster, modpack carton, modpack compe, atau semi-HD.',
    featured: true,
  },
  {
    title: 'Jasa Racik Modpack SA-MP — High',
    category: 'Modpack GTA SA-MP',
    price: 18000,
    stockStatus: 'Tersedia',
    imageUrl: sampModpackHighImg,
    variantLabel: 'Rp18.000 - Rp25.000 · High / HD & ENB',
    deliveryNote: 'Konsultasi detail & kirim link via WhatsApp/Discord',
    description:
      'Jasa Racik Modpack GTA SA-MP tingkat HIGH (Rp18.000 - Rp25.000). Tampilan grafis maksimal & sinematik: modpack HD, modpack ENB, style gangster detail tinggi, atau custom sesuai spesifikasi PC Anda.',
    featured: true,
  },
  {
    title: 'Request Custom Modpack SA-MP',
    category: 'Modpack GTA SA-MP',
    price: 5000,
    stockStatus: 'Tersedia',
    imageUrl: sampModpackHighImg,
    variantLabel: 'Harga Request Menyesuaikan Detail & Kebutuhan',
    deliveryNote: 'Diskusi request khusus & estimasi via WhatsApp/Discord',
    description:
      'Ajukan request modpack khusus GTA SA-MP sesuai selera Anda (harga menyesuaikan detail & kebutuhan).\n\nTersedia: modpack polosan ringan, modpack HD, modpack style gangster, modpack anti lag, modpack carton, modpack ENB, modpack compe, dan request custom lainnya.',
    featured: true,
  },
  {
    title: 'Paket On Server SA-MP Inferno — Paket 1 (50 Player)',
    category: 'Paket On Server SA-MP',
    price: 20000,
    stockStatus: 'Tersedia',
    imageUrl: PACKAGE_ON_SERVER_IMG,
    variantLabel: 'Gamemode Inferno · 50 Player · Free GM',
    deliveryNote: 'Sudah dapat hosting, panel bot DC & bebas GM (dari kami/Anda)',
    description:
      'Paket On Server SA-MP Gamemode Inferno Paket 1 (50 Player).\nTermasuk: Hosting, Rename, Pasang GM, Free GM.\nBenefit: Sudah dapat hosting, panel bot untuk server DC, bebas GM dari kami atau Anda.',
    featured: true,
  },
  {
    title: 'Paket On Server SA-MP Inferno — Paket 2 (80 Player)',
    category: 'Paket On Server SA-MP',
    price: 25000,
    stockStatus: 'Tersedia',
    imageUrl: PACKAGE_ON_SERVER_IMG,
    variantLabel: 'Gamemode Inferno · 80 Player · Free GM',
    deliveryNote: 'Sudah dapat hosting, panel bot DC & bebas GM (dari kami/Anda)',
    description:
      'Paket On Server SA-MP Gamemode Inferno Paket 2 (80 Player).\nTermasuk: Hosting, Rename, Pasang GM, Free GM.\nBenefit: Sudah dapat hosting, panel bot untuk server DC, bebas GM dari kami atau Anda.',
    featured: true,
  },
  {
    title: 'Paket On Server SA-MP Inferno — Paket 3 (125 Player)',
    category: 'Paket On Server SA-MP',
    price: 35000,
    stockStatus: 'Tersedia',
    imageUrl: PACKAGE_ON_SERVER_IMG,
    variantLabel: 'Gamemode Inferno · 125 Player',
    deliveryNote: 'Sudah dapat hosting, panel bot DC & bebas GM (dari kami/Anda)',
    description:
      'Paket On Server SA-MP Gamemode Inferno Paket 3 (125 Player).\nTermasuk: Hosting, Rename, Pasang GM.\nBenefit: Sudah dapat hosting, panel bot untuk server DC, bebas GM dari kami atau Anda.',
    featured: true,
  },
  {
    title: 'Paket On Server SA-MP LRP — Paket 1 (50 Player)',
    category: 'Paket On Server SA-MP',
    price: 25000,
    stockStatus: 'Tersedia',
    imageUrl: PACKAGE_ON_SERVER_IMG,
    variantLabel: 'Gamemode LRP · 50 Player · Setup Bot UCP',
    deliveryNote: 'Sudah dapat hosting, panel bot DC & setup lengkap',
    description:
      'Paket On Server SA-MP Gamemode LRP Paket 1 (50 Player).\nTermasuk: Hosting, Panel Bot, Rename, Pasang GM, DC Server, Setup Bot UCP.\nBenefit: Sudah dapat hosting, panel bot untuk server DC, bebas GM dari kami atau Anda.',
    featured: true,
  },
  {
    title: 'Paket On Server SA-MP LRP — Paket 2 (80 Player)',
    category: 'Paket On Server SA-MP',
    price: 35000,
    stockStatus: 'Tersedia',
    imageUrl: PACKAGE_ON_SERVER_IMG,
    variantLabel: 'Gamemode LRP · 80 Player · Setup Bot UCP',
    deliveryNote: 'Sudah dapat hosting, panel bot DC & setup lengkap',
    description:
      'Paket On Server SA-MP Gamemode LRP Paket 2 (80 Player).\nTermasuk: Hosting, Panel Bot, Rename, Pasang GM, DC Server, Setup Bot UCP.\nBenefit: Sudah dapat hosting, panel bot untuk server DC, bebas GM dari kami atau Anda.',
    featured: true,
  },
  {
    title: 'Paket On Server SA-MP LRP — Paket 3 (150 Player)',
    category: 'Paket On Server SA-MP',
    price: 45000,
    stockStatus: 'Tersedia',
    imageUrl: PACKAGE_ON_SERVER_IMG,
    variantLabel: 'Gamemode LRP · 150 Player · Setup Bot UCP',
    deliveryNote: 'Sudah dapat hosting, panel bot DC & setup lengkap',
    description:
      'Paket On Server SA-MP Gamemode LRP Paket 3 (150 Player).\nTermasuk: Hosting, Panel Bot, Rename, Pasang GM, DC Server, Setup Bot UCP.\nBenefit: Sudah dapat hosting, panel bot untuk server DC, bebas GM dari kami atau Anda.',
    featured: true,
  },
  {
    title: 'Jasa Mapping SA-MP — Packet Low (30 Object)',
    category: 'Jasa SA-MP',
    price: 8000,
    stockStatus: 'Tersedia',
    imageUrl: sampMappingBannerImg,
    variantLabel: '30 Object · Bebas Request Mapping & Model',
    deliveryNote: 'Kirim konsep mapping via WhatsApp/Discord · Hasil rapi',
    description:
      'Jasa Mapping GTA SA-MP Packet Low (30 Object). Bebas Request Mapping, Bebas Request Model, pengerjaan rapi dan siap pasang ke server Anda.',
    featured: true,
  },
  {
    title: 'Jasa Mapping SA-MP — Packet Medium (50 Object)',
    category: 'Jasa SA-MP',
    price: 10000,
    stockStatus: 'Tersedia',
    imageUrl: sampMappingBannerImg,
    variantLabel: '50 Object · Bebas Request Mapping & Model',
    deliveryNote: 'Kirim konsep mapping via WhatsApp/Discord · Hasil rapi',
    description:
      'Jasa Mapping GTA SA-MP Packet Medium (50 Object). Bebas Request Mapping, Bebas Request Model, pengerjaan rapi dan siap pasang ke server Anda.',
    featured: true,
  },
  {
    title: 'Jasa Mapping SA-MP — Packet High (100 Object)',
    category: 'Jasa SA-MP',
    price: 20000,
    stockStatus: 'Tersedia',
    imageUrl: sampMappingBannerImg,
    variantLabel: '100 Object · Bebas Request Mapping & Model',
    deliveryNote: 'Kirim konsep mapping via WhatsApp/Discord · Hasil rapi',
    description:
      'Jasa Mapping GTA SA-MP Packet High (100 Object). Bebas Request Mapping, Bebas Request Model, pengerjaan rapi dan detail untuk area besar.',
    featured: true,
  },
  {
    title: 'Jasa Mapping SA-MP — Custom Tambah 10 Object',
    category: 'Jasa SA-MP',
    price: 2000,
    stockStatus: 'Tersedia',
    imageUrl: sampMappingBannerImg,
    variantLabel: 'Custom Add-on +10 Object',
    deliveryNote: 'Tambahan object untuk paket mapping via WhatsApp/Discord',
    description:
      'Custom Object tambahan untuk Jasa Mapping GTA SA-MP (+10 Object hanya Rp2.000). Bebas Request Mapping & Bebas Request Model dengan hasil rapi.',
    featured: false,
  },
  {
    title: 'Jasa Developer SA-MP — Mingguan',
    category: 'Jasa Developer',
    price: 60000,
    stockStatus: 'Tersedia',
    imageUrl: sampDeveloperSimpleImg,
    variantLabel: 'Kontrak Mingguan · Semua Gamemode · 100% Anti Plagiat',
    deliveryNote: 'Diskusi kebutuhan & progress langsung via WhatsApp/Discord',
    description:
      'Jasa Developer SA-MP (Mingguan): Fix Bug, Pasang FS/Fitur, Bikin Fitur baru.\nBenefit: Update server 5 kali bahkan lebih, script 100% anti plagiarisme, menerima semua gamemode. Request lainnya bisa dibahas langsung dengan seller.',
    featured: true,
  },
  {
    title: 'Jasa Developer SA-MP — Bulanan',
    category: 'Jasa Developer',
    price: 150000,
    stockStatus: 'Tersedia',
    imageUrl: sampDeveloperSimpleImg,
    variantLabel: 'Kontrak Bulanan · Semua Gamemode · 100% Anti Plagiat',
    deliveryNote: 'Diskusi kebutuhan & progress langsung via WhatsApp/Discord',
    description:
      'Jasa Developer SA-MP (Bulanan): Fix Bug, Pasang FS/Fitur, Bikin Fitur baru.\nBenefit: Update server 5 kali bahkan lebih, script 100% anti plagiarisme, menerima semua gamemode. Request lainnya bisa dibahas langsung dengan seller.',
    featured: true,
  },
  {
    title: 'Jasa Review Server GTA SA-MP (Konten YouTube)',
    category: 'Review & Streaming',
    price: 35000,
    stockStatus: 'Tersedia',
    imageUrl: REVIEW_STREAMING_IMG,
    variantLabel: 'Video Review YouTube @Farrassamp · Tour Fitur & Promosi',
    deliveryNote: 'Penjadwalan record & detail server dikonfirmasi via WhatsApp/Discord',
    description:
      'Jasa review server GTA SA-MP langsung tayang di kanal YouTube @Farrassamp. Meliputi tur map/mapping, showcase fitur unggulan server, info IP/Discord, dan ajakan gabung untuk komunitas player SA-MP.',
    featured: true,
  },
  {
    title: 'Jasa Live Streaming Server SA-MP (YouTube)',
    category: 'Review & Streaming',
    price: 50000,
    stockStatus: 'Tersedia',
    imageUrl: REVIEW_STREAMING_IMG,
    variantLabel: 'Live Streaming @Farrassamp · Roleplay & Mabar Komunitas',
    deliveryNote: 'Jadwal live streaming & info server disepakati via WhatsApp/Discord',
    description:
      'Jasa promosi live streaming server GTA SA-MP di kanal YouTube @Farrassamp. Bantu ramaikan player baru lewat sesi main bareng (mabar), showcase roleplay, serta tautan Discord server di deskripsi live.',
    featured: true,
  },
];
