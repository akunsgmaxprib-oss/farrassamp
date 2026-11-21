import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { ArrowUp, Check } from 'lucide-react';
import { AboutAndFooter, StoreFooter } from './components/AboutAndFooter';
import { AdminDrawer } from './components/AdminDrawer';
import { CartDrawer } from './components/CartDrawer';
import {
  CustomRequestModal,
  CustomRequestMode,
} from './components/CustomRequestModal';
import { DiscordEntryGateModal } from './components/DiscordEntryGateModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FaqSection } from './components/FaqSection';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ProductCatalog } from './components/ProductCatalog';
import { ProductDetailModal } from './components/ProductDetailModal';
import {
  IntroDestinationAction,
  WelcomeIntroOverlay,
} from './components/WelcomeIntroOverlay';
import { WishlistDrawer } from './components/WishlistDrawer';
import { YoutubeDownloadsSection } from './components/YoutubeDownloadsSection';
import { YoutubePlayerModal } from './components/YoutubePlayerModal';
import {
  DEFAULT_STORE_SETTINGS,
  getCatalogCategoryLabel,
  READY_TO_PUBLISH_PRODUCTS,
} from './data/starterCatalog';
import {
  clearDiscordResumeSession,
  fetchCurrentAdmin,
  fetchDiscordAuthUrl,
  fetchPublicStore,
  getStoredDiscordResumeSession,
  hydrateDiscordSessionFromStorage,
  logoutDiscord,
  persistDiscordSessionCookie,
  recheckDiscordRole,
  resumeDiscordSession,
  saveDiscordResumeSession,
  subscribeStoreStream,
  trackYoutubeDownload,
} from './lib/storeApi';
import {
  CartItem,
  DiscordConfigStatus,
  DiscordSessionUser,
  DownloadAccessStatus,
  Product,
  ProductCategory,
  StoreSettings,
  YoutubeDownload,
} from './types/store';

