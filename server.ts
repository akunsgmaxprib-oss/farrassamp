import crypto from 'node:crypto';
import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || process.env.SERVER_PORT) || 3000;
const HOST = '0.0.0.0';
const UPLOADS_DIR = path.resolve(__dirname, 'uploads', 'products');
const DATA_DIR = path.resolve(__dirname, 'data');
const STORE_DB_PATH = path.join(DATA_DIR, 'store.json');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

interface StoredProduct {
  id: string;
  title: string;
  category: string;
  price: number;
  originalPrice?: number;
  stockStatus: string;
  description: string;
  imageUrl: string;
  variantLabel?: string;
  deliveryNote?: string;
  featured: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

interface StoredYoutubeDownload {
  id: string;
  title: string;
  category: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  downloadUrl: string;
  fileName: string;
  fileSize: string;
  version: string;
  notes: string;
  downloadCount: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

interface StoredOrderItem {
  productId: string;
  title: string;
  price: number;
  qty: number;
}

interface StoredOrder {
  id: string;
  orderCode: string;
  customerName: string;
  customerWhatsapp: string;
  paymentMethod: string;
  customerNote?: string;
  items: StoredOrderItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface StoredProductImage {
  id: string;
  label: string;
  imageUrl: string;
  ownerId: string;
  createdAt: string;
}

interface StoreDatabase {
  auth: {
    username: string;
    passwordSalt: string;
    passwordHash: string;
    tokenSecret: string;
  };
  settings: Record<string, string>;
  products: StoredProduct[];
  youtubeDownloads: StoredYoutubeDownload[];
  orders: StoredOrder[];
  productImages: StoredProductImage[];
}

const VALID_PRODUCT_CATEGORIES = new Set([
  'Hosting SA-MP',
  'Paket On Server SA-MP',
  'Modpack GTA SA-MP',
  'Jasa Developer',
  'Jasa SA-MP',
  'Review & Streaming',
]);

const VALID_STOCK_STATUSES = new Set(['Tersedia', 'Stok Terbatas', 'Habis']);
const VALID_YT_CATEGORIES = new Set([
  'Mod & Config',
  'Preset & Editing',
  'Dokumen & Tool',
]);
const VALID_PAYMENT_METHODS = new Set(['QRIS', 'Transfer Bank', 'E-Wallet', 'COD']);
const VALID_ORDER_STATUSES = new Set([
  'Menunggu',
  'Diproses',
  'Selesai',
  'Dibatalkan',
]);

const DEFAULT_SETTINGS: Record<string, string> = {
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
  seededCatalogVersion: 'samp_v1',
  downloadsSeededV1: '1',
  discordGuildId: process.env.DISCORD_GUILD_ID || '1406592741701587124',
  discordSubscribeRoleId:
    process.env.DISCORD_SUBSCRIBE_ROLE_ID || '1558118487409295460',
  requireDiscordEntry: '0',
  ownerId: 'farras',
};

function createStarterProducts(): StoredProduct[] {
  const now = new Date().toISOString();
  const templates: Array<Omit<StoredProduct, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>> = [
    {
      title: 'Hosting SA-MP AMD EPYC 9750 — Paket Starter (50 Slot)',
      category: 'Hosting SA-MP',
      price: 15000,
      originalPrice: 20000,
      stockStatus: 'Tersedia',
      imageUrl: '/src/assets/images/samp_hosting_panel_showcase_1795183641716.jpg',
      variantLabel: 'AMD EPYC 9750 · NVMe SSD · Anti-DDoS',
      deliveryNote: 'Panel dikirim via WhatsApp/Discord setelah pembayaran terkonfirmasi',
      description:
        'Hosting server GTA SA-MP bertenaga AMD EPYC 9750 dengan NVMe SSD berkecepatan tinggi, proteksi Anti-DDoS, dan panel kontrol mudah digunakan. Cocok untuk server komunitas pemula maupun testing gamemode.',
      featured: true,
    },
    {
      title: 'Hosting SA-MP AMD EPYC 9750 — Paket Pro (100 Slot)',
      category: 'Hosting SA-MP',
      price: 25000,
      originalPrice: 35000,
      stockStatus: 'Tersedia',
      imageUrl: '/src/assets/images/samp_hosting_panel_showcase_1795183641716.jpg',
      variantLabel: 'AMD EPYC 9750 · 100 Slot · MySQL + FastDL',
      deliveryNote: 'Aktivasi cepat + dukungan setup awal via WhatsApp/Discord',
      description:
        'Paket hosting SA-MP AMD EPYC 9750 performa tinggi untuk server roleplay/freeroam aktif hingga 100 player. Sudah termasuk database MySQL cepat dan proteksi Anti-DDoS 24/7.',
      featured: true,
    },
    {
      title: 'Hosting SA-MP AMD EPYC 9750 — Paket Ultra (200+ Slot)',
      category: 'Hosting SA-MP',
      price: 45000,
      originalPrice: 60000,
      stockStatus: 'Tersedia',
      imageUrl: '/src/assets/images/samp_hosting_panel_showcase_1795183641716.jpg',
      variantLabel: 'AMD EPYC 9750 · Dedicated Resource · 200+ Slot',
      deliveryNote: 'Prioritas support & setup panel via WhatsApp/Discord',
      description:
        'Performa maksimal untuk server besar GTA SA-MP dengan CPU AMD EPYC 9750, alokasi resource lega, latency rendah region Asia Tenggara, serta proteksi Anti-DDoS tingkat lanjut.',
      featured: true,
    },
    {
      title: 'Jasa Racik Modpack SA-MP — Low',
      category: 'Modpack GTA SA-MP',
      price: 5000,
      stockStatus: 'Tersedia',
      imageUrl: '/src/assets/images/samp_modpack_low_1795184091119.jpg',
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
      imageUrl: '/src/assets/images/samp_modpack_medium_1795184091078.jpg',
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
      imageUrl: '/src/assets/images/samp_modpack_high_1795184092226.jpg',
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
      imageUrl: '/src/assets/images/samp_modpack_high_1795184092226.jpg',
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
      imageUrl: '/assets/aistudio/image_405303b2.png',
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
      imageUrl: '/assets/aistudio/image_405303b2.png',
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
      imageUrl: '/assets/aistudio/image_405303b2.png',
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
      imageUrl: '/assets/aistudio/image_405303b2.png',
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
      imageUrl: '/assets/aistudio/image_405303b2.png',
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
      imageUrl: '/assets/aistudio/image_405303b2.png',
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
      imageUrl: '/src/assets/images/samp_jasa_mapping_banner_1795183962670.jpg',
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
      imageUrl: '/src/assets/images/samp_jasa_mapping_banner_1795183962670.jpg',
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
      imageUrl: '/src/assets/images/samp_jasa_mapping_banner_1795183962670.jpg',
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
      imageUrl: '/src/assets/images/samp_jasa_mapping_banner_1795183962670.jpg',
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
      imageUrl: '/src/assets/images/samp_developer_simple_1795183206759.jpg',
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
      imageUrl: '/src/assets/images/samp_developer_simple_1795183206759.jpg',
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
      imageUrl: '/assets/aistudio/image_7e1ebf44.png',
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
      imageUrl: '/assets/aistudio/image_7e1ebf44.png',
      variantLabel: 'Live Streaming @Farrassamp · Roleplay & Mabar Komunitas',
      deliveryNote: 'Jadwal live streaming & info server disepakati via WhatsApp/Discord',
      description:
        'Jasa promosi live streaming server GTA SA-MP di kanal YouTube @Farrassamp. Bantu ramaikan player baru lewat sesi main bareng (mabar), showcase roleplay, serta tautan Discord server di deskripsi live.',
      featured: true,
    },
  ];

  return templates.map((tpl, idx) => ({
    ...tpl,
    id: `prod_starter_${idx + 1}`,
    ownerId: 'farras',
    createdAt: now,
    updatedAt: now,
  }));
}

function createStarterDownloads(): StoredYoutubeDownload[] {
  const now = new Date().toISOString();
  const templates: Array<
    Omit<StoredYoutubeDownload, 'id' | 'downloadCount' | 'ownerId' | 'createdAt' | 'updatedAt'>
  > = [
    {
      title: '[SHARE] MODPACK SAMP GANGSTER HD | SHARE MODPACK GTA SAMP INDONESIA',
      category: 'Mod & Config',
      youtubeUrl: 'https://youtu.be/_tznm7MDogM',
      youtubeVideoId: '_tznm7MDogM',
      downloadUrl: 'https://sfl.gl/LomP7',
      fileName: 'Modpack_SAMP_Gangster_HD.rar',
      fileSize: 'Link Resmi',
      version: 'v1.0',
      notes: 'Share Modpack SAMP dari kanal YouTube @Farrassamp. JAN LUPA SUBREKKK',
    },
    {
      title: '[SHARE] GAMEMODE LRP TERBARU!! | SUPPORT ALL HOSTING',
      category: 'Mod & Config',
      youtubeUrl: 'https://youtu.be/0Dtj7Cy4fBo',
      youtubeVideoId: '0Dtj7Cy4fBo',
      downloadUrl: 'https://sfl.gl/KG5qa1',
      fileName: 'Gamemode_LRP_Terbaru_Support_All_Hosting.rar',
      fileSize: 'Link Resmi',
      version: 'v1.0',
      notes: 'JAN LUPA SUBSCRIBE LEK',
    },
    {
      title: '[SHARE] MODPACK COMPE ABIZZ +300 FPS | SHARE MODPACK GTA SAMP PC INDONESIA',
      category: 'Mod & Config',
      youtubeUrl: 'https://youtu.be/qmdxAOyRfqQ',
      youtubeVideoId: 'qmdxAOyRfqQ',
      downloadUrl: 'https://sfl.gl/9IoB638A',
      fileName: 'Modpack_Compe_300FPS_PC.rar',
      fileSize: 'Link Resmi',
      version: 'v1.0',
      notes: 'JAN LUPA SUBREKKK',
    },
    {
      title: '[SHARE] MODPACK ENB GANGSTER V1 LAPTOP/PC | SHARE MODPACK GTA SAMP INDONESIA',
      category: 'Mod & Config',
      youtubeUrl: 'https://youtu.be/V3ym2vX9F_g',
      youtubeVideoId: 'V3ym2vX9F_g',
      downloadUrl: 'https://sfl.gl/Vu1kn8',
      fileName: 'Modpack_ENB_Gangster_V1_Laptop_PC.rar',
      fileSize: 'Link Resmi',
      version: 'v1.0',
      notes: 'JAN LUPA SUBREKKK',
    },
    {
      title: '[SHARE] MODPACK FPS BOOST 400+ | SHARE MODPACK GTA SAMP INDONESIA LAPTOP/PC',
      category: 'Mod & Config',
      youtubeUrl: 'https://youtu.be/ZyiV6Kbnlu4',
      youtubeVideoId: 'ZyiV6Kbnlu4',
      downloadUrl: 'https://sfl.gl/EvWM5TA',
      fileName: 'Modpack_FPS_Boost_400Plus.rar',
      fileSize: 'Link Resmi',
      version: 'v1.0',
      notes: 'JAN LUPA SUBREKKK',
    },
    {
      title: '[SHARE] MODPACK SAMP RINGAN COCOK UNTUK PC/LAPTOP KENTANG | SHARE MODPACK SAMP INDONESIA',
      category: 'Mod & Config',
      youtubeUrl: 'https://youtu.be/GChl5GGN66c',
      youtubeVideoId: 'GChl5GGN66c',
      downloadUrl: 'https://sfl.gl/Q2ZScNsu',
      fileName: 'Modpack_SAMP_Ringan_Kentang.rar',
      fileSize: 'Link Resmi',
      version: 'v1.0',
      notes: 'JAN LUPA SUBREKKK',
    },
    {
      title: '[SHARE] MODPACK SAMP RESHADE RINGAN COCOK BUAT COMPE LAPTOP/PC | SHARE MODPACK SAMP INDONESIA',
      category: 'Mod & Config',
      youtubeUrl: 'https://youtu.be/6BnPJdGWwSA',
      youtubeVideoId: '6BnPJdGWwSA',
      downloadUrl: 'https://sfl.gl/dQlSwdQH',
      fileName: 'Modpack_SAMP_Reshade_Ringan_Compe.rar',
      fileSize: 'Link Resmi',
      version: 'v1.0',
      notes: 'JAN LUPA SUBREKKK',
    },
    {
      title: '[SHARE] MODPACK SAMP RESHADE LAIKE GANGSTER | SHARE MODPACK GTA SAMP INDONESIA',
      category: 'Mod & Config',
      youtubeUrl: 'https://youtu.be/sE4qfGrk2Ks',
      youtubeVideoId: 'sE4qfGrk2Ks',
      downloadUrl: 'https://sfl.gl/9UOWwxl8',
      fileName: 'Modpack_SAMP_Reshade_Gangster.rar',
      fileSize: 'Link Resmi',
      version: 'v1.0',
      notes: 'JAN LUPA SUBREKKK',
    },
    {
      title: '[SHARE] MODPACK SAMP ENB REALISTIS JDM ABISS | SHARE MODPACK GTA SAMP INDONESIA',
      category: 'Mod & Config',
      youtubeUrl: 'https://youtu.be/ko5fXIucJIE',
      youtubeVideoId: 'ko5fXIucJIE',
      downloadUrl: 'https://sfl.gl/ymUhwC',
      fileName: 'Modpack_SAMP_ENB_Realistis_JDM.rar',
      fileSize: 'Link Resmi',
      version: 'v1.0',
      notes: 'JAN LUPA SUBREKKK',
    },
    {
      title: '[SHARE] GAMEMODE LRP MODERN MIRIP FIVEM TERBARU SUPPORT ALL HOST | SHARE GAMEMODE GTA SAMP INDONESIA',
      category: 'Mod & Config',
      youtubeUrl: 'https://youtu.be/W3uVggHShoA',
      youtubeVideoId: 'W3uVggHShoA',
      downloadUrl: 'https://sfl.gl/hIYMkO',
      fileName: 'Gamemode_LRP_Modern_FiveM_AllHost.rar',
      fileSize: 'Link Resmi',
      version: 'v1.0',
      notes: 'JAN LUPA SUBREKKK',
    },
    {
      title: '[SHARE] MODPACK RESHADE LOW END COCOK BUAT PC/LAPTOP KENTANG | SHARE MODPACK GTA SAMP INDONESIA',
      category: 'Mod & Config',
      youtubeUrl: 'https://youtu.be/sJNVHlf90-8',
      youtubeVideoId: 'sJNVHlf90-8',
      downloadUrl: 'https://sfl.gl/UkLI3',
      fileName: 'Modpack_Reshade_LowEnd_Kentang.rar',
      fileSize: 'Link Resmi',
      version: 'v1.0',
      notes: 'JAN LUPA SUBREKKK',
    },
    {
      title: '[SHARE] MODPACK HD LOW PC | SKYGFX DEFERRED FAITHFUL SHADERS | SHARE MODPACK GTA SAMP INDONESIA',
      category: 'Mod & Config',
      youtubeUrl: 'https://youtu.be/IY-WOGZUbmg',
      youtubeVideoId: 'IY-WOGZUbmg',
      downloadUrl: 'https://sfl.gl/ZUBSTW',
      fileName: 'Modpack_HD_LowPC_SkyGFX_Shaders.rar',
      fileSize: 'Link Resmi',
      version: 'v1.0',
      notes: 'JAN LUPA SUBREKKK',
    },
  ];

  return templates.map((tpl, idx) => ({
    ...tpl,
    id: `yt_starter_${idx + 1}`,
    downloadCount: 0,
    ownerId: 'farras',
    createdAt: now,
    updatedAt: now,
  }));
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password: string, salt: string, expectedHex: string): boolean {
  const actualBuf = Buffer.from(hashPassword(password, salt), 'hex');
  const expectedBuf = Buffer.from(expectedHex, 'hex');
  if (actualBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(actualBuf, expectedBuf);
}

function upgradeLegacyProductImage(
  url: string,
  category?: string,
  title?: string
): { nextUrl: string; changed: boolean } {
  const lowerTitle = (title || '').toLowerCase();
  const isLegacyModpackImg =
    url === '/src/assets/images/samp_modpack_gta_1795088414065.jpg' ||
    url === '/src/assets/images/samp_modpack_simple_1795183205938.jpg';

  if (isLegacyModpackImg) {
    if (lowerTitle.includes('low')) {
      return {
        nextUrl: '/src/assets/images/samp_modpack_low_1795184091119.jpg',
        changed: true,
      };
    }
    if (lowerTitle.includes('medium')) {
      return {
        nextUrl: '/src/assets/images/samp_modpack_medium_1795184091078.jpg',
        changed: true,
      };
    }
    return {
      nextUrl: '/src/assets/images/samp_modpack_high_1795184092226.jpg',
      changed: true,
    };
  }

  const legacyMap: Record<string, string> = {
    '/src/assets/images/product_hosting_epyc_1794999994326.jpg':
      '/src/assets/images/samp_hosting_panel_showcase_1795183641716.jpg',
    '/src/assets/images/samp_hosting_simple_1795183205351.jpg':
      '/src/assets/images/samp_hosting_panel_showcase_1795183641716.jpg',
    '/src/assets/images/samp_onserver_hosting_1795088413033.jpg':
      '/assets/aistudio/image_405303b2.png',
    '/src/assets/images/samp_onserver_simple_1795183206946.jpg':
      '/assets/aistudio/image_405303b2.png',
    '/src/assets/images/samp_mapping_world_1795088411956.jpg':
      '/src/assets/images/samp_jasa_mapping_banner_1795183962670.jpg',
    '/src/assets/images/samp_mapping_simple_1795183205976.jpg':
      '/src/assets/images/samp_jasa_mapping_banner_1795183962670.jpg',
    '/src/assets/images/samp_developer_code_1795088414147.jpg':
      '/src/assets/images/samp_developer_simple_1795183206759.jpg',
    '/src/assets/images/product_review_streaming_1794999996582.jpg':
      '/assets/aistudio/image_7e1ebf44.png',
  };
  if (legacyMap[url]) {
    return { nextUrl: legacyMap[url], changed: true };
  }
  if (
    category === 'Hosting SA-MP' &&
    url === '/src/assets/images/hero_amd_epyc_1795000978901.jpg'
  ) {
    return {
      nextUrl: '/src/assets/images/samp_hosting_panel_showcase_1795183641716.jpg',
      changed: true,
    };
  }
  return { nextUrl: url, changed: false };
}

function loadOrInitDatabase(): StoreDatabase {
  if (fs.existsSync(STORE_DB_PATH)) {
    try {
      const raw = fs.readFileSync(STORE_DB_PATH, 'utf8');
      const parsed = JSON.parse(raw) as Partial<StoreDatabase>;
      if (parsed && parsed.auth && Array.isArray(parsed.products)) {
        let migratedImages = false;
        const upgradedProducts = parsed.products.map((prod) => {
          const { nextUrl, changed } = upgradeLegacyProductImage(
            prod.imageUrl,
            prod.category,
            prod.title
          );
          if (!changed) return prod;
          migratedImages = true;
          return { ...prod, imageUrl: nextUrl };
        });

        let mutatedDb = migratedImages;
        const nextSettings: Record<string, string> = {
          ...DEFAULT_SETTINGS,
          ...(parsed.settings || {}),
        };

        if (
          nextSettings.reviewSeeded !== '1' &&
          !upgradedProducts.some((p) => p.category === 'Review & Streaming')
        ) {
          const reviewStarters = createStarterProducts().filter(
            (p) => p.category === 'Review & Streaming'
          );
          upgradedProducts.push(...reviewStarters);
          nextSettings.reviewSeeded = '1';
          mutatedDb = true;
        }

        const nextDownloads = Array.isArray(parsed.youtubeDownloads)
          ? [...parsed.youtubeDownloads]
          : [];

        if (parsed.settings?.downloadsSeededV1 !== '1') {
          const existingVideoIds = new Set(
            nextDownloads.map((d) => d.youtubeVideoId)
          );
          const missingStarterDownloads = createStarterDownloads().filter(
            (d) => !existingVideoIds.has(d.youtubeVideoId)
          );
          if (missingStarterDownloads.length > 0) {
            nextDownloads.push(...missingStarterDownloads);
          }
          nextSettings.downloadsSeededV1 = '1';
          mutatedDb = true;
        }

        const loadedDb: StoreDatabase = {
          auth: parsed.auth,
          settings: nextSettings,
          products: upgradedProducts,
          youtubeDownloads: nextDownloads,
          orders: Array.isArray(parsed.orders) ? parsed.orders : [],
          productImages: Array.isArray(parsed.productImages)
            ? parsed.productImages
            : [],
        };

        if (mutatedDb) {
          persistDatabase(loadedDb);
        }

        return loadedDb;
      }
    } catch (error) {
      console.error('Failed reading existing store.json, re-initializing:', error);
    }
  }

  const initialUsername = (process.env.ADMIN_USERNAME || 'Farras').trim();
  const initialPassword = process.env.ADMIN_PASSWORD || '102011';
  const salt = crypto.randomBytes(16).toString('hex');
  const dbState: StoreDatabase = {
    auth: {
      username: initialUsername,
      passwordSalt: salt,
      passwordHash: hashPassword(initialPassword, salt),
      tokenSecret: crypto.randomBytes(32).toString('hex'),
    },
    settings: { ...DEFAULT_SETTINGS },
    products: createStarterProducts(),
    youtubeDownloads: createStarterDownloads(),
    orders: [],
    productImages: [],
  };

  persistDatabase(dbState);
  return dbState;
}

function persistDatabase(dbState: StoreDatabase): void {
  const tmpPath = `${STORE_DB_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(dbState, null, 2), 'utf8');
  fs.renameSync(tmpPath, STORE_DB_PATH);
}

const storeDb = loadOrInitDatabase();

function createAdminToken(username: string): string {
  const payload = {
    sub: username,
    role: 'owner',
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', storeDb.auth.tokenSecret)
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${sig}`;
}

function verifyAdminToken(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encodedPayload, sig] = parts;
  if (!encodedPayload || !sig) return null;

  const expectedSig = crypto
    .createHmac('sha256', storeDb.auth.tokenSecret)
    .update(encodedPayload)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8')
    ) as { sub?: string; exp?: number };
    if (!parsed.sub || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) {
      return null;
    }
    if (parsed.sub.toLowerCase() !== storeDb.auth.username.toLowerCase()) {
      return null;
    }
    return storeDb.auth.username;
  } catch {
    return null;
  }
}

function extractBearerToken(req: Request): string {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return '';
  return header.slice(7).trim();
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  const username = token ? verifyAdminToken(token) : null;
  if (!username) {
    res.status(401).json({ error: 'Sesi admin tidak valid atau sudah berakhir.' });
    return;
  }
  next();
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
}

function cleanStr(val: unknown, maxLen: number): string {
  return typeof val === 'string' ? val.trim().slice(0, maxLen) : '';
}

function isSafeExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function isSafeProductImage(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed || trimmed.length > 300000) return false;
  if (trimmed.startsWith('/')) return true;
  if (/^data:image\/(jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(trimmed)) {
    return true;
  }
  return isSafeExternalUrl(trimmed);
}

const DISCORD_COOKIE_NAME = 'ra_discord_session';

interface DiscordSessionPayload {
  sid: string;
  discordId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  inGuild: boolean;
  hasSubscribeRole: boolean;
  exp: number;
}

// Server-side storage for Discord OAuth access tokens (never sent to browser)
const discordAccessTokens = new Map<
  string,
  { accessToken: string; expiresAt: number }
>();

function getDiscordClientConfig(): { clientId: string; clientSecret: string } {
  return {
    clientId: (process.env.DISCORD_CLIENT_ID || '').trim(),
    clientSecret: (process.env.DISCORD_CLIENT_SECRET || '').trim(),
  };
}

function isDiscordOAuthConfigured(): boolean {
  const { clientId, clientSecret } = getDiscordClientConfig();
  return Boolean(clientId && clientSecret);
}

function getActiveDiscordGuildId(): string {
  const raw = (
    storeDb.settings.discordGuildId ||
    process.env.DISCORD_GUILD_ID ||
    '1406592741701587124'
  ).trim();
  return /^\d{15,22}$/.test(raw) ? raw : '1406592741701587124';
}

function getActiveSubscribeRoleId(): string {
  const raw = (
    storeDb.settings.discordSubscribeRoleId ||
    process.env.DISCORD_SUBSCRIBE_ROLE_ID ||
    '1558118487409295460'
  ).trim();
  return /^\d{15,22}$/.test(raw) ? raw : '1558118487409295460';
}

function isAllowedAppOrigin(rawOrigin: string): boolean {
  try {
    const parsed = new URL(rawOrigin);
    if (parsed.origin !== rawOrigin) return false;
    if (parsed.protocol === 'https:') return true;
    if (
      parsed.protocol === 'http:' &&
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function resolveAppOrigin(candidateOrigin?: string): string | null {
  if (candidateOrigin && isAllowedAppOrigin(candidateOrigin)) {
    return candidateOrigin;
  }
  const envUrl = (process.env.APP_URL || '').trim();
  if (envUrl) {
    try {
      const origin = new URL(envUrl).origin;
      if (isAllowedAppOrigin(origin)) return origin;
    } catch {
      // ignore invalid APP_URL
    }
  }
  return null;
}

function signHmacToken(payload: object): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', storeDb.auth.tokenSecret)
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${sig}`;
}

function verifyHmacToken<T extends { exp?: number }>(token: string): T | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encodedPayload, sig] = parts;
  if (!encodedPayload || !sig) return null;

  const expectedSig = crypto
    .createHmac('sha256', storeDb.auth.tokenSecret)
    .update(encodedPayload)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8')
    ) as T;
    if (typeof parsed.exp !== 'number' || parsed.exp < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function createDiscordStateToken(appOrigin: string, redirectUri: string): string {
  return signHmacToken({
    nonce: crypto.randomBytes(16).toString('hex'),
    appOrigin,
    redirectUri,
    exp: Date.now() + 10 * 60 * 1000,
  });
}

function verifyDiscordStateToken(
  token: string
): { appOrigin: string; redirectUri: string } | null {
  const parsed = verifyHmacToken<{
    appOrigin?: string;
    redirectUri?: string;
    exp?: number;
  }>(token);
  if (
    !parsed ||
    !parsed.appOrigin ||
    !parsed.redirectUri ||
    !isAllowedAppOrigin(parsed.appOrigin)
  ) {
    return null;
  }
  return { appOrigin: parsed.appOrigin, redirectUri: parsed.redirectUri };
}

function createDiscordSessionToken(session: DiscordSessionPayload): string {
  return signHmacToken(session);
}

function verifyDiscordSessionToken(token: string): DiscordSessionPayload | null {
  const parsed = verifyHmacToken<Partial<DiscordSessionPayload>>(token);
  if (!parsed || !parsed.sid || !parsed.discordId || !parsed.username) {
    return null;
  }
  return {
    sid: parsed.sid,
    discordId: parsed.discordId,
    username: parsed.username,
    displayName: parsed.displayName || parsed.username,
    avatarUrl: parsed.avatarUrl || null,
    inGuild: Boolean(parsed.inGuild),
    hasSubscribeRole: Boolean(parsed.hasSubscribeRole),
    exp: parsed.exp || 0,
  };
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  const result: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) continue;
    const key = part.slice(0, eqIdx).trim();
    const val = part.slice(eqIdx + 1).trim();
    if (!key) continue;
    try {
      result[key] = decodeURIComponent(val);
    } catch {
      result[key] = val;
    }
  }
  return result;
}

function extractDiscordSession(req: Request): DiscordSessionPayload | null {
  const headerToken = req.headers['x-discord-token'];
  if (typeof headerToken === 'string' && headerToken.trim()) {
    const verified = verifyDiscordSessionToken(headerToken.trim());
    if (verified) return verified;
  }
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies[DISCORD_COOKIE_NAME];
  if (cookieToken) {
    return verifyDiscordSessionToken(cookieToken);
  }
  return null;
}

function isAdminRequest(req: Request): boolean {
  const token = extractBearerToken(req);
  return Boolean(token && verifyAdminToken(token));
}

function isHttpsRequest(req: Request): boolean {
  if (req.secure) return true;
  const proto = String(req.headers['x-forwarded-proto'] || '').toLowerCase();
  if (proto.includes('https')) return true;
  const origin = String(req.headers.origin || '').toLowerCase();
  if (origin.startsWith('https://')) return true;
  const referer = String(req.headers.referer || '').toLowerCase();
  return referer.startsWith('https://');
}

function setDiscordSessionCookie(
  req: Request,
  res: Response,
  token: string
): void {
  const maxAgeSec = 7 * 24 * 60 * 60;
  const parts = [
    `${DISCORD_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    `Max-Age=${maxAgeSec}`,
    'HttpOnly',
  ];
  if (isHttpsRequest(req)) {
    parts.push('Secure', 'SameSite=None', 'Partitioned');
  } else {
    parts.push('SameSite=Lax');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearDiscordSessionCookie(req: Request, res: Response): void {
  const parts = [`${DISCORD_COOKIE_NAME}=`, 'Path=/', 'Max-Age=0', 'HttpOnly'];
  if (isHttpsRequest(req)) {
    parts.push('Secure', 'SameSite=None', 'Partitioned');
  } else {
    parts.push('SameSite=Lax');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

function isSameOriginMutation(req: Request): boolean {
  const origin = req.headers.origin;
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  if (typeof origin === 'string' && host) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }
  return (
    req.headers['x-requested-with'] === 'XMLHttpRequest' ||
    Boolean(typeof req.headers['x-discord-token'] === 'string' && req.headers['x-discord-token'].trim())
  );
}

async function fetchDiscordUserAndRole(
  accessToken: string,
  guildId: string,
  subscribeRoleId: string
): Promise<{
  discordId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  inGuild: boolean;
  hasSubscribeRole: boolean;
}> {
  const userRes = await fetch('https://discord.com/api/v10/users/@me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!userRes.ok) {
    throw new Error(`Discord user lookup failed (${userRes.status})`);
  }
  const userData = (await userRes.json()) as {
    id: string;
    username: string;
    global_name?: string | null;
    avatar?: string | null;
  };

  const avatarUrl = userData.avatar
    ? `https://cdn.discordapp.com/avatars/${encodeURIComponent(userData.id)}/${encodeURIComponent(userData.avatar)}.png?size=128`
    : null;

  let inGuild = false;
  let hasSubscribeRole = false;

  const memberRes = await fetch(
    `https://discord.com/api/v10/users/@me/guilds/${encodeURIComponent(guildId)}/member`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (memberRes.ok) {
    const memberData = (await memberRes.json()) as { roles?: unknown };
    inGuild = true;
    if (Array.isArray(memberData.roles)) {
      hasSubscribeRole = memberData.roles.includes(subscribeRoleId);
    }
  } else if (memberRes.status === 404) {
    inGuild = false;
    hasSubscribeRole = false;
  } else if (memberRes.status === 401 || memberRes.status === 403) {
    throw new Error(`Discord member lookup unauthorized (${memberRes.status})`);
  }

  return {
    discordId: userData.id,
    username: userData.username,
    displayName: userData.global_name || userData.username,
    avatarUrl,
    inGuild,
    hasSubscribeRole,
  };
}

function renderDiscordPopupHtml(
  targetOrigin: string | null,
  payload: Record<string, unknown>,
  statusText: string
): string {
  const safePayload = JSON.stringify(payload).replace(/</g, '\\u003c');
  const safeOrigin = JSON.stringify(targetOrigin || '*').replace(/</g, '\\u003c');
  const escapedStatus = statusText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Verifikasi Discord - RA STORE</title>
    <style>
      body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#090A0D;color:#F4F4F5;font-family:system-ui,-apple-system,sans-serif;padding:24px;text-align:center}
      .card{max-width:360px;background:#111318;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:24px}
      p{margin:0;font-size:14px;color:#A1A1AA;line-height:1.5}
      strong{display:block;font-size:16px;color:#fff;margin-bottom:8px}
    </style>
  </head>
  <body>
    <div class="card">
      <strong>RA STORE · Discord Verifikasi</strong>
      <p>${escapedStatus}</p>
    </div>
    <script>
      (function () {
        var payload = ${safePayload};
        var targetOrigin = ${safeOrigin};
        try {
          if (window.opener) {
            window.opener.postMessage(payload, targetOrigin);
            window.close();
            return;
          }
        } catch (e) {
          try {
            if (window.opener) {
              window.opener.postMessage(payload, '*');
              window.close();
              return;
            }
          } catch (_) {}
        }
        window.location.href = '/';
      })();
    </script>
  </body>
</html>`;
}

// Connected Server-Sent Events clients for real-time storefront & admin updates
const sseClients = new Set<Response>();

function broadcastEvent(eventName: 'store_updated' | 'admin_updated'): void {
  const frame = `event: ${eventName}\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(frame);
    } catch {
      sseClients.delete(client);
    }
  }
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '6mb' }));

  // Serve uploaded product images
  app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));

  // Real-time event stream (SSE)
  app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    res.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);

    sseClients.add(res);
    const keepAlive = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(keepAlive);
        sseClients.delete(res);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(keepAlive);
      sseClients.delete(res);
    });
  });

  // Discord OAuth2 Verification & Subscribe Role Gate
  app.get('/api/discord/auth-url', (req, res) => {
    const { clientId, clientSecret } = getDiscordClientConfig();
    if (!clientId || !clientSecret) {
      res.status(503).json({
        error:
          'Discord OAuth belum dikonfigurasi (DISCORD_CLIENT_ID & DISCORD_CLIENT_SECRET).',
      });
      return;
    }

    const requestedOrigin =
      typeof req.query.origin === 'string' ? req.query.origin.trim() : '';
    const appOrigin = resolveAppOrigin(requestedOrigin);
    if (!appOrigin) {
      res.status(400).json({ error: 'Origin aplikasi tidak valid.' });
      return;
    }

    const redirectUri = `${appOrigin}/auth/discord/callback`;
    const state = createDiscordStateToken(appOrigin, redirectUri);
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify guilds.members.read',
      state,
    });

    res.json({
      url: `https://discord.com/oauth2/authorize?${params.toString()}`,
    });
  });

  app.get(
    ['/auth/discord/callback', '/auth/discord/callback/'],
    async (req, res) => {
      const code = typeof req.query.code === 'string' ? req.query.code.trim() : '';
      const state = typeof req.query.state === 'string' ? req.query.state.trim() : '';
      const oauthError =
        typeof req.query.error === 'string' ? req.query.error.trim() : '';

      const verifiedState = state ? verifyDiscordStateToken(state) : null;
      const targetOrigin = verifiedState?.appOrigin || resolveAppOrigin() || null;

      if (!verifiedState) {
        res
          .status(400)
          .send(
            renderDiscordPopupHtml(
              targetOrigin,
              {
                type: 'DISCORD_AUTH_RESULT',
                ok: false,
                error: 'Sesi verifikasi Discord kedaluwarsa. Silakan coba lagi.',
              },
              'Sesi verifikasi kedaluwarsa. Jendela akan tertutup...'
            )
          );
        return;
      }

      if (oauthError || !code) {
        res.send(
          renderDiscordPopupHtml(
            verifiedState.appOrigin,
            {
              type: 'DISCORD_AUTH_RESULT',
              ok: false,
              error: 'Verifikasi Discord dibatalkan.',
            },
            'Verifikasi Discord dibatalkan. Jendela akan tertutup...'
          )
        );
        return;
      }

      const { clientId, clientSecret } = getDiscordClientConfig();
      if (!clientId || !clientSecret) {
        res
          .status(503)
          .send(
            renderDiscordPopupHtml(
              verifiedState.appOrigin,
              {
                type: 'DISCORD_AUTH_RESULT',
                ok: false,
                error: 'Discord OAuth belum dikonfigurasi di server.',
              },
              'Discord OAuth belum dikonfigurasi.'
            )
          );
        return;
      }

      try {
        const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'authorization_code',
            code,
            redirect_uri: verifiedState.redirectUri,
          }),
        });

        if (!tokenRes.ok) {
          throw new Error(`Discord token exchange failed (${tokenRes.status})`);
        }

        const tokenData = (await tokenRes.json()) as {
          access_token?: string;
          expires_in?: number;
        };
        if (!tokenData.access_token) {
          throw new Error('Missing Discord access token');
        }

        const guildId = getActiveDiscordGuildId();
        const roleId = getActiveSubscribeRoleId();
        const profile = await fetchDiscordUserAndRole(
          tokenData.access_token,
          guildId,
          roleId
        );

        const sid = makeId('dc');
        const expiresInMs = Math.max(
          60_000,
          Number(tokenData.expires_in || 604800) * 1000
        );
        discordAccessTokens.set(sid, {
          accessToken: tokenData.access_token,
          expiresAt: Date.now() + expiresInMs,
        });

        const sessionPayload: DiscordSessionPayload = {
          sid,
          discordId: profile.discordId,
          username: profile.username,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          inGuild: profile.inGuild,
          hasSubscribeRole: profile.hasSubscribeRole,
          exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
        };
        const sessionToken = createDiscordSessionToken(sessionPayload);
        setDiscordSessionCookie(req, res, sessionToken);

        res.send(
          renderDiscordPopupHtml(
            verifiedState.appOrigin,
            {
              type: 'DISCORD_AUTH_RESULT',
              ok: true,
              token: sessionToken,
              user: {
                discordId: sessionPayload.discordId,
                username: sessionPayload.username,
                displayName: sessionPayload.displayName,
                avatarUrl: sessionPayload.avatarUrl,
                inGuild: sessionPayload.inGuild,
                hasSubscribeRole: sessionPayload.hasSubscribeRole,
              },
            },
            'Verifikasi Discord berhasil! Jendela ini akan menutup otomatis...'
          )
        );
      } catch (err) {
        console.error('Discord OAuth callback error:', err);
        res
          .status(500)
          .send(
            renderDiscordPopupHtml(
              verifiedState.appOrigin,
              {
                type: 'DISCORD_AUTH_RESULT',
                ok: false,
                error:
                  'Gagal memverifikasi akun Discord. Pastikan Redirect URI sudah sesuai.',
              },
              'Terjadi kesalahan saat verifikasi Discord.'
            )
          );
      }
    }
  );

  app.post('/api/discord/recheck', async (req, res) => {
    if (!isSameOriginMutation(req)) {
      res.status(403).json({ error: 'Permintaan tidak diizinkan.' });
      return;
    }

    const session = extractDiscordSession(req);
    if (!session) {
      res
        .status(401)
        .json({ error: 'Belum terverifikasi Discord.', reauthRequired: true });
      return;
    }

    const cached = discordAccessTokens.get(session.sid);
    if (!cached || cached.expiresAt < Date.now()) {
      res.status(401).json({
        error: 'Sesi cek role sudah habis. Silakan verifikasi ulang Discord.',
        reauthRequired: true,
      });
      return;
    }

    try {
      const guildId = getActiveDiscordGuildId();
      const roleId = getActiveSubscribeRoleId();
      const profile = await fetchDiscordUserAndRole(
        cached.accessToken,
        guildId,
        roleId
      );

      const nextSession: DiscordSessionPayload = {
        ...session,
        username: profile.username,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        inGuild: profile.inGuild,
        hasSubscribeRole: profile.hasSubscribeRole,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
      };
      const nextToken = createDiscordSessionToken(nextSession);
      setDiscordSessionCookie(req, res, nextToken);

      res.json({
        token: nextToken,
        user: {
          discordId: nextSession.discordId,
          username: nextSession.username,
          displayName: nextSession.displayName,
          avatarUrl: nextSession.avatarUrl,
          inGuild: nextSession.inGuild,
          hasSubscribeRole: nextSession.hasSubscribeRole,
        },
      });
    } catch (err) {
      console.error('Discord role recheck failed:', err);
      res.status(401).json({
        error: 'Gagal mengecek ulang role. Silakan verifikasi ulang Discord.',
        reauthRequired: true,
      });
    }
  });

  app.post('/api/discord/session', (req, res) => {
    if (!isSameOriginMutation(req)) {
      res.status(403).json({ error: 'Permintaan tidak diizinkan.' });
      return;
    }
    const headerToken = req.headers['x-discord-token'];
    const rawToken = typeof headerToken === 'string' ? headerToken.trim() : '';
    const verified = rawToken ? verifyDiscordSessionToken(rawToken) : null;
    if (!verified) {
      res.status(401).json({ error: 'Token sesi Discord tidak valid atau kedaluwarsa.' });
      return;
    }
    setDiscordSessionCookie(req, res, rawToken);
    res.json({ ok: true });
  });

  app.post('/api/discord/resume', (req, res) => {
    if (!isSameOriginMutation(req)) {
      res.status(403).json({ error: 'Permintaan tidak diizinkan.' });
      return;
    }

    const headerToken = req.headers['x-discord-token'];
    const cookieToken = parseCookies(req.headers.cookie)[DISCORD_COOKIE_NAME];
    const candidateToken =
      typeof headerToken === 'string' && headerToken.trim()
        ? headerToken.trim()
        : cookieToken || '';

    const verified = candidateToken ? verifyDiscordSessionToken(candidateToken) : null;
    if (!verified) {
      clearDiscordSessionCookie(req, res);
      res.status(401).json({
        ok: false,
        authenticated: false,
        error: 'Sesi Discord tidak ditemukan atau sudah kedaluwarsa.',
      });
      return;
    }

    setDiscordSessionCookie(req, res, candidateToken);
    res.json({
      ok: true,
      authenticated: true,
      token: candidateToken,
      user: {
        discordId: verified.discordId,
        username: verified.username,
        displayName: verified.displayName,
        avatarUrl: verified.avatarUrl,
        inGuild: verified.inGuild,
        hasSubscribeRole: verified.hasSubscribeRole,
      },
    });
  });

  app.post('/api/discord/logout', (req, res) => {
    if (!isSameOriginMutation(req)) {
      res.status(403).json({ error: 'Permintaan tidak diizinkan.' });
      return;
    }
    const session = extractDiscordSession(req);
    if (session) {
      discordAccessTokens.delete(session.sid);
    }
    clearDiscordSessionCookie(req, res);
    res.json({ ok: true });
  });

  // Public storefront payload (YouTube Downloads gated server-side by Discord Subscribe Role)
  app.get('/api/store', (req, res) => {
    const isAdmin = isAdminRequest(req);
    const discordSession = extractDiscordSession(req);
    const guildId = getActiveDiscordGuildId();
    const subscribeRoleId = getActiveSubscribeRoleId();
    const hasSubscribeRole = Boolean(discordSession?.hasSubscribeRole);
    const canAccessDownloads = isAdmin || hasSubscribeRole;

    res.json({
      products: storeDb.products,
      youtubeDownloads: canAccessDownloads ? storeDb.youtubeDownloads : [],
      lockedDownloadsCount: storeDb.youtubeDownloads.length,
      downloadAccess: {
        allowed: canAccessDownloads,
        authenticated: Boolean(discordSession),
        inGuild: Boolean(discordSession?.inGuild),
        hasSubscribeRole,
        guildId,
        subscribeRoleId,
        discordUser: discordSession
          ? {
              discordId: discordSession.discordId,
              username: discordSession.username,
              displayName: discordSession.displayName,
              avatarUrl: discordSession.avatarUrl,
              inGuild: discordSession.inGuild,
              hasSubscribeRole: discordSession.hasSubscribeRole,
            }
          : null,
      },
      discordConfig: {
        configured: isDiscordOAuthConfigured(),
        requireDiscordEntry: storeDb.settings.requireDiscordEntry === '1',
        guildId,
        subscribeRoleId,
      },
      settings: storeDb.settings,
    });
  });

  // Admin auth login (Username + Password)
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = (req.body || {}) as {
      username?: unknown;
      password?: unknown;
    };

    const cleanUser = typeof username === 'string' ? username.trim() : '';
    const cleanPass = typeof password === 'string' ? password : '';

    if (
      !cleanUser ||
      !cleanPass ||
      cleanUser.toLowerCase() !== storeDb.auth.username.toLowerCase() ||
      !verifyPassword(cleanPass, storeDb.auth.passwordSalt, storeDb.auth.passwordHash)
    ) {
      res.status(401).json({ error: 'Username atau kata sandi admin salah.' });
      return;
    }

    const token = createAdminToken(storeDb.auth.username);
    res.json({
      token,
      username: storeDb.auth.username,
    });
  });

  app.get('/api/auth/me', (req, res) => {
    const token = extractBearerToken(req);
    const username = token ? verifyAdminToken(token) : null;
    if (!username) {
      res.json({ authenticated: false, username: null });
      return;
    }
    res.json({ authenticated: true, username });
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/auth/change-password', requireAdmin, (req, res) => {
    const { currentPassword, newUsername, newPassword } = (req.body || {}) as {
      currentPassword?: unknown;
      newUsername?: unknown;
      newPassword?: unknown;
    };

    if (
      typeof currentPassword !== 'string' ||
      !verifyPassword(
        currentPassword,
        storeDb.auth.passwordSalt,
        storeDb.auth.passwordHash
      )
    ) {
      res.status(400).json({ error: 'Kata sandi saat ini tidak cocok.' });
      return;
    }

    const nextUser =
      typeof newUsername === 'string' && newUsername.trim().length >= 2
        ? newUsername.trim().slice(0, 40)
        : storeDb.auth.username;

    if (typeof newPassword !== 'string' || newPassword.length < 4) {
      res.status(400).json({ error: 'Kata sandi baru minimal 4 karakter.' });
      return;
    }

    const nextSalt = crypto.randomBytes(16).toString('hex');
    storeDb.auth = {
      username: nextUser,
      passwordSalt: nextSalt,
      passwordHash: hashPassword(newPassword, nextSalt),
      tokenSecret: crypto.randomBytes(32).toString('hex'),
    };
    persistDatabase(storeDb);

    const freshToken = createAdminToken(nextUser);
    res.json({ token: freshToken, username: nextUser });
  });

  // Protected admin dashboard collections
  app.get('/api/admin/data', requireAdmin, (_req, res) => {
    res.json({
      orders: storeDb.orders,
      productImages: storeDb.productImages,
    });
  });

  // Product photo file upload (admin only)
  app.post('/api/upload-product-image', requireAdmin, (req, res) => {
    try {
      const { dataUrl } = req.body as { dataUrl?: unknown };
      if (typeof dataUrl !== 'string') {
        res.status(400).json({ error: 'Format gambar tidak valid.' });
        return;
      }

      const match = dataUrl.match(
        /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/
      );
      if (!match) {
        res.status(400).json({ error: 'Hanya mendukung gambar JPG, PNG, atau WebP.' });
        return;
      }

      const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
      const buffer = Buffer.from(match[2], 'base64');

      if (buffer.byteLength > 5 * 1024 * 1024) {
        res.status(413).json({ error: 'Ukuran gambar maksimal 5 MB.' });
        return;
      }

      const safeFileName = `prod_${Date.now()}_${crypto.randomBytes(3).toString('hex')}.${ext}`;
      const targetPath = path.join(UPLOADS_DIR, safeFileName);
      fs.writeFileSync(targetPath, buffer);

      res.json({ url: `/uploads/products/${safeFileName}` });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Gagal menyimpan foto produk.' });
    }
  });

  // Saved Cloud Gallery images
  app.post('/api/product-images', requireAdmin, (req, res) => {
    const { label, imageUrl } = (req.body || {}) as {
      label?: unknown;
      imageUrl?: unknown;
    };
    const cleanImg = cleanStr(imageUrl, 300000);
    if (!isSafeProductImage(cleanImg)) {
      res.status(400).json({ error: 'Format gambar produk tidak valid.' });
      return;
    }
    const entry: StoredProductImage = {
      id: makeId('img'),
      label: cleanStr(label, 80) || 'Foto Produk',
      imageUrl: cleanImg,
      ownerId: storeDb.auth.username,
      createdAt: new Date().toISOString(),
    };
    storeDb.productImages.unshift(entry);
    persistDatabase(storeDb);
    broadcastEvent('admin_updated');
    res.status(201).json(entry);
  });

  app.delete('/api/product-images/:id', requireAdmin, (req, res) => {
    const id = String(req.params.id || '');
    storeDb.productImages = storeDb.productImages.filter((item) => item.id !== id);
    persistDatabase(storeDb);
    broadcastEvent('admin_updated');
    res.json({ ok: true });
  });

  // Products CRUD
  app.post('/api/products', requireAdmin, (req, res) => {
    const body = (req.body || {}) as Record<string, unknown>;
    const title = cleanStr(body.title, 120);
    const category = cleanStr(body.category, 60);
    const price = Number(body.price);
    const rawOriginalPrice = Number(body.originalPrice);
    const stockStatus = cleanStr(body.stockStatus, 40);
    const description = cleanStr(body.description, 1500);
    const imageUrl = cleanStr(body.imageUrl, 300000);
    const variantLabel = cleanStr(body.variantLabel, 120);
    const deliveryNote = cleanStr(body.deliveryNote, 300);
    const featured = Boolean(body.featured);

    if (
      title.length < 2 ||
      !VALID_PRODUCT_CATEGORIES.has(category) ||
      !Number.isFinite(price) ||
      price < 0 ||
      price > 100000000 ||
      !VALID_STOCK_STATUSES.has(stockStatus) ||
      !description ||
      !isSafeProductImage(imageUrl)
    ) {
      res.status(400).json({ error: 'Data produk tidak lengkap atau tidak valid.' });
      return;
    }

    const now = new Date().toISOString();
    const product: StoredProduct = {
      id: makeId('prod'),
      title,
      category,
      price: Math.round(price),
      ...(Number.isFinite(rawOriginalPrice) &&
      rawOriginalPrice > price &&
      rawOriginalPrice <= 100000000
        ? { originalPrice: Math.round(rawOriginalPrice) }
        : {}),
      stockStatus,
      description,
      imageUrl,
      ...(variantLabel ? { variantLabel } : {}),
      ...(deliveryNote ? { deliveryNote } : {}),
      featured,
      ownerId: storeDb.auth.username,
      createdAt: now,
      updatedAt: now,
    };

    storeDb.products.unshift(product);
    persistDatabase(storeDb);
    broadcastEvent('store_updated');
    res.status(201).json(product);
  });

  app.post('/api/products/batch', requireAdmin, (req, res) => {
    const templates = Array.isArray(req.body?.templates)
      ? (req.body.templates as Array<Record<string, unknown>>)
      : [];
    if (templates.length === 0) {
      res.status(400).json({ error: 'Tidak ada template produk untuk diterbitkan.' });
      return;
    }

    const now = new Date().toISOString();
    const created: StoredProduct[] = [];
    for (const tpl of templates) {
      const title = cleanStr(tpl.title, 120);
      const category = cleanStr(tpl.category, 60);
      const price = Number(tpl.price);
      const stockStatus = cleanStr(tpl.stockStatus, 40) || 'Tersedia';
      const description = cleanStr(tpl.description, 1500);
      const imageUrl = cleanStr(tpl.imageUrl, 300000);
      const variantLabel = cleanStr(tpl.variantLabel, 120);
      const deliveryNote = cleanStr(tpl.deliveryNote, 300);

      if (
        title.length < 2 ||
        !VALID_PRODUCT_CATEGORIES.has(category) ||
        !Number.isFinite(price) ||
        !description ||
        !isSafeProductImage(imageUrl)
      ) {
        continue;
      }

      created.push({
        id: makeId('prod'),
        title,
        category,
        price: Math.max(0, Math.min(100000000, Math.round(price))),
        stockStatus: VALID_STOCK_STATUSES.has(stockStatus)
          ? stockStatus
          : 'Tersedia',
        description,
        imageUrl,
        ...(variantLabel ? { variantLabel } : {}),
        ...(deliveryNote ? { deliveryNote } : {}),
        featured: Boolean(tpl.featured),
        ownerId: storeDb.auth.username,
        createdAt: now,
        updatedAt: now,
      });
    }

    storeDb.products.unshift(...created);
    persistDatabase(storeDb);
    broadcastEvent('store_updated');
    res.status(201).json({ count: created.length });
  });

  app.post('/api/products/batch-sync', requireAdmin, (req, res) => {
    const updates = Array.isArray(req.body?.updates)
      ? (req.body.updates as Array<{
          productId?: unknown;
          imageUrl?: unknown;
          category?: unknown;
        }>)
      : [];

    const now = new Date().toISOString();
    let updatedCount = 0;

    for (const u of updates) {
      const idx = storeDb.products.findIndex((p) => p.id === u.productId);
      if (idx === -1) continue;
      const target = storeDb.products[idx];
      const nextImg = cleanStr(u.imageUrl, 300000);
      const nextCat = cleanStr(u.category, 60);
      storeDb.products[idx] = {
        ...target,
        ...(nextImg && isSafeProductImage(nextImg) ? { imageUrl: nextImg } : {}),
        ...(nextCat && VALID_PRODUCT_CATEGORIES.has(nextCat)
          ? { category: nextCat }
          : {}),
        updatedAt: now,
      };
      updatedCount += 1;
    }

    persistDatabase(storeDb);
    broadcastEvent('store_updated');
    res.json({ count: updatedCount });
  });

  app.put('/api/products/:id', requireAdmin, (req, res) => {
    const id = String(req.params.id || '');
    const idx = storeDb.products.findIndex((p) => p.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Produk tidak ditemukan.' });
      return;
    }

    const body = (req.body || {}) as Record<string, unknown>;
    const title = cleanStr(body.title, 120);
    const category = cleanStr(body.category, 60);
    const price = Number(body.price);
    const rawOriginalPrice = Number(body.originalPrice);
    const stockStatus = cleanStr(body.stockStatus, 40);
    const description = cleanStr(body.description, 1500);
    const imageUrl = cleanStr(body.imageUrl, 300000);
    const variantLabel = cleanStr(body.variantLabel, 120);
    const deliveryNote = cleanStr(body.deliveryNote, 300);
    const featured = Boolean(body.featured);

    if (
      title.length < 2 ||
      !VALID_PRODUCT_CATEGORIES.has(category) ||
      !Number.isFinite(price) ||
      price < 0 ||
      price > 100000000 ||
      !VALID_STOCK_STATUSES.has(stockStatus) ||
      !description ||
      !isSafeProductImage(imageUrl)
    ) {
      res.status(400).json({ error: 'Data pembaruan produk tidak valid.' });
      return;
    }

    const existing = storeDb.products[idx];
    const updated: StoredProduct = {
      ...existing,
      title,
      category,
      price: Math.round(price),
      originalPrice:
        Number.isFinite(rawOriginalPrice) &&
        rawOriginalPrice > price &&
        rawOriginalPrice <= 100000000
          ? Math.round(rawOriginalPrice)
          : 0,
      stockStatus,
      description,
      imageUrl,
      variantLabel: variantLabel || undefined,
      deliveryNote: deliveryNote || undefined,
      featured,
      updatedAt: new Date().toISOString(),
    };

    storeDb.products[idx] = updated;
    persistDatabase(storeDb);
    broadcastEvent('store_updated');
    res.json(updated);
  });

  app.delete('/api/products/:id', requireAdmin, (req, res) => {
    const id = String(req.params.id || '');
    storeDb.products = storeDb.products.filter((p) => p.id !== id);
    persistDatabase(storeDb);
    broadcastEvent('store_updated');
    res.json({ ok: true });
  });

  // YouTube Downloads CRUD + Public Download Counter
  app.post('/api/youtube-downloads', requireAdmin, (req, res) => {
    const body = (req.body || {}) as Record<string, unknown>;
    const title = cleanStr(body.title, 140);
    const category = cleanStr(body.category, 60);
    const youtubeUrl = cleanStr(body.youtubeUrl, 300);
    const youtubeVideoId = cleanStr(body.youtubeVideoId, 32);
    const downloadUrl = cleanStr(body.downloadUrl, 500);
    const fileName = cleanStr(body.fileName, 120);
    const fileSize = cleanStr(body.fileSize, 40);
    const version = cleanStr(body.version, 30);
    const notes = cleanStr(body.notes, 1000);

    if (
      title.length < 2 ||
      !VALID_YT_CATEGORIES.has(category) ||
      !/^[a-zA-Z0-9_-]{5,32}$/.test(youtubeVideoId) ||
      !isSafeExternalUrl(downloadUrl) ||
      !fileName ||
      !fileSize ||
      !version ||
      !notes
    ) {
      res.status(400).json({ error: 'Data unduhan YouTube tidak lengkap atau tidak valid.' });
      return;
    }

    const now = new Date().toISOString();
    const item: StoredYoutubeDownload = {
      id: makeId('yt'),
      title,
      category,
      youtubeUrl,
      youtubeVideoId,
      downloadUrl,
      fileName,
      fileSize,
      version,
      notes,
      downloadCount: 0,
      ownerId: storeDb.auth.username,
      createdAt: now,
      updatedAt: now,
    };

    storeDb.youtubeDownloads.unshift(item);
    persistDatabase(storeDb);
    broadcastEvent('store_updated');
    res.status(201).json(item);
  });

  app.put('/api/youtube-downloads/:id', requireAdmin, (req, res) => {
    const id = String(req.params.id || '');
    const idx = storeDb.youtubeDownloads.findIndex((d) => d.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Item unduhan tidak ditemukan.' });
      return;
    }

    const body = (req.body || {}) as Record<string, unknown>;
    const title = cleanStr(body.title, 140);
    const category = cleanStr(body.category, 60);
    const youtubeUrl = cleanStr(body.youtubeUrl, 300);
    const youtubeVideoId = cleanStr(body.youtubeVideoId, 32);
    const downloadUrl = cleanStr(body.downloadUrl, 500);
    const fileName = cleanStr(body.fileName, 120);
    const fileSize = cleanStr(body.fileSize, 40);
    const version = cleanStr(body.version, 30);
    const notes = cleanStr(body.notes, 1000);

    if (
      title.length < 2 ||
      !VALID_YT_CATEGORIES.has(category) ||
      !/^[a-zA-Z0-9_-]{5,32}$/.test(youtubeVideoId) ||
      !isSafeExternalUrl(downloadUrl) ||
      !fileName ||
      !fileSize ||
      !version ||
      !notes
    ) {
      res.status(400).json({ error: 'Data pembaruan unduhan YouTube tidak valid.' });
      return;
    }

    const existing = storeDb.youtubeDownloads[idx];
    const updated: StoredYoutubeDownload = {
      ...existing,
      title,
      category,
      youtubeUrl,
      youtubeVideoId,
      downloadUrl,
      fileName,
      fileSize,
      version,
      notes,
      updatedAt: new Date().toISOString(),
    };

    storeDb.youtubeDownloads[idx] = updated;
    persistDatabase(storeDb);
    broadcastEvent('store_updated');
    res.json(updated);
  });

  app.delete('/api/youtube-downloads/:id', requireAdmin, (req, res) => {
    const id = String(req.params.id || '');
    storeDb.youtubeDownloads = storeDb.youtubeDownloads.filter((d) => d.id !== id);
    persistDatabase(storeDb);
    broadcastEvent('store_updated');
    res.json({ ok: true });
  });

  app.post('/api/youtube-downloads/:id/track', (req, res) => {
    const isAdmin = isAdminRequest(req);
    const discordSession = extractDiscordSession(req);
    if (!isAdmin && !discordSession?.hasSubscribeRole) {
      res.status(403).json({
        error: 'Akses unduhan hanya untuk member Discord dengan role Subscribe.',
      });
      return;
    }

    const id = String(req.params.id || '');
    const idx = storeDb.youtubeDownloads.findIndex((d) => d.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'File unduhan tidak ditemukan.' });
      return;
    }
    storeDb.youtubeDownloads[idx].downloadCount += 1;
    persistDatabase(storeDb);
    broadcastEvent('store_updated');
    res.json({ downloadCount: storeDb.youtubeDownloads[idx].downloadCount });
  });

  // Public Order Creation + Admin Order Status Update
  app.post('/api/orders', (req, res) => {
    const body = (req.body || {}) as Record<string, unknown>;
    const orderCode = cleanStr(body.orderCode, 30);
    const customerName = cleanStr(body.customerName, 100);
    const customerWhatsapp = cleanStr(body.customerWhatsapp, 30);
    const paymentMethod = cleanStr(body.paymentMethod, 40);
    const customerNote = cleanStr(body.customerNote, 500);
    const totalAmount = Number(body.totalAmount);
    const rawItems = Array.isArray(body.items) ? body.items : [];

    if (
      customerName.length < 2 ||
      customerWhatsapp.length < 6 ||
      !VALID_PAYMENT_METHODS.has(paymentMethod) ||
      !Number.isFinite(totalAmount) ||
      totalAmount < 0 ||
      rawItems.length === 0 ||
      rawItems.length > 20
    ) {
      res.status(400).json({ error: 'Data pesanan tidak valid.' });
      return;
    }

    const orderItems: StoredOrderItem[] = rawItems.map((entry) => {
      const item = entry as Record<string, unknown>;
      return {
        productId: cleanStr(item.productId, 128) || 'custom',
        title: cleanStr(item.title, 120) || 'Produk',
        price: Math.max(0, Math.round(Number(item.price) || 0)),
        qty: Math.min(99, Math.max(1, Math.round(Number(item.qty) || 1))),
      };
    });

    const now = new Date().toISOString();
    const order: StoredOrder = {
      id: makeId('order'),
      orderCode: orderCode || `RA-${Date.now().toString().slice(-6)}`,
      customerName,
      customerWhatsapp,
      paymentMethod,
      ...(customerNote ? { customerNote } : {}),
      items: orderItems,
      totalAmount: Math.round(totalAmount),
      status: 'Menunggu',
      createdAt: now,
      updatedAt: now,
    };

    storeDb.orders.unshift(order);
    persistDatabase(storeDb);
    broadcastEvent('admin_updated');
    res.status(201).json(order);
  });

  app.patch('/api/orders/:id', requireAdmin, (req, res) => {
    const id = String(req.params.id || '');
    const status = cleanStr(req.body?.status, 40);
    if (!VALID_ORDER_STATUSES.has(status)) {
      res.status(400).json({ error: 'Status pesanan tidak valid.' });
      return;
    }
    const idx = storeDb.orders.findIndex((o) => o.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
      return;
    }
    storeDb.orders[idx] = {
      ...storeDb.orders[idx],
      status,
      updatedAt: new Date().toISOString(),
    };
    persistDatabase(storeDb);
    broadcastEvent('admin_updated');
    res.json(storeDb.orders[idx]);
  });

  // Store Settings & Website Copy
  app.put('/api/settings', requireAdmin, (req, res) => {
    const body = (req.body || {}) as Record<string, unknown>;
    const allowedMaxLengths: Record<string, number> = {
      whatsappNumber: 30,
      youtubeChannelUrl: 300,
      discordUsername: 80,
      discordInviteUrl: 300,
      announcement: 200,
      brandName: 40,
      heroTagline: 80,
      heroTitle: 160,
      heroSubtitle: 500,
      heroImageCaptionTitle: 80,
      heroImageCaptionSubtitle: 140,
      catalogEyebrow: 80,
      catalogTitle: 100,
      youtubeEyebrow: 80,
      youtubeTitle: 100,
      aboutRoleLabel: 80,
      ownerDisplayName: 80,
      aboutDescription: 600,
      officialCardSubtitle: 120,
      footerText: 160,
      ytTabAllLabel: 40,
      ytTabModLabel: 40,
      ytTabPresetLabel: 40,
      ytTabDocLabel: 40,
      catTabAllLabel: 40,
      catTabHostingLabel: 40,
      catTabPaketOnLabel: 40,
      catTabModpackLabel: 40,
      catTabDevLabel: 40,
      catTabJasaSampLabel: 40,
      catTabReviewLabel: 40,
      seededCatalogVersion: 40,
      discordGuildId: 30,
      discordSubscribeRoleId: 30,
      requireDiscordEntry: 5,
    };

    const nextSettings: Record<string, string> = { ...storeDb.settings };
    for (const [key, maxLen] of Object.entries(allowedMaxLengths)) {
      const rawVal = body[key];
      if (typeof rawVal === 'string') {
        nextSettings[key] = rawVal.trim().slice(0, maxLen);
      }
    }
    nextSettings.ownerId = storeDb.auth.username;
    nextSettings.updatedAt = new Date().toISOString();

    storeDb.settings = nextSettings;
    persistDatabase(storeDb);
    broadcastEvent('store_updated');
    res.json(storeDb.settings);
  });

  const distDir = path.resolve(__dirname, 'dist');
  const distIndexPath = path.join(distDir, 'index.html');
  const isDevLifecycle = process.env.npm_lifecycle_event === 'dev';
  const useProductionStatic =
    process.env.NODE_ENV === 'production' ||
    (!isDevLifecycle && fs.existsSync(distIndexPath));

  if (!useProductionStatic) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const srcImagesDir = path.resolve(__dirname, 'src', 'assets', 'images');
    if (fs.existsSync(srcImagesDir)) {
      app.use('/src/assets/images', express.static(srcImagesDir));
    }
    const publicAistudioDir = path.resolve(__dirname, 'public', 'assets', 'aistudio');
    if (fs.existsSync(publicAistudioDir)) {
      app.use('/assets/aistudio', express.static(publicAistudioDir));
    }
    app.use(express.static(distDir));
    app.get('*', (req, res) => {
      if (
        req.path.startsWith('/api/') ||
        req.path.startsWith('/assets/') ||
        req.path.startsWith('/src/')
      ) {
        res.status(404).end();
        return;
      }
      res.sendFile(distIndexPath);
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`RA STORE server running at http://${HOST}:${PORT}`);
  });
}

startServer();
