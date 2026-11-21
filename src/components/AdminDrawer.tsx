import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Check,
  Copy,
  Edit2,
  FileEdit,
  ImagePlus,
  KeyRound,
  LogIn,
  LogOut,
  Package,
  Plus,
  RotateCcw,
  Settings,
  ShoppingCart,
  Trash2,
  Upload,
  Video,
  X,
} from 'lucide-react';
import {
  batchPublishProducts,
  batchSyncProducts,
  changeAdminCredentials,
  createProduct,
  createYoutubeDownload,
  deleteProduct,
  deleteProductImage,
  deleteYoutubeDownload,
  fetchAdminData,
  loginAdmin,
  logoutAdmin,
  saveProductImage,
  saveStoreSettings,
  subscribeStoreStream,
  updateOrderStatus,
  updateProduct,
  updateYoutubeDownload,
} from '../lib/storeApi';
import {
  DEFAULT_STORE_SETTINGS,
  getCatalogCategoryLabel,
  READY_TO_PUBLISH_PRODUCTS,
  ReadyProductTemplate,
  resolveProductImageUrl,
  STUDIO_IMAGE_PRESETS,
} from '../data/starterCatalog';
import {
  FIELD_LIMITS,
  ORDER_STATUSES,
  Order,
  OrderStatus,
  PRODUCT_CATEGORIES,
  Product,
  ProductCategory,
  SavedProductImage,
  STOCK_STATUSES,
  StockStatus,
  StoreSettings,
  YT_CATEGORIES,
  YoutubeCategory,
  YoutubeDownload,
} from '../types/store';
import {
  extractYoutubeVideoId,
  formatIDR,
  isSafeExternalUrl,
  isSafeProductImageUrl,
} from '../utils/format';

interface AdminDrawerProps {
  open: boolean;
  adminUsername: string | null;
  products: Product[];
  downloads: YoutubeDownload[];
  settings: StoreSettings;
  discordConfigured?: boolean;
  onAuthChange: (username: string | null) => void;
  onStoreMutated: () => void;
  onClose: () => void;
}

type AdminTab = 'products' | 'youtube' | 'orders' | 'copy' | 'settings';