function StorefrontApp() {
  const [adminUsername, setAdminUsername] = useState<string | null>(null);
  const [storeProducts, setStoreProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [storeDownloads, setStoreDownloads] = useState<YoutubeDownload[]>([]);
  const [lockedDownloadsCount, setLockedDownloadsCount] = useState(0);
  const [downloadAccess, setDownloadAccess] = useState<DownloadAccessStatus | undefined>(
    undefined
  );
  const [discordConfig, setDiscordConfig] = useState<DiscordConfigStatus>({
    configured: true,
    requireDiscordEntry: false,
    guildId: '1406592741701587124',
    subscribeRoleId: '1558118487409295460',
  });
  const [storeLoaded, setStoreLoaded] = useState(false);
  const [discordVerifying, setDiscordVerifying] = useState(false);
  const [discordRechecking, setDiscordRechecking] = useState(false);
  const [discordAuthError, setDiscordAuthError] = useState('');
  const [downloadsLoading, setDownloadsLoading] = useState(true);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState<string>('Semua');

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('ra_store_cart');
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ra_store_wishlist');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed)
        ? parsed.filter((id): id is string => typeof id === 'string')
        : [];
    } catch {
      return [];
    }
  });

  const [introOpen, setIntroOpen] = useState(() => {
    const hash = window.location.hash.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    return !(
      hash === '#studio-pemilik' ||
      hash === '#owner' ||
      params.get('studio') === '1'
    );
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [customRequestModal, setCustomRequestModal] = useState<{
    open: boolean;
    mode: CustomRequestMode;
  }>({ open: false, mode: 'mapping' });
  const [adminOpen, setAdminOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeVideoItem, setActiveVideoItem] = useState<YoutubeDownload | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setShowScrollTop(window.scrollY > 460);
    }
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isAdmin = Boolean(adminUsername);

  const loadPublicStore = useCallback(async () => {
    try {
      hydrateDiscordSessionFromStorage();
      const payload = await fetchPublicStore();
      setStoreProducts(Array.isArray(payload.products) ? payload.products : []);
      setStoreDownloads(
        Array.isArray(payload.youtubeDownloads) ? payload.youtubeDownloads : []
      );
      setLockedDownloadsCount(
        typeof payload.lockedDownloadsCount === 'number'
          ? payload.lockedDownloadsCount
          : 0
      );
      if (payload.downloadAccess) {
        setDownloadAccess(payload.downloadAccess);
        const storedResume = getStoredDiscordResumeSession();
        if (payload.downloadAccess.authenticated && payload.downloadAccess.discordUser) {
          if (storedResume?.token) {
            saveDiscordResumeSession(
              storedResume.token,
              payload.downloadAccess.discordUser
            );
          } else {
            void resumeDiscordSession();
          }
        } else if (storedResume) {
          clearDiscordResumeSession();
        }
      }
      if (payload.discordConfig) {
        setDiscordConfig(payload.discordConfig);
      }
      setSettings({
        ...DEFAULT_STORE_SETTINGS,
        ...(payload.settings || {}),
      });
    } catch (error) {
      console.error('Gagal memuat data toko:', error);
    } finally {
      setStoreLoaded(true);
      setProductsLoading(false);
      setDownloadsLoading(false);
    }
  }, []);

  useEffect(() => {
    const cachedResume = hydrateDiscordSessionFromStorage();
    void loadPublicStore();
    if (cachedResume?.token) {
      void resumeDiscordSession();
    }
    void fetchCurrentAdmin().then((username) => {
      setAdminUsername(username);
      if (username) {
        void loadPublicStore();
      }
    });
    const unsubscribe = subscribeStoreStream(() => {
      void loadPublicStore();
    });
    return unsubscribe;
  }, [loadPublicStore]);

  useEffect(() => {
    function handleDiscordMessage(event: MessageEvent) {
      const origin = event.origin || '';
      if (
        origin !== window.location.origin &&
        !origin.endsWith('.run.app') &&
        !origin.includes('localhost')
      ) {
        return;
      }
      const data = event.data as
        | {
            type?: string;
            ok?: boolean;
            token?: string;
            error?: string;
            user?: DiscordSessionUser;
          }
        | undefined;
      if (!data || data.type !== 'DISCORD_AUTH_RESULT') return;

      setDiscordVerifying(false);
      if (data.ok && data.token) {
        setDiscordAuthError('');
        saveDiscordResumeSession(data.token, data.user ?? null);
        void persistDiscordSessionCookie().finally(() => {
          void loadPublicStore();
        });
        const uname = data.user?.username ? `@${data.user.username}` : 'Discord';
        showToast(
          data.user?.hasSubscribeRole
            ? `Terverifikasi ${uname} · Role Subscribe aktif!`
            : `Terverifikasi sebagai ${uname}.`
        );
      } else {
        setDiscordAuthError(
          data.error || 'Verifikasi Discord dibatalkan atau gagal.'
        );
      }
    }

    window.addEventListener('message', handleDiscordMessage);
    return () => window.removeEventListener('message', handleDiscordMessage);
  }, [loadPublicStore]);

  // Hidden owner access via secret URL (#studio-pemilik / ?studio=1) or Ctrl/Cmd+Shift+O
  useEffect(() => {
    function checkSecretUrlTrigger() {
      const hash = window.location.hash.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      if (
        hash === '#studio-pemilik' ||
        hash === '#owner' ||
        params.get('studio') === '1' ||
        params.get('owner') === '1'
      ) {
        setAdminOpen(true);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setAdminOpen((prev) => !prev);
      }
    }

    checkSecretUrlTrigger();
    window.addEventListener('hashchange', checkSecretUrlTrigger);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('hashchange', checkSecretUrlTrigger);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('ra_store_cart', JSON.stringify(cart));
    } catch {
      // ignore storage quota errors
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('ra_store_wishlist', JSON.stringify(wishlistIds));
    } catch {
      // ignore storage quota errors
    }
  }, [wishlistIds]);

  const displayProducts = useMemo<Product[]>(() => {
    if (settings.seededCatalogVersion === 'samp_v1') {
      return storeProducts;
    }

    const normalizedExisting = storeProducts.map((prod) => {
      const matchedTpl = READY_TO_PUBLISH_PRODUCTS.find(
        (tpl) => tpl.title.trim().toLowerCase() === prod.title.trim().toLowerCase()
      );
      const isPaketOnInHosting =
        prod.title.toLowerCase().includes('paket on') &&
        prod.category === 'Hosting SA-MP';

      return {
        ...prod,
        category: matchedTpl
          ? matchedTpl.category
          : isPaketOnInHosting
            ? ('Paket On Server SA-MP' as ProductCategory)
            : prod.category,
        imageUrl: matchedTpl ? matchedTpl.imageUrl : prod.imageUrl,
      };
    });

    const existingTitleSet = new Set(
      normalizedExisting.map((item) => item.title.trim().toLowerCase())
    );
    const missingFromCatalog: Product[] = READY_TO_PUBLISH_PRODUCTS.filter(
      (tpl) => !existingTitleSet.has(tpl.title.trim().toLowerCase())
    ).map((tpl, idx) => ({
      id: `preset_samp_${idx}`,
      title: tpl.title,
      category: tpl.category,
      price: tpl.price,
      stockStatus: tpl.stockStatus,
      description: tpl.description,
      imageUrl: tpl.imageUrl,
      variantLabel: tpl.variantLabel,
      deliveryNote: tpl.deliveryNote,
      featured: tpl.featured,
      ownerId: 'farrassamp',
      isDemo: true,
    }));

    return [...normalizedExisting, ...missingFromCatalog];
  }, [storeProducts, settings.seededCatalogVersion]);

  // Dynamic canonical URL & localized OpenGraph metadata sync
  useEffect(() => {
    const origin = window.location.origin;
    const canonicalHref = `${origin}${window.location.pathname}`;
    const heroImageUrl = `${origin}/src/assets/images/hero_amd_epyc_1795000978901.jpg`;
    const activeBrand = settings.brandName || DEFAULT_STORE_SETTINGS.brandName || 'RA STORE';

    const setAttr = (selector: string, attr: string, value: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute(attr, value);
    };

    setAttr('link[rel="canonical"]', 'href', canonicalHref);
    setAttr('link[rel="alternate"][hreflang="id-ID"]', 'href', canonicalHref);
    setAttr('link[rel="alternate"][hreflang="x-default"]', 'href', canonicalHref);
    setAttr('meta[property="og:url"]', 'content', canonicalHref);
    setAttr('meta[property="og:image"]', 'content', heroImageUrl);
    setAttr('meta[name="twitter:image"]', 'content', heroImageUrl);
    setAttr('meta[property="og:site_name"]', 'content', activeBrand);
  }, [settings.brandName]);

  const totalCartItems = cart.reduce((sum, entry) => sum + entry.qty, 0);

  const favoriteProducts = useMemo(
    () => displayProducts.filter((item) => wishlistIds.includes(item.id)),
    [displayProducts, wishlistIds]
  );

  const discordGateOpen =
    storeLoaded &&
    discordConfig.requireDiscordEntry &&
    !downloadAccess?.authenticated &&
    !isAdmin &&
    !adminOpen;

  function showToast(message: string) {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 2500);
  }

  function handleToggleFavorite(product: Product) {
    setWishlistIds((prev) => {
      const exists = prev.includes(product.id);
      if (exists) {
        showToast(`${product.title} dihapus dari Wishlist`);
        return prev.filter((id) => id !== product.id);
      }
      showToast(`${product.title} disimpan ke Wishlist`);
      return [...prev, product.id];
    });
  }

  function handleClearWishlist() {
    setWishlistIds([]);
    showToast('Wishlist berhasil dikosongkan');
  }

  function handleAddToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, qty: Math.min(99, i.qty + 1) }
            : i
        );
      }
      return [...prev, { product, qty: 1 }];
    });
    showToast(`${product.title} ditambahkan ke keranjang`);
  }

  function handleUpdateQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((entry) =>
          entry.product.id === productId
            ? { ...entry, qty: entry.qty + delta }
            : entry
        )
        .filter((entry) => entry.qty > 0)
    );
  }

  function handleRemoveCartItem(productId: string) {
    setCart((prev) => prev.filter((entry) => entry.product.id !== productId));
  }

  async function handleTrackDownload(item: YoutubeDownload) {
    try {
      const { downloadCount } = await trackYoutubeDownload(item.id);
      setStoreDownloads((prev) =>
        prev.map((d) => (d.id === item.id ? { ...d, downloadCount } : d))
      );
    } catch (error) {
      console.error('Gagal mencatat jumlah unduhan:', error);
    }
  }

  function handleCategoryShortcut(cat: ProductCategory) {
    setSelectedCatalogCategory(cat);
  }

  function handleIntroSelect(action: IntroDestinationAction) {
    setIntroOpen(false);
    if (action.type === 'category') {
      setSelectedCatalogCategory(action.category);
    }
    window.setTimeout(() => {
      document.getElementById(action.targetId)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 180);
  }

  async function handleStartDiscordVerify() {
    setDiscordAuthError('');
    setDiscordVerifying(true);
    try {
      const { url } = await fetchDiscordAuthUrl();
      const popup = window.open(
        url,
        'discord_oauth_popup',
        'width=520,height=740,menubar=no,toolbar=no,status=no'
      );
      if (!popup) {
        setDiscordVerifying(false);
        setDiscordAuthError(
          'Popup diblokir browser. Izinkan popup untuk situs ini lalu klik tombol Verifikasi dengan Discord lagi.'
        );
        return;
      }
      const watchTimer = window.setInterval(() => {
        if (popup.closed) {
          window.clearInterval(watchTimer);
          setDiscordVerifying(false);
        }
      }, 600);
    } catch (error) {
      setDiscordVerifying(false);
      setDiscordAuthError(
        error instanceof Error
          ? error.message
          : 'Gagal memulai verifikasi Discord.'
      );
    }
  }

  async function handleRecheckDiscordRole() {
    setDiscordRechecking(true);
    try {
      const res = await recheckDiscordRole();
      await loadPublicStore();
      if (res.user.hasSubscribeRole) {
        showToast('Role Subscribe terdeteksi! Pusat Unduhan berhasil dibuka.');
      } else if (!res.user.inGuild) {
        showToast('Akun Discord belum bergabung ke server Discord RA STORE.');
      } else {
        showToast('Role Subscribe belum ditemukan di akun Discord kamu.');
      }
    } catch {
      await handleStartDiscordVerify();
    } finally {
      setDiscordRechecking(false);
    }
  }

  async function handleLogoutDiscord() {
    await logoutDiscord();
    await loadPublicStore();
    showToast('Akun Discord berhasil dilepas.');
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col bg-[#090A0D] text-[#F4F4F5]">
        <DiscordEntryGateModal
          open={discordGateOpen}
          brandName={settings.brandName || DEFAULT_STORE_SETTINGS.brandName}
          heroTagline={settings.heroTagline || DEFAULT_STORE_SETTINGS.heroTagline}
          discordInviteUrl={
            settings.discordInviteUrl || 'https://discord.gg/ss2WFZK6Zg'
          }
          discordConfigured={discordConfig.configured}
          subscribeRoleId={discordConfig.subscribeRoleId}
          verifying={discordVerifying}
          authError={discordAuthError}
          onStartDiscordVerify={handleStartDiscordVerify}
          onOpenAdmin={() => setAdminOpen(true)}
        />
        <WelcomeIntroOverlay
          open={introOpen && !discordGateOpen}
          brandName={settings.brandName || DEFAULT_STORE_SETTINGS.brandName}
          heroTagline={settings.heroTagline || DEFAULT_STORE_SETTINGS.heroTagline}
          settings={settings}
          onSelectDestination={handleIntroSelect}
          onClose={() => setIntroOpen(false)}
        />
        <Header
          brandName={settings.brandName || DEFAULT_STORE_SETTINGS.brandName}
          cartCount={totalCartItems}
          wishlistCount={favoriteProducts.length}
          discordUser={downloadAccess?.discordUser}
          onLogoutDiscord={handleLogoutDiscord}
          onOpenCart={() => setCartOpen(true)}
          onOpenWishlist={() => setWishlistOpen(true)}
          onOpenAdmin={() => setAdminOpen(true)}
          isAdmin={isAdmin}
        />

        <main className="flex-1">
          <HeroSection
            announcement={settings.announcement}
            brandName={settings.brandName || DEFAULT_STORE_SETTINGS.brandName}
            heroTagline={settings.heroTagline || DEFAULT_STORE_SETTINGS.heroTagline}
            heroTitle={settings.heroTitle || DEFAULT_STORE_SETTINGS.heroTitle}
            heroSubtitle={settings.heroSubtitle || DEFAULT_STORE_SETTINGS.heroSubtitle}
            heroImageCaptionTitle={
              settings.heroImageCaptionTitle ||
              DEFAULT_STORE_SETTINGS.heroImageCaptionTitle
            }
            heroImageCaptionSubtitle={
              settings.heroImageCaptionSubtitle ||
              DEFAULT_STORE_SETTINGS.heroImageCaptionSubtitle
            }
            youtubeChannelUrl={settings.youtubeChannelUrl}
            discordInviteUrl={settings.discordInviteUrl}
            onSelectCategoryShortcut={handleCategoryShortcut}
          />

          <ProductCatalog
            products={displayProducts}
            loading={productsLoading}
            catalogEyebrow={
              settings.catalogEyebrow || DEFAULT_STORE_SETTINGS.catalogEyebrow
            }
            catalogTitle={
              settings.catalogTitle || DEFAULT_STORE_SETTINGS.catalogTitle
            }
            categoryLabels={settings}
            favoriteIds={wishlistIds}
            selectedCategory={selectedCatalogCategory}
            onSelectCategory={setSelectedCatalogCategory}
            onSelectProduct={(p) => setSelectedProduct(p)}
            onAddToCart={handleAddToCart}
            onToggleFavorite={handleToggleFavorite}
            onOpenCustomRequest={(mode) =>
              setCustomRequestModal({ open: true, mode })
            }
            onOpenAdmin={() => setAdminOpen(true)}
            isAdmin={isAdmin}
          />

          <YoutubeDownloadsSection
            downloads={storeDownloads}
            lockedDownloadsCount={lockedDownloadsCount}
            downloadAccess={downloadAccess}
            discordInviteUrl={
              settings.discordInviteUrl || 'https://discord.gg/ss2WFZK6Zg'
            }
            discordConfigured={discordConfig.configured}
            verifyingDiscord={discordVerifying}
            recheckingDiscord={discordRechecking}
            discordAuthError={discordAuthError}
            loading={downloadsLoading}
            youtubeEyebrow={
              settings.youtubeEyebrow || DEFAULT_STORE_SETTINGS.youtubeEyebrow
            }
            youtubeTitle={
              settings.youtubeTitle || DEFAULT_STORE_SETTINGS.youtubeTitle
            }
            ytTabAllLabel={
              settings.ytTabAllLabel || DEFAULT_STORE_SETTINGS.ytTabAllLabel
            }
            ytTabModLabel={
              settings.ytTabModLabel || DEFAULT_STORE_SETTINGS.ytTabModLabel
            }
            ytTabPresetLabel={
              settings.ytTabPresetLabel || DEFAULT_STORE_SETTINGS.ytTabPresetLabel
            }
            ytTabDocLabel={
              settings.ytTabDocLabel || DEFAULT_STORE_SETTINGS.ytTabDocLabel
            }
            onPlayVideo={(item) => setActiveVideoItem(item)}
            onTrackDownload={handleTrackDownload}
            onVerifyDiscord={handleStartDiscordVerify}
            onRecheckDiscordRole={handleRecheckDiscordRole}
            onOpenAdmin={() => setAdminOpen(true)}
            isAdmin={isAdmin}
          />

          <AboutAndFooter
            whatsappNumber={settings.whatsappNumber}
            youtubeChannelUrl={settings.youtubeChannelUrl}
            discordUsername={settings.discordUsername}
            discordInviteUrl={settings.discordInviteUrl}
            brandName={settings.brandName || DEFAULT_STORE_SETTINGS.brandName}
            aboutRoleLabel={
              settings.aboutRoleLabel || DEFAULT_STORE_SETTINGS.aboutRoleLabel
            }
            ownerDisplayName={
              settings.ownerDisplayName || DEFAULT_STORE_SETTINGS.ownerDisplayName
            }
            aboutDescription={
              settings.aboutDescription || DEFAULT_STORE_SETTINGS.aboutDescription
            }
            officialCardSubtitle={
              settings.officialCardSubtitle ||
              DEFAULT_STORE_SETTINGS.officialCardSubtitle
            }
            footerText={settings.footerText || DEFAULT_STORE_SETTINGS.footerText}
            isAdmin={isAdmin}
            onOpenAdmin={() => setAdminOpen(true)}
            onSecretOwnerTrigger={() => setAdminOpen(true)}
            hideFooter
          />

          <FaqSection
            whatsappNumber={settings.whatsappNumber}
            discordUsername={settings.discordUsername}
            discordInviteUrl={settings.discordInviteUrl}
          />
        </main>

        <StoreFooter
          discordInviteUrl={settings.discordInviteUrl}
          footerText={settings.footerText || DEFAULT_STORE_SETTINGS.footerText}
          isAdmin={isAdmin}
          onOpenAdmin={() => setAdminOpen(true)}
          onSecretOwnerTrigger={() => setAdminOpen(true)}
        />

        {/* Modals & Drawers */}
        <AnimatePresence>
          {selectedProduct && (
            <ProductDetailModal
              product={selectedProduct}
              categoryLabel={getCatalogCategoryLabel(selectedProduct.category, settings)}
              isFavorite={wishlistIds.includes(selectedProduct.id)}
              onToggleFavorite={handleToggleFavorite}
              onClose={() => setSelectedProduct(null)}
              onAddToCart={handleAddToCart}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activeVideoItem && (
            <YoutubePlayerModal
              item={activeVideoItem}
              categoryLabel={
                activeVideoItem.category === 'Mod & Config'
                  ? settings.ytTabModLabel || DEFAULT_STORE_SETTINGS.ytTabModLabel
                  : activeVideoItem.category === 'Preset & Editing'
                    ? settings.ytTabPresetLabel || DEFAULT_STORE_SETTINGS.ytTabPresetLabel
                    : activeVideoItem.category === 'Dokumen & Tool'
                      ? settings.ytTabDocLabel || DEFAULT_STORE_SETTINGS.ytTabDocLabel
                      : activeVideoItem.category
              }
              onClose={() => setActiveVideoItem(null)}
              onTrackDownload={handleTrackDownload}
            />
          )}
        </AnimatePresence>

        <WishlistDrawer
          open={wishlistOpen}
          items={favoriteProducts}
          categoryLabels={settings}
          onClose={() => setWishlistOpen(false)}
          onSelectProduct={(p) => setSelectedProduct(p)}
          onToggleFavorite={handleToggleFavorite}
          onAddToCart={handleAddToCart}
          onClearWishlist={handleClearWishlist}
        />

        <AnimatePresence>
          {customRequestModal.open && (
            <CustomRequestModal
              initialMode={customRequestModal.mode}
              storeWhatsapp={settings.whatsappNumber}
              onClose={() =>
                setCustomRequestModal((prev) => ({ ...prev, open: false }))
              }
              onAddToCart={handleAddToCart}
            />
          )}
        </AnimatePresence>

        <CartDrawer
          open={cartOpen}
          items={cart}
          storeWhatsapp={settings.whatsappNumber}
          onClose={() => setCartOpen(false)}
          onUpdateQty={handleUpdateQty}
          onRemoveItem={handleRemoveCartItem}
          onClearCart={() => setCart([])}
        />

        <AdminDrawer
          open={adminOpen}
          adminUsername={adminUsername}
          products={storeProducts}
          downloads={storeDownloads}
          settings={settings}
          discordConfigured={discordConfig.configured}
          onAuthChange={(username) => {
            setAdminUsername(username);
            void loadPublicStore();
          }}
          onStoreMutated={() => void loadPublicStore()}
          onClose={() => setAdminOpen(false)}
        />

        {/* Floating Back-to-Top Cue */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              type="button"
              aria-label="Kembali ke atas"
              initial={{ opacity: 0, y: 14, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.9 }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.94 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="fixed left-5 bottom-5 z-40 w-10 h-10 inline-flex items-center justify-center bg-[#111318]/90 backdrop-blur-md border border-white/[0.12] hover:border-[#DC2626]/70 text-white hover:text-[#EF4444] rounded-xl shadow-xl transition-all cursor-pointer"
            >
              <ArrowUp className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Non-blocking Cart Toast */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="fixed right-5 bottom-5 z-50 inline-flex items-center gap-2 px-4 py-3 bg-[#111318] border border-white/[0.1] text-white text-xs font-medium rounded-xl shadow-xl transition-all"
            >
              <Check className="w-4 h-4 text-[#EF4444] shrink-0" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <StorefrontApp />
    </ErrorBoundary>
  );
}