async function compressImageFileToDataUrl(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('File gambar tidak dapat dibaca.'));
      el.src = objectUrl;
    });

    const attempts: Array<{ maxDim: number; quality: number }> = [
      { maxDim: 960, quality: 0.84 },
      { maxDim: 840, quality: 0.76 },
      { maxDim: 720, quality: 0.68 },
      { maxDim: 600, quality: 0.6 },
    ];

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Browser gagal memproses kanvas gambar.');
    }

    let lastDataUrl = '';
    for (const attempt of attempts) {
      let { width, height } = img;
      if (width > attempt.maxDim || height > attempt.maxDim) {
        const ratio = Math.min(attempt.maxDim / width, attempt.maxDim / height);
        width = Math.max(1, Math.round(width * ratio));
        height = Math.max(1, Math.round(height * ratio));
      }

      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const webpUrl = canvas.toDataURL('image/webp', attempt.quality);
      const candidate = webpUrl.startsWith('data:image/webp')
        ? webpUrl
        : canvas.toDataURL('image/jpeg', attempt.quality);
      lastDataUrl = candidate;

      if (candidate.length <= 270000) {
        return candidate;
      }
    }

    if (lastDataUrl.length <= 295000) {
      return lastDataUrl;
    }

    throw new Error(
      'Ukuran gambar terlalu besar setelah dikompres. Gunakan gambar dengan resolusi lebih kecil.'
    );
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function AdminDrawer({
  open,
  adminUsername,
  products,
  downloads,
  settings,
  discordConfigured = false,
  onAuthChange,
  onStoreMutated,
  onClose,
}: AdminDrawerProps) {
  const isAdmin = Boolean(adminUsername);
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [authError, setAuthError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // Username/Password Login Form State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  // Orders & Saved Photos
  const [orders, setOrders] = useState<Order[]>([]);
  const [savedImages, setSavedImages] = useState<SavedProductImage[]>([]);

  // Change Credentials State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState(adminUsername || 'Farras');
  const [newPassword, setNewPassword] = useState('');
  const [updatingCredentials, setUpdatingCredentials] = useState(false);

  // Product Form State
  const drawerScrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [duplicateSourceId, setDuplicateSourceId] = useState('');
  const [pTitle, setPTitle] = useState('');
  const [pCategory, setPCategory] = useState<ProductCategory>('Hosting SA-MP');
  const [pPrice, setPPrice] = useState('50000');
  const [pOriginalPrice, setPOriginalPrice] = useState('');
  const [pStock, setPStock] = useState<StockStatus>('Tersedia');
  const [pImageUrl, setPImageUrl] = useState<string>(STUDIO_IMAGE_PRESETS[0].url);
  const [pVariant, setPVariant] = useState('');
  const [pDelivery, setPDelivery] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pFeatured, setPFeatured] = useState(true);
  const [showReadyTemplates, setShowReadyTemplates] = useState(false);
  const [publishingBatch, setPublishingBatch] = useState(false);

  // YouTube Download Form State
  const [editingYtId, setEditingYtId] = useState<string | null>(null);
  const [yTitle, setYTitle] = useState('');
  const [yCategory, setYCategory] = useState<YoutubeCategory>('Mod & Config');
  const [yUrl, setYUrl] = useState('');
  const [yDownloadUrl, setYDownloadUrl] = useState('');
  const [yFileName, setYFileName] = useState('');
  const [yFileSize, setYFileSize] = useState('');
  const [yVersion, setYVersion] = useState('v1.0');
  const [yNotes, setYNotes] = useState('');

  // Settings Form State
  const [sWhatsapp, setSWhatsapp] = useState(settings.whatsappNumber);
  const [sYoutubeChannel, setSYoutubeChannel] = useState(settings.youtubeChannelUrl);
  const [sDiscordUsername, setSDiscordUsername] = useState(
    settings.discordUsername || 'farrassamp'
  );
  const [sDiscordInviteUrl, setSDiscordInviteUrl] = useState(
    settings.discordInviteUrl || 'https://discord.gg/ss2WFZK6Zg'
  );
  const [sDiscordGuildId, setSDiscordGuildId] = useState(
    settings.discordGuildId || '1406592741701587124'
  );
  const [sDiscordSubscribeRoleId, setSDiscordSubscribeRoleId] = useState(
    settings.discordSubscribeRoleId || '1558118487409295460'
  );
  const [sRequireDiscordEntry, setSRequireDiscordEntry] = useState(
    settings.requireDiscordEntry === '1'
  );
  const [copiedRedirectUri, setCopiedRedirectUri] = useState(false);
  const [sAnnouncement, setSAnnouncement] = useState(settings.announcement || '');

  // Editable Website Copy State & Auto-Save Status
  type AutoSaveState = 'idle' | 'saving' | 'saved' | 'incomplete' | 'error';
  const [autoSaveState, setAutoSaveState] = useState<AutoSaveState>('idle');
  const [copyDirty, setCopyDirty] = useState(false);
  const copyDirtyRef = useRef(false);

  const [tBrandName, setTBrandName] = useState(
    settings.brandName || DEFAULT_STORE_SETTINGS.brandName || 'RA STORE'
  );
  const [tHeroTagline, setTHeroTagline] = useState(
    settings.heroTagline || DEFAULT_STORE_SETTINGS.heroTagline || ''
  );
  const [tHeroTitle, setTHeroTitle] = useState(
    settings.heroTitle || DEFAULT_STORE_SETTINGS.heroTitle || ''
  );
  const [tHeroSubtitle, setTHeroSubtitle] = useState(
    settings.heroSubtitle || DEFAULT_STORE_SETTINGS.heroSubtitle || ''
  );
  const [tHeroImageCaptionTitle, setTHeroImageCaptionTitle] = useState(
    settings.heroImageCaptionTitle ||
      DEFAULT_STORE_SETTINGS.heroImageCaptionTitle ||
      ''
  );
  const [tHeroImageCaptionSubtitle, setTHeroImageCaptionSubtitle] = useState(
    settings.heroImageCaptionSubtitle ||
      DEFAULT_STORE_SETTINGS.heroImageCaptionSubtitle ||
      ''
  );
  const [tCatalogEyebrow, setTCatalogEyebrow] = useState(
    settings.catalogEyebrow || DEFAULT_STORE_SETTINGS.catalogEyebrow || ''
  );
  const [tCatalogTitle, setTCatalogTitle] = useState(
    settings.catalogTitle || DEFAULT_STORE_SETTINGS.catalogTitle || ''
  );
  const [tYoutubeEyebrow, setTYoutubeEyebrow] = useState(
    settings.youtubeEyebrow || DEFAULT_STORE_SETTINGS.youtubeEyebrow || ''
  );
  const [tYoutubeTitle, setTYoutubeTitle] = useState(
    settings.youtubeTitle || DEFAULT_STORE_SETTINGS.youtubeTitle || ''
  );
  const [tAboutRoleLabel, setTAboutRoleLabel] = useState(
    settings.aboutRoleLabel || DEFAULT_STORE_SETTINGS.aboutRoleLabel || ''
  );
  const [tOwnerDisplayName, setTOwnerDisplayName] = useState(
    settings.ownerDisplayName || DEFAULT_STORE_SETTINGS.ownerDisplayName || ''
  );
  const [tAboutDescription, setTAboutDescription] = useState(
    settings.aboutDescription || DEFAULT_STORE_SETTINGS.aboutDescription || ''
  );
  const [tOfficialCardSubtitle, setTOfficialCardSubtitle] = useState(
    settings.officialCardSubtitle ||
      DEFAULT_STORE_SETTINGS.officialCardSubtitle ||
      ''
  );
  const [tFooterText, setTFooterText] = useState(
    settings.footerText || DEFAULT_STORE_SETTINGS.footerText || ''
  );
  const [tYtTabAllLabel, setTYtTabAllLabel] = useState(
    settings.ytTabAllLabel || DEFAULT_STORE_SETTINGS.ytTabAllLabel || 'Semua'
  );
  const [tYtTabModLabel, setTYtTabModLabel] = useState(
    settings.ytTabModLabel || DEFAULT_STORE_SETTINGS.ytTabModLabel || 'Mod & Config'
  );
  const [tYtTabPresetLabel, setTYtTabPresetLabel] = useState(
    settings.ytTabPresetLabel ||
      DEFAULT_STORE_SETTINGS.ytTabPresetLabel ||
      'Preset & Editing'
  );
  const [tYtTabDocLabel, setTYtTabDocLabel] = useState(
    settings.ytTabDocLabel ||
      DEFAULT_STORE_SETTINGS.ytTabDocLabel ||
      'Dokumen & Tool'
  );
  const [tCatTabAllLabel, setTCatTabAllLabel] = useState(
    settings.catTabAllLabel || DEFAULT_STORE_SETTINGS.catTabAllLabel || 'Semua'
  );
  const [tCatTabHostingLabel, setTCatTabHostingLabel] = useState(
    settings.catTabHostingLabel ||
      DEFAULT_STORE_SETTINGS.catTabHostingLabel ||
      'Hosting SA-MP'
  );
  const [tCatTabPaketOnLabel, setTCatTabPaketOnLabel] = useState(
    settings.catTabPaketOnLabel ||
      DEFAULT_STORE_SETTINGS.catTabPaketOnLabel ||
      'Paket On Server SA-MP'
  );
  const [tCatTabModpackLabel, setTCatTabModpackLabel] = useState(
    settings.catTabModpackLabel ||
      DEFAULT_STORE_SETTINGS.catTabModpackLabel ||
      'Modpack GTA SA-MP'
  );
  const [tCatTabDevLabel, setTCatTabDevLabel] = useState(
    settings.catTabDevLabel ||
      DEFAULT_STORE_SETTINGS.catTabDevLabel ||
      'Jasa Developer'
  );
  const [tCatTabJasaSampLabel, setTCatTabJasaSampLabel] = useState(
    settings.catTabJasaSampLabel ||
      DEFAULT_STORE_SETTINGS.catTabJasaSampLabel ||
      'Jasa SA-MP'
  );
  const [tCatTabReviewLabel, setTCatTabReviewLabel] = useState(
    settings.catTabReviewLabel ||
      DEFAULT_STORE_SETTINGS.catTabReviewLabel ||
      'Review & Streaming'
  );

  function markCopyDirty() {
    copyDirtyRef.current = true;
    setCopyDirty(true);
    setAutoSaveState('idle');
  }

  useEffect(() => {
    setSWhatsapp(settings.whatsappNumber);
    setSYoutubeChannel(settings.youtubeChannelUrl);
    setSDiscordUsername(settings.discordUsername || 'farrassamp');
    setSDiscordInviteUrl(
      settings.discordInviteUrl || 'https://discord.gg/ss2WFZK6Zg'
    );
    setSDiscordGuildId(settings.discordGuildId || '1406592741701587124');
    setSDiscordSubscribeRoleId(
      settings.discordSubscribeRoleId || '1558118487409295460'
    );
    setSRequireDiscordEntry(settings.requireDiscordEntry === '1');

    if (copyDirtyRef.current) return;

    setSAnnouncement(settings.announcement || '');

    setTBrandName(
      settings.brandName || DEFAULT_STORE_SETTINGS.brandName || 'RA STORE'
    );
    setTHeroTagline(
      settings.heroTagline || DEFAULT_STORE_SETTINGS.heroTagline || ''
    );
    setTHeroTitle(settings.heroTitle || DEFAULT_STORE_SETTINGS.heroTitle || '');
    setTHeroSubtitle(
      settings.heroSubtitle || DEFAULT_STORE_SETTINGS.heroSubtitle || ''
    );
    setTHeroImageCaptionTitle(
      settings.heroImageCaptionTitle ||
        DEFAULT_STORE_SETTINGS.heroImageCaptionTitle ||
        ''
    );
    setTHeroImageCaptionSubtitle(
      settings.heroImageCaptionSubtitle ||
        DEFAULT_STORE_SETTINGS.heroImageCaptionSubtitle ||
        ''
    );
    setTCatalogEyebrow(
      settings.catalogEyebrow || DEFAULT_STORE_SETTINGS.catalogEyebrow || ''
    );
    setTCatalogTitle(
      settings.catalogTitle || DEFAULT_STORE_SETTINGS.catalogTitle || ''
    );
    setTYoutubeEyebrow(
      settings.youtubeEyebrow || DEFAULT_STORE_SETTINGS.youtubeEyebrow || ''
    );
    setTYoutubeTitle(
      settings.youtubeTitle || DEFAULT_STORE_SETTINGS.youtubeTitle || ''
    );
    setTAboutRoleLabel(
      settings.aboutRoleLabel || DEFAULT_STORE_SETTINGS.aboutRoleLabel || ''
    );
    setTOwnerDisplayName(
      settings.ownerDisplayName || DEFAULT_STORE_SETTINGS.ownerDisplayName || ''
    );
    setTAboutDescription(
      settings.aboutDescription || DEFAULT_STORE_SETTINGS.aboutDescription || ''
    );
    setTOfficialCardSubtitle(
      settings.officialCardSubtitle ||
        DEFAULT_STORE_SETTINGS.officialCardSubtitle ||
        ''
    );
    setTFooterText(
      settings.footerText || DEFAULT_STORE_SETTINGS.footerText || ''
    );
    setTYtTabAllLabel(
      settings.ytTabAllLabel || DEFAULT_STORE_SETTINGS.ytTabAllLabel || 'Semua'
    );
    setTYtTabModLabel(
      settings.ytTabModLabel ||
        DEFAULT_STORE_SETTINGS.ytTabModLabel ||
        'Mod & Config'
    );
    setTYtTabPresetLabel(
      settings.ytTabPresetLabel ||
        DEFAULT_STORE_SETTINGS.ytTabPresetLabel ||
        'Preset & Editing'
    );
    setTYtTabDocLabel(
      settings.ytTabDocLabel ||
        DEFAULT_STORE_SETTINGS.ytTabDocLabel ||
        'Dokumen & Tool'
    );
    setTCatTabAllLabel(
      settings.catTabAllLabel || DEFAULT_STORE_SETTINGS.catTabAllLabel || 'Semua'
    );
    setTCatTabHostingLabel(
      settings.catTabHostingLabel ||
        DEFAULT_STORE_SETTINGS.catTabHostingLabel ||
        'Hosting SA-MP'
    );
    setTCatTabPaketOnLabel(
      settings.catTabPaketOnLabel ||
        DEFAULT_STORE_SETTINGS.catTabPaketOnLabel ||
        'Paket On Server SA-MP'
    );
    setTCatTabModpackLabel(
      settings.catTabModpackLabel ||
        DEFAULT_STORE_SETTINGS.catTabModpackLabel ||
        'Modpack GTA SA-MP'
    );
    setTCatTabDevLabel(
      settings.catTabDevLabel ||
        DEFAULT_STORE_SETTINGS.catTabDevLabel ||
        'Jasa Developer'
    );
    setTCatTabJasaSampLabel(
      settings.catTabJasaSampLabel ||
        DEFAULT_STORE_SETTINGS.catTabJasaSampLabel ||
        'Jasa SA-MP'
    );
    setTCatTabReviewLabel(
      settings.catTabReviewLabel ||
        DEFAULT_STORE_SETTINGS.catTabReviewLabel ||
        'Review & Streaming'
    );
  }, [settings]);

  useEffect(() => {
    if (adminUsername) {
      setNewUsername(adminUsername);
    }
  }, [adminUsername]);

  // Real-time debounced Auto-Save to Express backend when website copy is edited
  useEffect(() => {
    if (!isAdmin || !copyDirty) return;

    const hasRequiredFields =
      tBrandName.trim().length > 0 &&
      tHeroTitle.trim().length > 0 &&
      tHeroSubtitle.trim().length > 0 &&
      tCatalogTitle.trim().length > 0 &&
      tYoutubeTitle.trim().length > 0 &&
      tOwnerDisplayName.trim().length > 0 &&
      tAboutDescription.trim().length > 0;

    if (!hasRequiredFields) {
      setAutoSaveState('incomplete');
      return;
    }

    const timer = window.setTimeout(async () => {
      setAutoSaveState('saving');
      setAuthError('');
      try {
        await saveStoreSettings(buildStoreSettingsPayload());
        copyDirtyRef.current = false;
        setCopyDirty(false);
        setAutoSaveState('saved');
        onStoreMutated();
      } catch (error) {
        setAutoSaveState('error');
        setAuthError(
          error instanceof Error ? error.message : 'Gagal menyimpan teks website.'
        );
      }
    }, 650);

    return () => window.clearTimeout(timer);
  }, [
    isAdmin,
    copyDirty,
    tBrandName,
    tHeroTagline,
    tHeroTitle,
    tHeroSubtitle,
    tHeroImageCaptionTitle,
    tHeroImageCaptionSubtitle,
    tCatalogEyebrow,
    tCatalogTitle,
    tYoutubeEyebrow,
    tYoutubeTitle,
    tAboutRoleLabel,
    tOwnerDisplayName,
    tAboutDescription,
    tOfficialCardSubtitle,
    tFooterText,
    tYtTabAllLabel,
    tYtTabModLabel,
    tYtTabPresetLabel,
    tYtTabDocLabel,
    tCatTabAllLabel,
    tCatTabHostingLabel,
    tCatTabPaketOnLabel,
    tCatTabModpackLabel,
    tCatTabDevLabel,
    tCatTabJasaSampLabel,
    tCatTabReviewLabel,
    sAnnouncement,
  ]);

  // Fetch admin orders & saved gallery images when authenticated + listen for real-time SSE admin updates
  useEffect(() => {
    if (!open || !isAdmin) return;

    let active = true;
    async function loadAdminCollections() {
      try {
        const data = await fetchAdminData();
        if (!active) return;
        setOrders(Array.isArray(data.orders) ? data.orders : []);
        setSavedImages(Array.isArray(data.productImages) ? data.productImages : []);
      } catch (error) {
        if (!active) return;
        const msg =
          error instanceof Error ? error.message : 'Gagal memuat data admin.';
        setAuthError(msg);
        if (msg.toLowerCase().includes('sesi admin')) {
          onAuthChange(null);
        }
      }
    }

    void loadAdminCollections();
    const unsubscribe = subscribeStoreStream(
      () => {},
      () => {
        void loadAdminCollections();
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [open, isAdmin, onAuthChange]);

  if (!open) return null;

  function showNotice(msg: string) {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(''), 3500);
  }

  async function handleUsernamePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');

    const trimmedUser = loginUsername.trim();
    if (!trimmedUser || !loginPassword) {
      setAuthError('Masukkan username dan kata sandi pemilik toko.');
      return;
    }

    setSigningIn(true);
    try {
      const authenticatedUser = await loginAdmin(trimmedUser, loginPassword);
      setLoginPassword('');
      onAuthChange(authenticatedUser);
      showNotice(`Selamat datang kembali, ${authenticatedUser}.`);
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'Username atau kata sandi admin salah.'
      );
    } finally {
      setSigningIn(false);
    }
  }

  async function handleLogout() {
    await logoutAdmin();
    setOrders([]);
    setSavedImages([]);
    onAuthChange(null);
  }

  async function handleProductPhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !isAdmin) return;

    if (!file.type.startsWith('image/')) {
      setAuthError('Pilih file gambar berformat JPG, PNG, atau WebP.');
      return;
    }

    setUploadingPhoto(true);
    setAuthError('');
    try {
      const dataUrl = await compressImageFileToDataUrl(file);
      const rawLabel = file.name
        .replace(/\.[^.]+$/, '')
        .replace(/[^\w\s-]/g, '')
        .trim();
      const safeLabel =
        rawLabel.slice(0, Math.min(60, FIELD_LIMITS.PRODUCT_IMAGE_LABEL_MAX)) ||
        'Foto Produk';

      const saved = await saveProductImage(safeLabel, dataUrl);
      setSavedImages((prev) => [saved, ...prev]);
      setPImageUrl(saved.imageUrl);
      showNotice('Foto diupload & tersimpan permanen di Galeri Server!');
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Gagal mengunggah foto produk.'
      );
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleDeleteSavedImage(imageId: string) {
    if (!isAdmin) return;
    try {
      await deleteProductImage(imageId);
      setSavedImages((prev) => prev.filter((item) => item.id !== imageId));
      showNotice('Foto dihapus dari galeri tersimpan.');
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : 'Gagal menghapus foto galeri.'
      );
    }
  }

  function buildDuplicateTitle(title: string): string {
    const suffix = ' (Salinan)';
    const base = title.trim();
    if (base.endsWith(suffix)) {
      return base.slice(0, FIELD_LIMITS.PRODUCT_TITLE_MAX);
    }
    return `${base.slice(0, FIELD_LIMITS.PRODUCT_TITLE_MAX - suffix.length)}${suffix}`;
  }

  function resetProductForm() {
    setEditingProductId(null);
    setDuplicateSourceId('');
    setPTitle('');
    setPCategory('Hosting SA-MP');
    setPPrice('50000');
    setPOriginalPrice('');
    setPStock('Tersedia');
    setPImageUrl(STUDIO_IMAGE_PRESETS[0].url);
    setPVariant('');
    setPDelivery('');
    setPDesc('');
    setPFeatured(true);
  }

  function startEditProduct(p: Product) {
    setEditingProductId(p.id);
    setDuplicateSourceId('');
    setPTitle(p.title);
    setPCategory(p.category);
    setPPrice(String(p.price));
    setPOriginalPrice(
      typeof p.originalPrice === 'number' && p.originalPrice > 0
        ? String(p.originalPrice)
        : ''
    );
    setPStock(p.stockStatus);
    setPImageUrl(p.imageUrl);
    setPVariant(p.variantLabel || '');
    setPDelivery(p.deliveryNote || '');
    setPDesc(p.description);
    setPFeatured(p.featured);
    drawerScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function startDuplicateProduct(p: Product) {
    setEditingProductId(null);
    setDuplicateSourceId(p.id);
    setPTitle(buildDuplicateTitle(p.title));
    setPCategory(p.category);
    setPPrice(String(p.price));
    setPOriginalPrice(
      typeof p.originalPrice === 'number' && p.originalPrice > 0
        ? String(p.originalPrice)
        : ''
    );
    setPStock(p.stockStatus);
    setPImageUrl(p.imageUrl);
    setPVariant(p.variantLabel || '');
    setPDelivery(p.deliveryNote || '');
    setPDesc(p.description);
    setPFeatured(p.featured);
    showNotice(`Data "${p.title}" disalin ke form. Silakan ubah detail lalu terbitkan.`);
    drawerScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveProduct(keepFormForDuplicate: boolean) {
    if (!isAdmin) return;

    const cleanTitle = pTitle.trim().slice(0, FIELD_LIMITS.PRODUCT_TITLE_MAX);
    const cleanDesc = pDesc.trim().slice(0, FIELD_LIMITS.PRODUCT_DESC_MAX);
    const cleanImg = pImageUrl.trim().slice(0, FIELD_LIMITS.PRODUCT_IMAGE_URL_MAX);
    const parsedPrice = Math.max(0, Math.min(100000000, Number(pPrice) || 0));
    const rawOriginalPrice = pOriginalPrice.trim()
      ? Math.max(0, Math.min(100000000, Number(pOriginalPrice) || 0))
      : 0;
    const parsedOriginalPrice =
      rawOriginalPrice > parsedPrice ? rawOriginalPrice : 0;

    if (cleanTitle.length < 2 || !cleanDesc || !isSafeProductImageUrl(cleanImg)) {
      setAuthError('Lengkapi judul, deskripsi, dan foto/URL gambar yang valid.');
      return;
    }

    setSaving(true);
    setAuthError('');
    const isEditing = Boolean(editingProductId);

    const payload = {
      title: cleanTitle,
      category: pCategory,
      price: parsedPrice,
      originalPrice: parsedOriginalPrice,
      stockStatus: pStock,
      description: cleanDesc,
      imageUrl: cleanImg,
      ...(pVariant.trim()
        ? { variantLabel: pVariant.trim().slice(0, FIELD_LIMITS.PRODUCT_VARIANT_MAX) }
        : {}),
      ...(pDelivery.trim()
        ? { deliveryNote: pDelivery.trim().slice(0, FIELD_LIMITS.PRODUCT_DELIVERY_MAX) }
        : {}),
      featured: pFeatured,
    };

    try {
      if (isEditing && editingProductId) {
        await updateProduct(editingProductId, payload);
        showNotice('Produk berhasil diperbarui.');
        resetProductForm();
      } else {
        await createProduct(payload);
        if (keepFormForDuplicate) {
          setEditingProductId(null);
          setDuplicateSourceId('');
          setPTitle(buildDuplicateTitle(cleanTitle));
          showNotice('Produk diterbitkan. Data form dipertahankan untuk duplikasi berikutnya.');
        } else {
          resetProductForm();
          showNotice('Produk baru berhasil ditambahkan ke RA STORE.');
        }
      }
      onStoreMutated();
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : 'Gagal menyimpan produk.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    await saveProduct(false);
  }

  async function handleDeleteProduct(productId: string) {
    if (!isAdmin) return;
    try {
      await deleteProduct(productId);
      onStoreMutated();
      showNotice('Produk dihapus.');
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : 'Gagal menghapus produk.'
      );
    }
  }

  function applyReadyTemplateToForm(tpl: ReadyProductTemplate) {
    setEditingProductId(null);
    setDuplicateSourceId('');
    setPTitle(tpl.title.slice(0, FIELD_LIMITS.PRODUCT_TITLE_MAX));
    setPCategory(tpl.category);
    setPPrice(String(tpl.price));
    setPOriginalPrice('');
    setPStock(tpl.stockStatus);
    setPImageUrl(tpl.imageUrl);
    setPVariant(tpl.variantLabel.slice(0, FIELD_LIMITS.PRODUCT_VARIANT_MAX));
    setPDelivery(tpl.deliveryNote.slice(0, FIELD_LIMITS.PRODUCT_DELIVERY_MAX));
    setPDesc(tpl.description.slice(0, FIELD_LIMITS.PRODUCT_DESC_MAX));
    setPFeatured(tpl.featured);
    showNotice(`"${tpl.title}" dimuat ke form. Ubah detail/foto lalu klik Terbitkan Produk.`);
    drawerScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handlePublishReadyTemplates(templates: ReadyProductTemplate[]) {
    if (!isAdmin || templates.length === 0) return;
    setPublishingBatch(true);
    setAuthError('');
    try {
      await batchPublishProducts(
        templates.map((tpl) => ({
          title: tpl.title.trim().slice(0, FIELD_LIMITS.PRODUCT_TITLE_MAX),
          category: tpl.category,
          price: Math.max(0, Math.min(100000000, tpl.price)),
          stockStatus: tpl.stockStatus,
          description: tpl.description.trim().slice(0, FIELD_LIMITS.PRODUCT_DESC_MAX),
          imageUrl: tpl.imageUrl.trim().slice(0, FIELD_LIMITS.PRODUCT_IMAGE_URL_MAX),
          variantLabel: tpl.variantLabel.trim().slice(0, FIELD_LIMITS.PRODUCT_VARIANT_MAX),
          deliveryNote: tpl.deliveryNote.trim().slice(0, FIELD_LIMITS.PRODUCT_DELIVERY_MAX),
          featured: tpl.featured,
        }))
      );
      onStoreMutated();
      showNotice(
        templates.length === 1
          ? `"${templates[0].title}" berhasil diterbitkan ke katalog!`
          : `${templates.length} produk berhasil diterbitkan sekaligus ke katalog!`
      );
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : 'Gagal menerbitkan produk.'
      );
    } finally {
      setPublishingBatch(false);
    }
  }

  async function handleSyncReadyTemplateUpdates(
    updates: Array<{
      productId: string;
      imageUrl?: string;
      category?: ProductCategory;
    }>
  ) {
    if (!isAdmin || updates.length === 0) return;
    setPublishingBatch(true);
    setAuthError('');
    try {
      await batchSyncProducts(updates);
      onStoreMutated();
      showNotice(
        `${updates.length} produk berhasil disinkronkan (foto & kategori Paket On Server SA-MP)!`
      );
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : 'Gagal menyinkronkan produk.'
      );
    } finally {
      setPublishingBatch(false);
    }
  }

  function resetYtForm() {
    setEditingYtId(null);
    setYTitle('');
    setYCategory('Mod & Config');
    setYUrl('');
    setYDownloadUrl('');
    setYFileName('');
    setYFileSize('');
    setYVersion('v1.0');
    setYNotes('');
  }

  function startEditYt(item: YoutubeDownload) {
    setEditingYtId(item.id);
    setYTitle(item.title);
    setYCategory(item.category);
    setYUrl(item.youtubeUrl);
    setYDownloadUrl(item.downloadUrl);
    setYFileName(item.fileName);
    setYFileSize(item.fileSize);
    setYVersion(item.version);
    setYNotes(item.notes);
  }

  async function handleSaveYt(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;

    const videoId = extractYoutubeVideoId(yUrl);
    if (!videoId || videoId.length < 5) {
      setAuthError('Masukkan link video YouTube yang valid (contoh: https://youtu.be/xxxx).');
      return;
    }
    if (!isSafeExternalUrl(yDownloadUrl)) {
      setAuthError('Masukkan link download file yang valid (https://...).');
      return;
    }

    setSaving(true);
    setAuthError('');
    const fields = {
      title: yTitle.trim().slice(0, FIELD_LIMITS.YT_TITLE_MAX),
      category: yCategory,
      youtubeUrl: yUrl.trim().slice(0, 300),
      youtubeVideoId: videoId,
      downloadUrl: yDownloadUrl.trim().slice(0, FIELD_LIMITS.URL_MAX),
      fileName: yFileName.trim().slice(0, FIELD_LIMITS.YT_FILENAME_MAX),
      fileSize: yFileSize.trim().slice(0, FIELD_LIMITS.YT_FILESIZE_MAX),
      version: yVersion.trim().slice(0, FIELD_LIMITS.YT_VERSION_MAX),
      notes: yNotes.trim().slice(0, FIELD_LIMITS.YT_NOTES_MAX),
    };

    try {
      if (editingYtId) {
        await updateYoutubeDownload(editingYtId, fields);
        showNotice('File unduhan YouTube berhasil diperbarui.');
      } else {
        await createYoutubeDownload(fields);
        showNotice('File unduhan YouTube berhasil dipublikasikan.');
      }
      resetYtForm();
      onStoreMutated();
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : 'Gagal menyimpan file unduhan.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteYt(downloadId: string) {
    if (!isAdmin) return;
    try {
      await deleteYoutubeDownload(downloadId);
      onStoreMutated();
      showNotice('Item unduhan dihapus.');
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : 'Gagal menghapus file unduhan.'
      );
    }
  }

  async function handleUpdateOrderStatus(orderId: string, newStatus: OrderStatus) {
    if (!isAdmin) return;
    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      showNotice(`Status pesanan diperbarui ke ${newStatus}.`);
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : 'Gagal memperbarui status pesanan.'
      );
    }
  }

  function buildStoreSettingsPayload(): Partial<StoreSettings> {
    return {
      whatsappNumber:
        sWhatsapp.trim().slice(0, 30) || DEFAULT_STORE_SETTINGS.whatsappNumber,
      youtubeChannelUrl:
        sYoutubeChannel.trim().slice(0, 300) ||
        DEFAULT_STORE_SETTINGS.youtubeChannelUrl,
      discordUsername: sDiscordUsername.trim().slice(0, 80),
      discordInviteUrl: sDiscordInviteUrl.trim().slice(0, 300),
      announcement: sAnnouncement.trim().slice(0, 200),
      brandName: tBrandName.trim().slice(0, FIELD_LIMITS.BRAND_NAME_MAX),
      heroTagline: tHeroTagline.trim().slice(0, FIELD_LIMITS.HERO_TAGLINE_MAX),
      heroTitle: tHeroTitle.trim().slice(0, FIELD_LIMITS.HERO_TITLE_MAX),
      heroSubtitle: tHeroSubtitle.trim().slice(0, FIELD_LIMITS.HERO_SUBTITLE_MAX),
      heroImageCaptionTitle: tHeroImageCaptionTitle
        .trim()
        .slice(0, FIELD_LIMITS.HERO_CAPTION_TITLE_MAX),
      heroImageCaptionSubtitle: tHeroImageCaptionSubtitle
        .trim()
        .slice(0, FIELD_LIMITS.HERO_CAPTION_SUBTITLE_MAX),
      catalogEyebrow: tCatalogEyebrow
        .trim()
        .slice(0, FIELD_LIMITS.SECTION_EYEBROW_MAX),
      catalogTitle: tCatalogTitle.trim().slice(0, FIELD_LIMITS.SECTION_TITLE_MAX),
      youtubeEyebrow: tYoutubeEyebrow
        .trim()
        .slice(0, FIELD_LIMITS.SECTION_EYEBROW_MAX),
      youtubeTitle: tYoutubeTitle.trim().slice(0, FIELD_LIMITS.SECTION_TITLE_MAX),
      aboutRoleLabel: tAboutRoleLabel.trim().slice(0, FIELD_LIMITS.ABOUT_ROLE_MAX),
      ownerDisplayName: tOwnerDisplayName
        .trim()
        .slice(0, FIELD_LIMITS.OWNER_DISPLAY_NAME_MAX),
      aboutDescription: tAboutDescription
        .trim()
        .slice(0, FIELD_LIMITS.ABOUT_DESC_MAX),
      officialCardSubtitle: tOfficialCardSubtitle
        .trim()
        .slice(0, FIELD_LIMITS.OFFICIAL_SUBTITLE_MAX),
      footerText: tFooterText.trim().slice(0, FIELD_LIMITS.FOOTER_TEXT_MAX),
      ytTabAllLabel:
        tYtTabAllLabel.trim().slice(0, FIELD_LIMITS.YT_TAB_LABEL_MAX) || 'Semua',
      ytTabModLabel:
        tYtTabModLabel.trim().slice(0, FIELD_LIMITS.YT_TAB_LABEL_MAX) ||
        'Mod & Config',
      ytTabPresetLabel:
        tYtTabPresetLabel.trim().slice(0, FIELD_LIMITS.YT_TAB_LABEL_MAX) ||
        'Preset & Editing',
      ytTabDocLabel:
        tYtTabDocLabel.trim().slice(0, FIELD_LIMITS.YT_TAB_LABEL_MAX) ||
        'Dokumen & Tool',
      catTabAllLabel:
        tCatTabAllLabel.trim().slice(0, FIELD_LIMITS.CATALOG_TAB_LABEL_MAX) ||
        'Semua',
      catTabHostingLabel:
        tCatTabHostingLabel.trim().slice(0, FIELD_LIMITS.CATALOG_TAB_LABEL_MAX) ||
        'Hosting SA-MP',
      catTabPaketOnLabel:
        tCatTabPaketOnLabel.trim().slice(0, FIELD_LIMITS.CATALOG_TAB_LABEL_MAX) ||
        'Paket On Server SA-MP',
      catTabModpackLabel:
        tCatTabModpackLabel.trim().slice(0, FIELD_LIMITS.CATALOG_TAB_LABEL_MAX) ||
        'Modpack GTA SA-MP',
      catTabDevLabel:
        tCatTabDevLabel.trim().slice(0, FIELD_LIMITS.CATALOG_TAB_LABEL_MAX) ||
        'Jasa Developer',
      catTabJasaSampLabel:
        tCatTabJasaSampLabel
          .trim()
          .slice(0, FIELD_LIMITS.CATALOG_TAB_LABEL_MAX) || 'Jasa SA-MP',
      catTabReviewLabel:
        tCatTabReviewLabel.trim().slice(0, FIELD_LIMITS.CATALOG_TAB_LABEL_MAX) ||
        'Review & Streaming',
      seededCatalogVersion: settings.seededCatalogVersion || 'samp_v1',
      discordGuildId: sDiscordGuildId.trim().slice(0, 30) || '1406592741701587124',
      discordSubscribeRoleId:
        sDiscordSubscribeRoleId.trim().slice(0, 30) || '1558118487409295460',
      requireDiscordEntry: sRequireDiscordEntry ? '1' : '0',
    };
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;
    setSaving(true);
    setAuthError('');
    try {
      await saveStoreSettings(buildStoreSettingsPayload());
      onStoreMutated();
      showNotice('Pengaturan RA STORE berhasil disimpan.');
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : 'Gagal menyimpan pengaturan.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSiteCopy(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;
    setSaving(true);
    setAutoSaveState('saving');
    setAuthError('');
    try {
      await saveStoreSettings(buildStoreSettingsPayload());
      copyDirtyRef.current = false;
      setCopyDirty(false);
      setAutoSaveState('saved');
      onStoreMutated();
      showNotice('Teks website berhasil disimpan & tersinkron ke semua pengunjung.');
    } catch (error) {
      setAutoSaveState('error');
      setAuthError(
        error instanceof Error ? error.message : 'Gagal menyimpan teks website.'
      );
    } finally {
      setSaving(false);
    }
  }

  function handleResetSiteCopyDefaults() {
    setTBrandName(DEFAULT_STORE_SETTINGS.brandName || 'RA STORE');
    setTHeroTagline(DEFAULT_STORE_SETTINGS.heroTagline || '');
    setTHeroTitle(DEFAULT_STORE_SETTINGS.heroTitle || '');
    setTHeroSubtitle(DEFAULT_STORE_SETTINGS.heroSubtitle || '');
    setTHeroImageCaptionTitle(DEFAULT_STORE_SETTINGS.heroImageCaptionTitle || '');
    setTHeroImageCaptionSubtitle(
      DEFAULT_STORE_SETTINGS.heroImageCaptionSubtitle || ''
    );
    setTCatalogEyebrow(DEFAULT_STORE_SETTINGS.catalogEyebrow || '');
    setTCatalogTitle(DEFAULT_STORE_SETTINGS.catalogTitle || '');
    setTYoutubeEyebrow(DEFAULT_STORE_SETTINGS.youtubeEyebrow || '');
    setTYoutubeTitle(DEFAULT_STORE_SETTINGS.youtubeTitle || '');
    setTAboutRoleLabel(DEFAULT_STORE_SETTINGS.aboutRoleLabel || '');
    setTOwnerDisplayName(DEFAULT_STORE_SETTINGS.ownerDisplayName || '');
    setTAboutDescription(DEFAULT_STORE_SETTINGS.aboutDescription || '');
    setTOfficialCardSubtitle(DEFAULT_STORE_SETTINGS.officialCardSubtitle || '');
    setTFooterText(DEFAULT_STORE_SETTINGS.footerText || '');
    setTYtTabAllLabel(DEFAULT_STORE_SETTINGS.ytTabAllLabel || 'Semua');
    setTYtTabModLabel(DEFAULT_STORE_SETTINGS.ytTabModLabel || 'Mod & Config');
    setTYtTabPresetLabel(
      DEFAULT_STORE_SETTINGS.ytTabPresetLabel || 'Preset & Editing'
    );
    setTYtTabDocLabel(DEFAULT_STORE_SETTINGS.ytTabDocLabel || 'Dokumen & Tool');
    setTCatTabAllLabel(DEFAULT_STORE_SETTINGS.catTabAllLabel || 'Semua');
    setTCatTabHostingLabel(
      DEFAULT_STORE_SETTINGS.catTabHostingLabel || 'Hosting SA-MP'
    );
    setTCatTabPaketOnLabel(
      DEFAULT_STORE_SETTINGS.catTabPaketOnLabel || 'Paket On Server SA-MP'
    );
    setTCatTabModpackLabel(
      DEFAULT_STORE_SETTINGS.catTabModpackLabel || 'Modpack GTA SA-MP'
    );
    setTCatTabDevLabel(
      DEFAULT_STORE_SETTINGS.catTabDevLabel || 'Jasa Developer'
    );
    setTCatTabJasaSampLabel(
      DEFAULT_STORE_SETTINGS.catTabJasaSampLabel || 'Jasa SA-MP'
    );
    setTCatTabReviewLabel(
      DEFAULT_STORE_SETTINGS.catTabReviewLabel || 'Review & Streaming'
    );
    setSAnnouncement('');
    markCopyDirty();
    showNotice('Teks dikembalikan ke bawaan dan sedang disimpan otomatis...');
  }

  async function handleChangeCredentials(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;

    setAuthError('');
    if (!currentPassword || newPassword.length < 4) {
      setAuthError('Masukkan kata sandi saat ini dan kata sandi baru (minimal 4 karakter).');
      return;
    }

    setUpdatingCredentials(true);
    try {
      const updatedUser = await changeAdminCredentials(
        currentPassword,
        newUsername.trim() || adminUsername || 'Farras',
        newPassword
      );
      setCurrentPassword('');
      setNewPassword('');
      onAuthChange(updatedUser);
      showNotice(`Kredensial admin diperbarui. Username aktif: ${updatedUser}`);
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : 'Gagal memperbarui username atau kata sandi.'
      );
    } finally {
      setUpdatingCredentials(false);
    }
  }

  const liveVideoIdPreview = extractYoutubeVideoId(yUrl);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex justify-end"
      onClick={onClose}
    >
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label="Studio Pemilik RA STORE"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-2xl bg-[#111318] h-full flex flex-col border-l border-white/[0.1] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-[#F5F5F7] tracking-tight">
              Studio Pemilik · RA STORE
            </h2>
            <p className="text-xs text-[#9CA3AF]">
              Kelola produk jualan, upload foto, unduhan YouTube, dan pesanan
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#9CA3AF] hover:text-white bg-[#090A0D] border border-white/[0.08] rounded-xl cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar ({adminUsername})</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup studio pemilik"
              className="w-9 h-9 inline-flex items-center justify-center rounded-xl text-[#9CA3AF] hover:text-white hover:bg-white/[0.06] cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Auth Gate or Admin Workspace */}
        <div ref={drawerScrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {!isAdmin ? (
            <div className="max-w-md mx-auto py-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-xl bg-[#DC2626]/15 text-[#EF4444] flex items-center justify-center mx-auto">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="font-display text-xl font-bold text-[#F4F4F5]">
                  Login Pemilik RA STORE
                </h3>
                <p className="text-sm text-[#A1A1AA] leading-relaxed">
                  Masuk dengan username dan kata sandi pemilik untuk mengelola
                  produk, foto galeri, unduhan YouTube, teks website, dan pesanan.
                </p>
              </div>

              {authError && (
                <div className="text-xs text-red-300 bg-red-950/50 border border-red-900 rounded-lg p-3 leading-relaxed">
                  {authError}
                </div>
              )}

              <form
                onSubmit={handleUsernamePasswordLogin}
                className="bg-[#0B0C0F] border border-[#232730] rounded-xl p-5 space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                    Username Admin <span className="text-[#71717A]">(bukan email)</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    required
                    autoComplete="username"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Contoh: Farras"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] placeholder:text-[#71717A] rounded-lg focus:outline-none focus:border-[#DC2626]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                    Kata Sandi
                  </label>
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] placeholder:text-[#71717A] rounded-lg focus:outline-none focus:border-[#DC2626]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={signingIn}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-xl shadow-[0_1px_0_0_rgba(255,255,255,0.18)_inset] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  <span>
                    {signingIn ? 'Memeriksa Akun...' : 'Masuk ke Studio Pemilik'}
                  </span>
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Feedback Banner */}
              {statusMessage && (
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-800 rounded-lg px-4 py-2.5">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {authError && (
                <div className="text-xs font-medium text-red-300 bg-red-950/50 border border-red-900 rounded-lg px-4 py-2.5">
                  {authError}
                </div>
              )}

              {/* Studio Navigation Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#232730]">
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'products'
                      ? 'bg-[#DC2626] text-white'
                      : 'text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Produk ({products.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('youtube')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'youtube'
                      ? 'bg-[#DC2626] text-white'
                      : 'text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Unduhan YT ({downloads.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'orders'
                      ? 'bg-[#DC2626] text-white'
                      : 'text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Pesanan ({orders.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('copy')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'copy'
                      ? 'bg-[#DC2626] text-white'
                      : 'text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  <span>Edit Teks</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-[#DC2626] text-white'
                      : 'text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Pengaturan</span>
                </button>
              </div>

              {/* TAB 1: PRODUCTS */}
              {activeTab === 'products' && (() => {
                const existingTitleSet = new Set(
                  products.map((item) => item.title.trim().toLowerCase())
                );
                const pendingTemplates = READY_TO_PUBLISH_PRODUCTS.filter(
                  (tpl) => !existingTitleSet.has(tpl.title.trim().toLowerCase())
                );
                const productUpdatesNeeded = products.flatMap((prod) => {
                  const matchedTpl = READY_TO_PUBLISH_PRODUCTS.find(
                    (tpl) =>
                      tpl.title.trim().toLowerCase() === prod.title.trim().toLowerCase()
                  );
                  const isPaketOnInHosting =
                    prod.title.toLowerCase().includes('paket on') &&
                    prod.category === 'Hosting SA-MP';

                  const targetCategory = matchedTpl
                    ? matchedTpl.category
                    : isPaketOnInHosting
                      ? ('Paket On Server SA-MP' as ProductCategory)
                      : undefined;

                  const needsCategoryUpdate =
                    Boolean(targetCategory) && prod.category !== targetCategory;
                  const needsImageUpdate =
                    Boolean(matchedTpl) &&
                    resolveProductImageUrl(prod.imageUrl) !== matchedTpl!.imageUrl;

                  if (!needsCategoryUpdate && !needsImageUpdate) return [];
                  return [
                    {
                      productId: prod.id,
                      ...(needsImageUpdate ? { imageUrl: matchedTpl!.imageUrl } : {}),
                      ...(needsCategoryUpdate ? { category: targetCategory } : {}),
                    },
                  ];
                });

                return (
                <div className="space-y-8">
                  {/* Ready-to-Publish Owner Catalog Batch */}
                  <div className="bg-[#0B0C0F] border border-[#DC2626]/35 rounded-xl p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <h3 className="text-sm font-semibold text-[#F4F4F5]">
                          Paket Produk Siap Terbit ({READY_TO_PUBLISH_PRODUCTS.length} Layanan)
                        </h3>
                        <p className="text-xs text-[#A1A1AA]">
                          {pendingTemplates.length > 0
                            ? `${pendingTemplates.length} produk (Modpack, On Server Inferno/LRP, Mapping, Developer) siap masuk katalog.`
                            : 'Semua 16 produk kiriman Anda sudah terbit di katalog.'}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowReadyTemplates((prev) => !prev)}
                          className="px-3 py-1.5 text-xs font-medium text-[#A1A1AA] hover:text-white bg-[#14161B] border border-[#232730] rounded-lg cursor-pointer transition-colors"
                        >
                          {showReadyTemplates ? 'Tutup Daftar' : 'Lihat / Pilih Satuan'}
                        </button>
                        {productUpdatesNeeded.length > 0 && (
                          <button
                            type="button"
                            disabled={publishingBatch}
                            onClick={() => handleSyncReadyTemplateUpdates(productUpdatesNeeded)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#14161B] border border-[#DC2626]/60 hover:bg-[#DC2626]/20 rounded-lg cursor-pointer disabled:opacity-50 transition-colors"
                          >
                            <ImagePlus className="w-3.5 h-3.5 text-[#EF4444]" />
                            <span>
                              {publishingBatch
                                ? 'Memperbarui...'
                                : `Sinkronkan Foto & Kategori (${productUpdatesNeeded.length})`}
                            </span>
                          </button>
                        )}
                        {pendingTemplates.length > 0 && (
                          <button
                            type="button"
                            disabled={publishingBatch}
                            onClick={() => handlePublishReadyTemplates(pendingTemplates)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg cursor-pointer disabled:opacity-50 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>
                              {publishingBatch
                                ? 'Menerbitkan...'
                                : `Terbitkan Semua (${pendingTemplates.length})`}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>

                    {showReadyTemplates && (
                      <div className="pt-2 border-t border-[#232730] space-y-2 max-h-72 overflow-y-auto pr-1">
                        {READY_TO_PUBLISH_PRODUCTS.map((tpl) => {
                          const alreadyExists = existingTitleSet.has(
                            tpl.title.trim().toLowerCase()
                          );
                          return (
                            <div
                              key={tpl.title}
                              className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#14161B] border border-[#232730]"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-[#F4F4F5] truncate">
                                  {tpl.title}
                                </p>
                                <p className="text-[11px] text-[#A1A1AA] font-mono tabular-nums truncate">
                                  {formatIDR(tpl.price)} · {tpl.category}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => applyReadyTemplateToForm(tpl)}
                                  className="px-2.5 py-1 text-[11px] font-medium text-[#A1A1AA] hover:text-white bg-[#0B0C0F] border border-[#232730] rounded-md cursor-pointer"
                                >
                                  Edit di Form
                                </button>
                                <button
                                  type="button"
                                  disabled={publishingBatch || alreadyExists}
                                  onClick={() => handlePublishReadyTemplates([tpl])}
                                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                                    alreadyExists
                                      ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 cursor-default'
                                      : 'text-white bg-[#DC2626] hover:bg-[#B91C1C] cursor-pointer disabled:opacity-50'
                                  }`}
                                >
                                  {alreadyExists ? 'Sudah Terbit' : 'Terbitkan'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <form
                    onSubmit={handleSaveProduct}
                    className="bg-[#0B0C0F] border border-[#232730] rounded-xl p-5 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-[#F4F4F5]">
                        {editingProductId ? 'Edit Produk' : 'Tambah Produk Baru'}
                      </h3>
                      {editingProductId ? (
                        <button
                          type="button"
                          onClick={resetProductForm}
                          className="text-xs text-[#A1A1AA] hover:text-white cursor-pointer"
                        >
                          Batal Edit
                        </button>
                      ) : (
                        products.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Copy className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
                            <select
                              aria-label="Duplikat dari produk yang sudah ada"
                              value={duplicateSourceId}
                              onChange={(e) => {
                                const selected = products.find(
                                  (item) => item.id === e.target.value
                                );
                                if (selected) {
                                  startDuplicateProduct(selected);
                                } else {
                                  setDuplicateSourceId('');
                                }
                              }}
                              className="max-w-[230px] px-2.5 py-1.5 text-xs bg-[#14161B] border border-[#232730] hover:border-[#DC2626]/60 text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626] cursor-pointer"
                            >
                              <option value="">Duplikat dari produk ada...</option>
                              {products.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.title}
                                </option>
                              ))}
                            </select>
                          </div>
                        )
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                          Nama Produk
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={FIELD_LIMITS.PRODUCT_TITLE_MAX}
                          value={pTitle}
                          onChange={(e) => setPTitle(e.target.value)}
                          placeholder="Contoh: Hosting SA-MP AMD EPYC 9750"
                          className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] placeholder:text-[#71717A] rounded-lg focus:outline-none focus:border-[#DC2626]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                          Kategori
                        </label>
                        <select
                          value={pCategory}
                          onChange={(e) =>
                            setPCategory(e.target.value as ProductCategory)
                          }
                          className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                        >
                          {PRODUCT_CATEGORIES.map((cat) => {
                            const customLabel = getCatalogCategoryLabel(cat, settings);
                            return (
                              <option key={cat} value={cat}>
                                {customLabel !== cat ? `${customLabel} (${cat})` : cat}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                          Harga Jual (IDR)
                        </label>
                        <input
                          type="number"
                          required
                          min={0}
                          max={100000000}
                          value={pPrice}
                          onChange={(e) => setPPrice(e.target.value)}
                          className="w-full px-3 py-2 text-sm font-mono bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                          Harga Coret / Promo (Opsional)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100000000}
                          value={pOriginalPrice}
                          onChange={(e) => setPOriginalPrice(e.target.value)}
                          placeholder="Contoh: 35000 (kosongkan jika tidak promo)"
                          className="w-full px-3 py-2 text-sm font-mono bg-[#14161B] border border-[#232730] text-[#F4F4F5] placeholder:text-[#71717A] rounded-lg focus:outline-none focus:border-[#DC2626]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                          Status Stok
                        </label>
                        <select
                          value={pStock}
                          onChange={(e) => setPStock(e.target.value as StockStatus)}
                          className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                        >
                          {STOCK_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Upload Foto Produk + Preset + URL */}
                    <div className="space-y-3">
                      <label className="block text-xs font-medium text-[#A1A1AA]">
                        Foto Produk (Upload dari Perangkat, Pilih Preset, atau URL)
                      </label>

                      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                        <div className="w-28 aspect-[4/3] rounded-lg overflow-hidden bg-[#14161B] border border-[#232730] shrink-0">
                          {pImageUrl ? (
                            <img
                              src={resolveProductImageUrl(pImageUrl)}
                              alt="Pratinjau foto produk"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#A1A1AA]">
                              <ImagePlus className="w-5 h-5" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 space-y-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleProductPhotoUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            disabled={uploadingPhoto}
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-[#F4F4F5] bg-[#14161B] border border-dashed border-[#3F4554] hover:border-[#DC2626] hover:text-[#EF4444] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Upload className="w-4 h-4 shrink-0" />
                            <span>
                              {uploadingPhoto
                                ? 'Mengunggah Foto...'
                                : 'Upload Foto Produk (JPG / PNG / WebP)'}
                            </span>
                          </button>

                          {pImageUrl.startsWith('data:image/') ? (
                            <div className="w-full px-3 py-2 text-xs bg-[#14161B] border border-emerald-800/60 text-emerald-300 rounded-lg flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1.5 truncate">
                                <Check className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">
                                  {editingProductId
                                    ? 'Foto siap — klik "Simpan Perubahan" di bawah'
                                    : 'Foto siap — klik "Terbitkan Produk" di bawah'}
                                </span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setPImageUrl('')}
                                className="text-[11px] font-medium text-[#A1A1AA] hover:text-white underline shrink-0 cursor-pointer"
                              >
                                Pakai URL
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <input
                                type="text"
                                required
                                maxLength={FIELD_LIMITS.URL_MAX}
                                value={pImageUrl}
                                onChange={(e) => setPImageUrl(e.target.value)}
                                placeholder="https://... (atau Upload Foto di atas)"
                                className="w-full px-3 py-2 text-xs font-mono bg-[#14161B] border border-[#232730] text-[#F4F4F5] placeholder:text-[#71717A] rounded-lg focus:outline-none focus:border-[#DC2626]"
                              />
                              {pImageUrl.startsWith('/uploads/') && (
                                <p className="text-[11px] text-amber-400">
                                  Path foto lama (/uploads/...) sudah kedaluwarsa. Upload ulang foto baru di atas lalu klik Simpan Perubahan.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {savedImages.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <p className="text-[11px] font-medium text-[#A1A1AA]">
                            Foto Tersimpan Saya ({savedImages.length})
                          </p>
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {savedImages.map((imgItem) => (
                              <div
                                key={imgItem.id}
                                className={`group relative rounded-lg overflow-hidden border-2 aspect-[4/3] bg-[#14161B] ${
                                  pImageUrl === imgItem.imageUrl
                                    ? 'border-[#DC2626]'
                                    : 'border-white/[0.08] hover:border-white/30'
                                }`}
                              >
                                <button
                                  type="button"
                                  title={imgItem.label}
                                  onClick={() => setPImageUrl(imgItem.imageUrl)}
                                  className="w-full h-full cursor-pointer block"
                                >
                                  <img
                                    src={imgItem.imageUrl}
                                    alt={imgItem.label}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                                <button
                                  type="button"
                                  title="Hapus dari galeri tersimpan"
                                  aria-label={`Hapus foto ${imgItem.label}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSavedImage(imgItem.id);
                                  }}
                                  className="absolute top-1 right-1 w-5 h-5 rounded-md bg-black/75 text-white/80 hover:text-[#EF4444] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <p className="text-[11px] font-medium text-[#71717A]">
                          Template Bawaan
                        </p>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                          {STUDIO_IMAGE_PRESETS.map((preset) => (
                            <button
                              key={preset.url}
                              type="button"
                              title={preset.label}
                              onClick={() => setPImageUrl(preset.url)}
                              className={`rounded-lg overflow-hidden border-2 aspect-[4/3] bg-[#14161B] cursor-pointer ${
                                pImageUrl === preset.url
                                  ? 'border-[#DC2626]'
                                  : 'border-transparent opacity-70 hover:opacity-100'
                              }`}
                            >
                              <img
                                src={preset.url}
                                alt={preset.label}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                          Varian / Edisi (Opsional)
                        </label>
                        <input
                          type="text"
                          maxLength={FIELD_LIMITS.PRODUCT_VARIANT_MAX}
                          value={pVariant}
                          onChange={(e) => setPVariant(e.target.value)}
                          placeholder="Contoh: AMD EPYC 9750 · NVMe"
                          className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] placeholder:text-[#71717A] rounded-lg focus:outline-none focus:border-[#DC2626]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                          Catatan Pengiriman (Opsional)
                        </label>
                        <input
                          type="text"
                          maxLength={FIELD_LIMITS.PRODUCT_DELIVERY_MAX}
                          value={pDelivery}
                          onChange={(e) => setPDelivery(e.target.value)}
                          placeholder="Contoh: Dikirim via WhatsApp/Discord"
                          className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] placeholder:text-[#71717A] rounded-lg focus:outline-none focus:border-[#DC2626]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                        Deskripsi Produk
                      </label>
                      <textarea
                        required
                        rows={3}
                        maxLength={FIELD_LIMITS.PRODUCT_DESC_MAX}
                        value={pDesc}
                        onChange={(e) => setPDesc(e.target.value)}
                        placeholder="Jelaskan spesifikasi, fitur, atau detail layanan..."
                        className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] placeholder:text-[#71717A] rounded-lg focus:outline-none focus:border-[#DC2626]"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <label className="inline-flex items-center gap-2 text-xs text-[#F4F4F5] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pFeatured}
                          onChange={(e) => setPFeatured(e.target.checked)}
                          className="rounded border-[#232730] accent-[#DC2626]"
                        />
                        <span>Tampilkan sebagai produk unggulan</span>
                      </label>

                      <div className="flex flex-wrap items-center gap-2">
                        {!editingProductId && (
                          <button
                            type="button"
                            disabled={saving || uploadingPhoto}
                            onClick={() => saveProduct(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#F4F4F5] bg-[#14161B] border border-[#232730] hover:border-[#DC2626]/70 rounded-lg cursor-pointer disabled:opacity-50 transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5 text-[#EF4444]" />
                            <span>Terbitkan &amp; Duplikat</span>
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={saving || uploadingPhoto}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg cursor-pointer disabled:opacity-50"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>
                            {editingProductId ? 'Simpan Perubahan' : 'Terbitkan Produk'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Product List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-[#A1A1AA]">
                      Daftar Produk Aktif
                    </h4>
                    {products.length === 0 ? (
                      <p className="text-xs text-[#71717A] bg-[#0B0C0F] border border-[#232730] rounded-xl p-4">
                        Belum ada produk yang diterbitkan. Gunakan formulir di atas untuk menambah produk pertama Anda.
                      </p>
                    ) : (
                      products.map((p) => (
                        <div
                          key={p.id}
                          className="bg-[#0B0C0F] border border-[#232730] rounded-xl p-3.5 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {p.imageUrl.startsWith('/uploads/') ? (
                              <div
                                title="Foto lama kedaluwarsa, klik Edit untuk upload ulang"
                                className="w-12 h-12 rounded-lg bg-[#14161B] border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0"
                              >
                                <ImagePlus className="w-4 h-4" />
                              </div>
                            ) : (
                              <img
                                src={resolveProductImageUrl(p.imageUrl)}
                                alt={p.title}
                                referrerPolicy="no-referrer"
                                className="w-12 h-12 rounded-lg object-cover bg-[#14161B] shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#F4F4F5] truncate">
                                {p.title}
                              </p>
                              <p className="text-xs text-[#A1A1AA] font-mono tabular-nums">
                                {formatIDR(p.price)} · {p.stockStatus}
                              </p>
                              {p.imageUrl.startsWith('/uploads/') && (
                                <p className="text-[11px] text-amber-400">
                                  Foto perlu diupload ulang (klik Edit)
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => startDuplicateProduct(p)}
                              title="Duplikat ke Form Tambah Produk"
                              aria-label={`Duplikat ${p.title}`}
                              className="p-2 text-[#A1A1AA] hover:text-[#EF4444] hover:bg-[#14161B] rounded-lg cursor-pointer"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => startEditProduct(p)}
                              title="Edit Produk"
                              aria-label={`Edit ${p.title}`}
                              className="p-2 text-[#A1A1AA] hover:text-white hover:bg-[#14161B] rounded-lg cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p.id)}
                              title="Hapus Produk"
                              aria-label={`Hapus ${p.title}`}
                              className="p-2 text-[#A1A1AA] hover:text-[#EF4444] hover:bg-red-950/40 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                );
              })()}

              {/* TAB 2: YOUTUBE DOWNLOADS */}
              {activeTab === 'youtube' && (
                <div className="space-y-8">
                  <form
                    onSubmit={handleSaveYt}
                    className="bg-[#0B0C0F] border border-[#232730] rounded-xl p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-[#F4F4F5]">
                        {editingYtId
                          ? 'Edit Unduhan YouTube'
                          : 'Tambah File Unduhan dari YouTube'}
                      </h3>
                      {editingYtId && (
                        <button
                          type="button"
                          onClick={resetYtForm}
                          className="text-xs text-[#A1A1AA] hover:text-white cursor-pointer"
                        >
                          Batal Edit
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                          Judul Konten / File
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={FIELD_LIMITS.YT_TITLE_MAX}
                          value={yTitle}
                          onChange={(e) => setYTitle(e.target.value)}
                          placeholder="Contoh: Modpack SA-MP Ringan Episode 12"
                          className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] placeholder:text-[#71717A] rounded-lg focus:outline-none focus:border-[#DC2626]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                          Kategori File
                        </label>
                        <select
                          value={yCategory}
                          onChange={(e) =>
                            setYCategory(e.target.value as YoutubeCategory)
                          }
                          className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                        >
                          {YT_CATEGORIES.map((cat) => {
                            const customLabel =
                              cat === 'Mod & Config'
                                ? tYtTabModLabel
                                : cat === 'Preset & Editing'
                                  ? tYtTabPresetLabel
                                  : cat === 'Dokumen & Tool'
                                    ? tYtTabDocLabel
                                    : cat;
                            return (
                              <option key={cat} value={cat}>
                                {customLabel || cat}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                        Link Video YouTube
                      </label>
                      <input
                        type="url"
                        required
                        maxLength={300}
                        value={yUrl}
                        onChange={(e) => setYUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full px-3 py-2 text-sm font-mono bg-[#14161B] border border-[#232730] text-[#F4F4F5] placeholder:text-[#71717A] rounded-lg focus:outline-none focus:border-[#DC2626]"
                      />
                      {liveVideoIdPreview && (
                        <p className="text-[11px] text-[#A1A1AA] mt-1 font-mono">
                          ID Video terdeteksi: {liveVideoIdPreview}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                        Link Download Langsung (Google Drive / MediaFire / GitHub)
                      </label>
                      <input
                        type="url"
                        required
                        maxLength={FIELD_LIMITS.URL_MAX}
                        value={yDownloadUrl}
                        onChange={(e) => setYDownloadUrl(e.target.value)}
                        placeholder="https://drive.google.com/..."
                        className="w-full px-3 py-2 text-sm font-mono bg-[#14161B] border border-[#232730] text-[#F4F4F5] placeholder:text-[#71717A] rounded-lg focus:outline-none focus:border-[#DC2626]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                          Nama File
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={FIELD_LIMITS.YT_FILENAME_MAX}
                          value={yFileName}
                          onChange={(e) => setYFileName(e.target.value)}
                          placeholder="RA_Mod_v1.zip"
                          className="w-full px-3 py-2 text-sm font-mono bg-[#14161B] border border-[#232730] text-[#F4F4F5] placeholder:text-[#71717A] rounded-lg focus:outline-none focus:border-[#DC2626]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                          Ukuran File
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={FIELD_LIMITS.YT_FILESIZE_MAX}
                          value={yFileSize}
                          onChange={(e) => setYFileSize(e.target.value)}
                          placeholder="24.5 MB"
                          className="w-full px-3 py-2 text-sm font-mono bg-[#14161B] border border-[#232730] text-[#F4F4F5] placeholder:text-[#71717A] rounded-lg focus:outline-none focus:border-[#DC2626]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                          Versi
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={FIELD_LIMITS.YT_VERSION_MAX}
                          value={yVersion}
                          onChange={(e) => setYVersion(e.target.value)}
                          placeholder="v1.0"
                          className="w-full px-3 py-2 text-sm font-mono bg-[#14161B] border border-[#232730] text-[#F4F4F5] placeholder:text-[#71717A] rounded-lg focus:outline-none focus:border-[#DC2626]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                        Catatan Cara Pasang / Rilis
                      </label>
                      <textarea
                        required
                        rows={2}
                        maxLength={FIELD_LIMITS.YT_NOTES_MAX}
                        value={yNotes}
                        onChange={(e) => setYNotes(e.target.value)}
                        placeholder="Petunjuk singkat penggunaan file sesuai video YouTube..."
                        className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] placeholder:text-[#71717A] rounded-lg focus:outline-none focus:border-[#DC2626]"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg cursor-pointer disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>
                          {editingYtId ? 'Simpan Perubahan' : 'Bagikan File YT'}
                        </span>
                      </button>
                    </div>
                  </form>

                  {/* YT List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-[#A1A1AA]">
                      Daftar File YouTube Aktif
                    </h4>
                    {downloads.length === 0 ? (
                      <p className="text-xs text-[#71717A] bg-[#0B0C0F] border border-[#232730] rounded-xl p-4">
                        Belum ada file unduhan YouTube yang dibagikan. Tambahkan link pertama Anda di atas.
                      </p>
                    ) : (
                      downloads.map((item) => (
                        <div
                          key={item.id}
                          className="bg-[#0B0C0F] border border-[#232730] rounded-xl p-3.5 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#F4F4F5] truncate">
                              {item.title}
                            </p>
                            <p className="text-xs text-[#A1A1AA] font-mono tabular-nums truncate">
                              {item.fileName} · {item.fileSize} · {item.downloadCount} unduhan
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => startEditYt(item)}
                              aria-label={`Edit ${item.title}`}
                              className="p-2 text-[#A1A1AA] hover:text-white hover:bg-[#14161B] rounded-lg cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteYt(item.id)}
                              aria-label={`Hapus ${item.title}`}
                              className="p-2 text-[#A1A1AA] hover:text-[#EF4444] hover:bg-red-950/40 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: ORDERS */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-[#F4F4F5]">
                    Pesanan Pelanggan Masuk
                  </h3>
                  {orders.length === 0 ? (
                    <div className="bg-[#0B0C0F] border border-[#232730] rounded-xl p-8 text-center text-sm text-[#A1A1AA]">
                      Belum ada pesanan masuk.
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-[#0B0C0F] border border-[#232730] rounded-xl p-4 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-mono text-xs text-[#A1A1AA]">
                              {order.orderCode} · {order.paymentMethod}
                            </p>
                            <p className="text-sm font-semibold text-[#F4F4F5]">
                              {order.customerName} ({order.customerWhatsapp})
                            </p>
                          </div>

                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleUpdateOrderStatus(
                                order.id,
                                e.target.value as OrderStatus
                              )
                            }
                            className="px-3 py-1.5 text-xs font-medium bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg"
                          >
                            {ORDER_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="text-xs text-[#A1A1AA] space-y-1 border-t border-[#232730] pt-2.5">
                          {order.items.map((it, idx) => (
                            <div
                              key={`${order.id}_${idx}`}
                              className="flex justify-between"
                            >
                              <span>
                                {it.title} ({it.qty}x)
                              </span>
                              <span className="font-mono tabular-nums">
                                {formatIDR(it.price * it.qty)}
                              </span>
                            </div>
                          ))}
                          {order.customerNote && (
                            <p className="pt-1 text-[#F4F4F5]">
                              Catatan: {order.customerNote}
                            </p>
                          )}
                          <div className="flex justify-between font-semibold text-[#F4F4F5] pt-1.5 border-t border-[#232730]">
                            <span>Total</span>
                            <span className="font-mono tabular-nums">
                              {formatIDR(order.totalAmount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: EDIT WEBSITE TEXT */}
              {activeTab === 'copy' && (
                <form
                  onSubmit={handleSaveSiteCopy}
                  className="space-y-6"
                >
                  <div className="bg-[#090A0D] border border-white/[0.08] rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-[#9CA3AF]">
                      {autoSaveState === 'saving'
                        ? 'Menyimpan otomatis ke database...'
                        : autoSaveState === 'saved'
                          ? 'Tersimpan otomatis ke semua perangkat'
                          : autoSaveState === 'incomplete'
                            ? 'Lengkapi kolom wajib yang kosong agar auto-save berjalan'
                            : autoSaveState === 'error'
                              ? 'Gagal menyimpan otomatis — coba klik Simpan Sekarang'
                              : 'Auto-Save aktif · perubahan otomatis tersinkron ke semua pengunjung'}
                    </span>
                    <span className="font-mono text-[11px] text-[#EF4444]">
                      {autoSaveState === 'saving'
                        ? 'Menyimpan...'
                        : autoSaveState === 'saved'
                          ? 'Tersinkron'
                          : 'Cloud Sync'}
                    </span>
                  </div>

                  <div className="bg-[#090A0D] border border-white/[0.08] rounded-xl p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-[#F5F5F7]">
                          Branding &amp; Teks Halaman Utama (Hero)
                        </h3>
                        <p className="text-xs text-[#9CA3AF] mt-0.5">
                          Ubah nama store, judul utama, dan deskripsi yang muncul di bagian atas website.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetSiteCopyDefaults}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#9CA3AF] hover:text-white bg-[#111318] border border-white/[0.08] rounded-lg cursor-pointer transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Default</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                          Nama Store / Brand
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={FIELD_LIMITS.BRAND_NAME_MAX}
                          value={tBrandName}
                          onChange={(e) => {
                            setTBrandName(e.target.value);
                            markCopyDirty();
                          }}
                          placeholder="RA STORE"
                          className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                          Tagline Samping Brand
                        </label>
                        <input
                          type="text"
                          maxLength={FIELD_LIMITS.HERO_TAGLINE_MAX}
                          value={tHeroTagline}
                          onChange={(e) => {
                            setTHeroTagline(e.target.value);
                            markCopyDirty();
                          }}
                          placeholder="Farrassamp Official"
                          className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                        Judul Utama Website (Hero Headline)
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={FIELD_LIMITS.HERO_TITLE_MAX}
                        value={tHeroTitle}
                        onChange={(e) => {
                          setTHeroTitle(e.target.value);
                          markCopyDirty();
                        }}
                        placeholder="Hosting SA-MP EPYC 9750, Modpack & Arsip File YouTube."
                        className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                        Deskripsi Utama Website
                      </label>
                      <textarea
                        rows={3}
                        required
                        maxLength={FIELD_LIMITS.HERO_SUBTITLE_MAX}
                        value={tHeroSubtitle}
                        onChange={(e) => {
                          setTHeroSubtitle(e.target.value);
                          markCopyDirty();
                        }}
                        placeholder="Deskripsi singkat tentang layanan RA STORE..."
                        className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                          Label Foto Hardware Hero
                        </label>
                        <input
                          type="text"
                          maxLength={FIELD_LIMITS.HERO_CAPTION_TITLE_MAX}
                          value={tHeroImageCaptionTitle}
                          onChange={(e) => {
                            setTHeroImageCaptionTitle(e.target.value);
                            markCopyDirty();
                          }}
                          placeholder="AMD EPYC 9750 Infrastructure"
                          className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                          Keterangan Foto Hardware Hero
                        </label>
                        <input
                          type="text"
                          maxLength={FIELD_LIMITS.HERO_CAPTION_SUBTITLE_MAX}
                          value={tHeroImageCaptionSubtitle}
                          onChange={(e) => {
                            setTHeroImageCaptionSubtitle(e.target.value);
                            markCopyDirty();
                          }}
                          placeholder="Performa server stabil untuk komunitas GTA SA-MP"
                          className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                        Banner Pengumuman Paling Atas (Opsional)
                      </label>
                      <input
                        type="text"
                        maxLength={200}
                        value={sAnnouncement}
                        onChange={(e) => {
                          setSAnnouncement(e.target.value);
                          markCopyDirty();
                        }}
                        placeholder="Contoh: Promo Hosting EPYC 9750 diskon minggu ini!"
                        className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                      />
                    </div>
                  </div>

                  <div className="bg-[#090A0D] border border-white/[0.08] rounded-xl p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-[#F5F5F7]">
                      Judul Katalog &amp; Pusat Unduhan YouTube
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                          Sub-judul Kecil Katalog
                        </label>
                        <input
                          type="text"
                          maxLength={FIELD_LIMITS.SECTION_EYEBROW_MAX}
                          value={tCatalogEyebrow}
                          onChange={(e) => {
                            setTCatalogEyebrow(e.target.value);
                            markCopyDirty();
                          }}
                          placeholder="Belanja di RA STORE"
                          className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                          Judul Bagian Katalog
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={FIELD_LIMITS.SECTION_TITLE_MAX}
                          value={tCatalogTitle}
                          onChange={(e) => {
                            setTCatalogTitle(e.target.value);
                            markCopyDirty();
                          }}
                          placeholder="Katalog Produk & Jasa"
                          className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                          Sub-judul Kecil Unduhan YT
                        </label>
                        <input
                          type="text"
                          maxLength={FIELD_LIMITS.SECTION_EYEBROW_MAX}
                          value={tYoutubeEyebrow}
                          onChange={(e) => {
                            setTYoutubeEyebrow(e.target.value);
                            markCopyDirty();
                          }}
                          placeholder="Dibagikan dari Kanal YouTube Farrassamp"
                          className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                          Judul Bagian Unduhan YT
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={FIELD_LIMITS.SECTION_TITLE_MAX}
                          value={tYoutubeTitle}
                          onChange={(e) => {
                            setTYoutubeTitle(e.target.value);
                            markCopyDirty();
                          }}
                          placeholder="Pusat Unduhan YouTube"
                          className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/[0.08] space-y-3">
                      <div>
                        <h4 className="text-xs font-semibold text-[#F5F5F7]">
                          Label Tab Kategori Katalog Produk
                        </h4>
                        <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                          Ubah semua teks tombol tab kategori di Katalog Produk sesuai keinginan (otomatis memperbarui label tab &amp; kartu produk).
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                            Tab 1 (Default: Semua)
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={FIELD_LIMITS.CATALOG_TAB_LABEL_MAX}
                            value={tCatTabAllLabel}
                            onChange={(e) => {
                              setTCatTabAllLabel(e.target.value);
                              markCopyDirty();
                            }}
                            placeholder="Semua"
                            className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                            Tab 2 (Default: Hosting SA-MP)
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={FIELD_LIMITS.CATALOG_TAB_LABEL_MAX}
                            value={tCatTabHostingLabel}
                            onChange={(e) => {
                              setTCatTabHostingLabel(e.target.value);
                              markCopyDirty();
                            }}
                            placeholder="Hosting SA-MP"
                            className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                            Tab 3 (Default: Paket On Server SA-MP)
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={FIELD_LIMITS.CATALOG_TAB_LABEL_MAX}
                            value={tCatTabPaketOnLabel}
                            onChange={(e) => {
                              setTCatTabPaketOnLabel(e.target.value);
                              markCopyDirty();
                            }}
                            placeholder="Paket On Server SA-MP"
                            className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                            Tab 4 (Default: Modpack GTA SA-MP)
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={FIELD_LIMITS.CATALOG_TAB_LABEL_MAX}
                            value={tCatTabModpackLabel}
                            onChange={(e) => {
                              setTCatTabModpackLabel(e.target.value);
                              markCopyDirty();
                            }}
                            placeholder="Modpack GTA SA-MP"
                            className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                            Tab 5 (Default: Jasa Developer)
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={FIELD_LIMITS.CATALOG_TAB_LABEL_MAX}
                            value={tCatTabDevLabel}
                            onChange={(e) => {
                              setTCatTabDevLabel(e.target.value);
                              markCopyDirty();
                            }}
                            placeholder="Jasa Developer"
                            className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                            Tab 6 (Default: Jasa SA-MP)
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={FIELD_LIMITS.CATALOG_TAB_LABEL_MAX}
                            value={tCatTabJasaSampLabel}
                            onChange={(e) => {
                              setTCatTabJasaSampLabel(e.target.value);
                              markCopyDirty();
                            }}
                            placeholder="Jasa SA-MP"
                            className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                            Tab 7 (Default: Review &amp; Streaming)
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={FIELD_LIMITS.CATALOG_TAB_LABEL_MAX}
                            value={tCatTabReviewLabel}
                            onChange={(e) => {
                              setTCatTabReviewLabel(e.target.value);
                              markCopyDirty();
                            }}
                            placeholder="Review & Streaming"
                            className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/[0.08] space-y-3">
                      <div>
                        <h4 className="text-xs font-semibold text-[#F5F5F7]">
                          Label Tab Kategori Unduhan YouTube
                        </h4>
                        <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                          Ubah teks tombol filter tab di bagian Pusat Unduhan YouTube (Semua, Mod &amp; Config, Preset &amp; Editing, Dokumen &amp; Tool).
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                            Tab 1 (Default: Semua)
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={FIELD_LIMITS.YT_TAB_LABEL_MAX}
                            value={tYtTabAllLabel}
                            onChange={(e) => {
                              setTYtTabAllLabel(e.target.value);
                              markCopyDirty();
                            }}
                            placeholder="Semua"
                            className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                            Tab 2 (Default: Mod &amp; Config)
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={FIELD_LIMITS.YT_TAB_LABEL_MAX}
                            value={tYtTabModLabel}
                            onChange={(e) => {
                              setTYtTabModLabel(e.target.value);
                              markCopyDirty();
                            }}
                            placeholder="Mod & Config"
                            className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                            Tab 3 (Default: Preset &amp; Editing)
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={FIELD_LIMITS.YT_TAB_LABEL_MAX}
                            value={tYtTabPresetLabel}
                            onChange={(e) => {
                              setTYtTabPresetLabel(e.target.value);
                              markCopyDirty();
                            }}
                            placeholder="Preset & Editing"
                            className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                            Tab 4 (Default: Dokumen &amp; Tool)
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={FIELD_LIMITS.YT_TAB_LABEL_MAX}
                            value={tYtTabDocLabel}
                            onChange={(e) => {
                              setTYtTabDocLabel(e.target.value);
                              markCopyDirty();
                            }}
                            placeholder="Dokumen & Tool"
                            className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#090A0D] border border-white/[0.08] rounded-xl p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-[#F5F5F7]">
                      Bagian Tentang Pemilik &amp; Footer
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                          Label Jabatan Pemilik
                        </label>
                        <input
                          type="text"
                          maxLength={FIELD_LIMITS.ABOUT_ROLE_MAX}
                          value={tAboutRoleLabel}
                          onChange={(e) => {
                            setTAboutRoleLabel(e.target.value);
                            markCopyDirty();
                          }}
                          placeholder="Pemilik & Pengelola RA STORE"
                          className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                          Nama Tampilan Pemilik
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={FIELD_LIMITS.OWNER_DISPLAY_NAME_MAX}
                          value={tOwnerDisplayName}
                          onChange={(e) => {
                            setTOwnerDisplayName(e.target.value);
                            markCopyDirty();
                          }}
                          placeholder="Farrassamp"
                          className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                        Deskripsi Tentang Toko
                      </label>
                      <textarea
                        rows={3}
                        required
                        maxLength={FIELD_LIMITS.ABOUT_DESC_MAX}
                        value={tAboutDescription}
                        onChange={(e) => {
                          setTAboutDescription(e.target.value);
                          markCopyDirty();
                        }}
                        placeholder="Deskripsi toko dan layanan resmi Farrassamp..."
                        className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                          Sub-judul Kartu Logo Resmi
                        </label>
                        <input
                          type="text"
                          maxLength={FIELD_LIMITS.OFFICIAL_SUBTITLE_MAX}
                          value={tOfficialCardSubtitle}
                          onChange={(e) => {
                            setTOfficialCardSubtitle(e.target.value);
                            markCopyDirty();
                          }}
                          placeholder="Sedia Kebutuhan SA-MP · Hosting, Modpack & Jasa"
                          className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                          Teks Hak Cipta Footer
                        </label>
                        <input
                          type="text"
                          maxLength={FIELD_LIMITS.FOOTER_TEXT_MAX}
                          value={tFooterText}
                          onChange={(e) => {
                            setTFooterText(e.target.value);
                            markCopyDirty();
                          }}
                          placeholder="RA STORE · Farrassamp. Seluruh hak cipta dilindungi."
                          className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>{saving ? 'Menyimpan...' : 'Simpan Sekarang'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 5: STORE SETTINGS */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <form
                    onSubmit={handleSaveSettings}
                    className="bg-[#0B0C0F] border border-[#232730] rounded-xl p-5 space-y-4"
                  >
                    <h3 className="text-sm font-semibold text-[#F4F4F5]">
                      Pengaturan Kontak, Discord &amp; Kanal Farrassamp
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                          Nomor WhatsApp (format 628...)
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={30}
                          value={sWhatsapp}
                          onChange={(e) => setSWhatsapp(e.target.value)}
                          placeholder="6285797123671"
                          className="w-full px-3 py-2 text-sm font-mono bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                          Username Discord Pemilik
                        </label>
                        <input
                          type="text"
                          maxLength={80}
                          value={sDiscordUsername}
                          onChange={(e) => setSDiscordUsername(e.target.value)}
                          placeholder="farrassamp"
                          className="w-full px-3 py-2 text-sm font-mono bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                        Link Discord Store
                      </label>
                      <input
                        type="url"
                        maxLength={300}
                        value={sDiscordInviteUrl}
                        onChange={(e) => setSDiscordInviteUrl(e.target.value)}
                        placeholder="https://discord.gg/ss2WFZK6Zg"
                        className="w-full px-3 py-2 text-sm font-mono bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                        URL Kanal YouTube Farrassamp
                      </label>
                      <input
                        type="url"
                        required
                        maxLength={300}
                        value={sYoutubeChannel}
                        onChange={(e) => setSYoutubeChannel(e.target.value)}
                        placeholder="https://www.youtube.com/@Farrassamp"
                        className="w-full px-3 py-2 text-sm font-mono bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                        Banner Pengumuman Atas (Opsional)
                      </label>
                      <input
                        type="text"
                        maxLength={200}
                        value={sAnnouncement}
                        onChange={(e) => setSAnnouncement(e.target.value)}
                        placeholder="Kosongkan jika tidak ingin menampilkan banner"
                        className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                      />
                    </div>

                    <div className="pt-3 border-t border-white/[0.08] space-y-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-semibold text-[#F4F4F5]">
                            Verifikasi Discord &amp; Role Subscribe Pusat Unduhan
                          </h4>
                          <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                            Status Discord OAuth:{' '}
                            <span
                              className={
                                discordConfigured
                                  ? 'text-emerald-400 font-medium'
                                  : 'text-amber-400 font-medium'
                              }
                            >
                              {discordConfigured
                                ? 'Terhubung (Aktif)'
                                : 'Menunggu DISCORD_CLIENT_ID & DISCORD_CLIENT_SECRET'}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                            ID Server Discord (Guild ID)
                          </label>
                          <input
                            type="text"
                            maxLength={30}
                            value={sDiscordGuildId}
                            onChange={(e) => setSDiscordGuildId(e.target.value)}
                            placeholder="1406592741701587124"
                            className="w-full px-3 py-2 text-sm font-mono bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                            ID Role Subscribe (Akses Unduhan)
                          </label>
                          <input
                            type="text"
                            maxLength={30}
                            value={sDiscordSubscribeRoleId}
                            onChange={(e) => setSDiscordSubscribeRoleId(e.target.value)}
                            placeholder="1558118487409295460"
                            className="w-full px-3 py-2 text-sm font-mono bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-2.5 text-xs text-[#E4E4E7] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sRequireDiscordEntry}
                          onChange={(e) => setSRequireDiscordEntry(e.target.checked)}
                          className="w-4 h-4 accent-[#DC2626] rounded"
                        />
                        <span>
                          Wajibkan verifikasi Discord saat awal masuk web (opsional — Pusat Unduhan selalu terkunci role Subscribe)
                        </span>
                      </label>

                      {typeof window !== 'undefined' && (
                        <div className="bg-[#14161B] border border-[#232730] rounded-lg p-3 space-y-1.5">
                          <p className="text-[11px] font-medium text-[#A1A1AA]">
                            Redirect URI Aktif (wajib didaftarkan di Discord Developer Portal → OAuth2 → Redirects):
                          </p>
                          <div className="flex items-center gap-2">
                            <code className="text-[11px] font-mono text-[#F4F4F5] bg-[#090A0D] border border-white/[0.08] rounded px-2.5 py-1.5 truncate flex-1">
                              {`${window.location.origin}/auth/discord/callback`}
                            </code>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(
                                    `${window.location.origin}/auth/discord/callback`
                                  );
                                  setCopiedRedirectUri(true);
                                  window.setTimeout(() => setCopiedRedirectUri(false), 2000);
                                } catch {
                                  // ignore clipboard failure
                                }
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium bg-white/[0.08] hover:bg-white/[0.14] text-white rounded cursor-pointer shrink-0"
                            >
                              {copiedRedirectUri ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>Disalin</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Salin</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 text-xs font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg cursor-pointer disabled:opacity-50"
                      >
                        Simpan Pengaturan
                      </button>
                    </div>
                  </form>

                  {/* Change Admin Username & Password */}
                  <div className="bg-[#0B0C0F] border border-[#232730] rounded-xl p-5 space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-[#F4F4F5]">
                        Keamanan Login Pemilik
                      </h3>
                      <p className="text-xs text-[#A1A1AA] mt-1 leading-relaxed">
                        Ubah username atau kata sandi untuk login Studio Pemilik kapan
                        saja. Perubahan langsung berlaku dan tersimpan di server.
                      </p>
                    </div>

                    <form onSubmit={handleChangeCredentials} className="space-y-3.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                            Username Baru
                          </label>
                          <input
                            type="text"
                            required
                            minLength={2}
                            maxLength={40}
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            placeholder="Farras"
                            className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                            Kata Sandi Saat Ini
                          </label>
                          <input
                            type="password"
                            required
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Masukkan sandi sekarang"
                            className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                          Kata Sandi Baru (minimal 4 karakter)
                        </label>
                        <input
                          type="password"
                          required
                          minLength={4}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Masukkan kata sandi baru"
                          className="w-full px-3 py-2 text-sm bg-[#14161B] border border-[#232730] text-[#F4F4F5] rounded-lg focus:outline-none focus:border-[#DC2626]"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={updatingCredentials}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg cursor-pointer disabled:opacity-50"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>
                            {updatingCredentials
                              ? 'Menyimpan...'
                              : 'Perbarui Username & Sandi'}
                          </span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.aside>
    </div>
  );
}
