import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowUpDown,
  ArrowUpRight,
  Check,
  ChevronDown,
  Heart,
  Package,
  Plus,
  RotateCcw,
  Search,
} from 'lucide-react';
import {
  getCatalogCategoryLabel,
  resolveProductImageUrl,
} from '../data/starterCatalog';
import { PRODUCT_CATEGORIES, Product, StoreSettings } from '../types/store';
import {
  formatIDR,
  getProductRecencyBadge,
  parseFirestoreTimestampMs,
} from '../utils/format';
import { handleSpotlightMove } from '../utils/spotlight';
import type { CustomRequestMode } from './CustomRequestModal';

type CatalogSortOption =
  | 'default'
  | 'featured'
  | 'price-asc'
  | 'price-desc'
  | 'date-desc'
  | 'date-asc';

interface ProductCatalogProps {
  products: Product[];
  loading: boolean;
  catalogEyebrow?: string;
  catalogTitle?: string;
  categoryLabels?: Partial<StoreSettings>;
  favoriteIds?: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  onOpenCustomRequest?: (mode: CustomRequestMode) => void;
  onOpenAdmin: () => void;
  isAdmin: boolean;
}

export function ProductCatalog({
  products,
  loading,
  catalogEyebrow = 'Belanja di RA STORE',
  catalogTitle = 'Katalog Produk & Jasa',
  categoryLabels,
  favoriteIds = [],
  selectedCategory,
  onSelectCategory,
  onSelectProduct,
  onAddToCart,
  onToggleFavorite,
  onOpenCustomRequest,
  onOpenAdmin,
  isAdmin,
}: ProductCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<CatalogSortOption>('default');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [retriedImages, setRetriedImages] = useState<Record<string, number>>({});
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const addedTimerRef = useRef<number | null>(null);
  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  useEffect(() => {
    setFailedImages({});
  }, [products]);

  useEffect(() => {
    return () => {
      if (addedTimerRef.current) {
        window.clearTimeout(addedTimerRef.current);
      }
    };
  }, []);

  function handleQuickAdd(product: Product) {
    onAddToCart(product);
    setRecentlyAddedId(product.id);
    if (addedTimerRef.current) {
      window.clearTimeout(addedTimerRef.current);
    }
    addedTimerRef.current = window.setTimeout(() => {
      setRecentlyAddedId(null);
    }, 950);
  }

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const indexMap = new Map<string, number>();
    products.forEach((item, index) => {
      indexMap.set(item.id, index);
    });

    const list = products.filter((item) => {
      const matchesCat =
        selectedCategory === 'Semua' ||
        (selectedCategory === '__favorit__'
          ? favoriteSet.has(item.id)
          : item.category === selectedCategory);
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        getCatalogCategoryLabel(item.category, categoryLabels)
          .toLowerCase()
          .includes(q);
      return matchesCat && matchesQuery;
    });

    const isHosting = (item: Product) => item.category === 'Hosting SA-MP';
    const getCreatedTime = (item: Product): number =>
      parseFirestoreTimestampMs(item.createdAt) ?? 0;

    if (sortBy === 'price-asc') {
      return [...list].sort(
        (a, b) => a.price - b.price || a.title.localeCompare(b.title)
      );
    }
    if (sortBy === 'price-desc') {
      return [...list].sort(
        (a, b) => b.price - a.price || a.title.localeCompare(b.title)
      );
    }
    if (sortBy === 'date-desc') {
      return [...list].sort((a, b) => {
        const diff = getCreatedTime(b) - getCreatedTime(a);
        if (diff !== 0) return diff;
        return (indexMap.get(a.id) ?? 0) - (indexMap.get(b.id) ?? 0);
      });
    }
    if (sortBy === 'date-asc') {
      return [...list].sort((a, b) => {
        const diff = getCreatedTime(a) - getCreatedTime(b);
        if (diff !== 0) return diff;
        return (indexMap.get(b.id) ?? 0) - (indexMap.get(a.id) ?? 0);
      });
    }
    if (sortBy === 'featured') {
      return [...list].sort((a, b) => {
        const featuredDiff = Number(b.featured) - Number(a.featured);
        if (featuredDiff !== 0) return featuredDiff;
        return Number(isHosting(b)) - Number(isHosting(a));
      });
    }
    return [...list].sort(
      (a, b) => Number(isHosting(b)) - Number(isHosting(a))
    );
  }, [products, selectedCategory, searchQuery, sortBy, categoryLabels, favoriteSet]);

  const hasActiveFilter =
    selectedCategory !== 'Semua' || searchQuery.trim().length > 0;

  return (
    <section id="katalog" className="scroll-mt-20 max-w-[1200px] mx-auto px-4 sm:px-6 py-16 lg:py-20">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        <div>
          <p className="text-xs font-medium text-[#EF4444] mb-1.5">
            {catalogEyebrow}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {catalogTitle}
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
          <div className="w-full sm:w-64 relative">
            <Search className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari hosting EPYC 9750, modpack..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#111318] border border-white/[0.08] rounded-xl text-white placeholder:text-[#71717A] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 transition-all"
            />
          </div>

          <div className="relative shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              aria-label="Urutkan produk"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as CatalogSortOption)}
              className="appearance-none w-full sm:w-auto pl-9 pr-9 py-2.5 text-xs font-medium bg-[#111318] border border-white/[0.08] hover:border-white/[0.18] rounded-xl text-white focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 cursor-pointer transition-all"
            >
              <option value="default" className="bg-[#111318] text-white">
                Urutan: Bawaan
              </option>
              <option value="featured" className="bg-[#111318] text-white">
                Unggulan Dulu
              </option>
              <option value="price-asc" className="bg-[#111318] text-white">
                Harga: Termurah
              </option>
              <option value="price-desc" className="bg-[#111318] text-white">
                Harga: Termahal
              </option>
              <option value="date-desc" className="bg-[#111318] text-white">
                Tanggal: Terbaru Ditambahkan
              </option>
              <option value="date-asc" className="bg-[#111318] text-white">
                Tanggal: Terlama Ditambahkan
              </option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#71717A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Unified Segmented Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div className="inline-flex items-center gap-1 p-1 bg-[#111318] border border-white/[0.08] rounded-xl overflow-x-auto max-w-full">
          {['Semua', ...PRODUCT_CATEGORIES].map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className={`relative px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active ? 'text-white' : 'text-[#A1A1AA] hover:text-white'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="catalog-active-tab"
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 bg-[#DC2626] rounded-lg shadow-[0_1px_0_0_rgba(255,255,255,0.18)_inset]"
                  />
                )}
                <span className="relative z-10">
                  {getCatalogCategoryLabel(cat, categoryLabels)}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => onSelectCategory('__favorit__')}
            className={`relative inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedCategory === '__favorit__'
                ? 'text-white'
                : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            {selectedCategory === '__favorit__' && (
              <motion.span
                layoutId="catalog-active-tab"
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 bg-[#DC2626] rounded-lg shadow-[0_1px_0_0_rgba(255,255,255,0.18)_inset]"
              />
            )}
            <Heart
              className={`relative z-10 w-3.5 h-3.5 ${
                selectedCategory === '__favorit__'
                  ? 'fill-white text-white'
                  : favoriteIds.length > 0
                    ? 'fill-[#EF4444] text-[#EF4444]'
                    : ''
              }`}
            />
            <span className="relative z-10">
              Favorit{favoriteIds.length > 0 ? ` (${favoriteIds.length})` : ''}
            </span>
          </button>
        </div>

        {onOpenCustomRequest && (
          <button
            type="button"
            onClick={() =>
              onOpenCustomRequest(
                selectedCategory === 'Modpack GTA SA-MP' ? 'modpack' : 'mapping'
              )
            }
            className="self-start sm:self-auto inline-flex items-center gap-1 text-xs font-medium text-[#A1A1AA] hover:text-[#EF4444] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Butuh Request Custom?</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          aria-busy="true"
          aria-label="Memuat produk katalog"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <motion.div
              key={n}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: n * 0.04, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#111318] border border-white/[0.08] rounded-2xl overflow-hidden flex flex-col"
            >
              <div className="aspect-[4/3] w-full skeleton-shimmer border-b border-white/[0.05]" />
              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-24 skeleton-shimmer rounded-md" />
                    <div className="h-3 w-16 skeleton-shimmer rounded-md" />
                  </div>
                  <div className="h-5 w-4/5 skeleton-shimmer rounded-lg" />
                  <div className="space-y-1.5 pt-1">
                    <div className="h-3.5 w-full skeleton-shimmer rounded-md" />
                    <div className="h-3.5 w-2/3 skeleton-shimmer rounded-md" />
                  </div>
                </div>
                <div className="pt-3.5 border-t border-white/[0.07] flex items-center justify-between gap-3">
                  <div className="h-5 w-24 skeleton-shimmer rounded-lg" />
                  <div className="h-8 w-24 skeleton-shimmer rounded-lg" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : products.length === 0 ? (
        <div className="bg-[#111318] border border-white/[0.08] rounded-2xl p-10 sm:p-14 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#DC2626]/12 border border-[#DC2626]/30 text-[#EF4444] flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <p className="font-display text-lg font-semibold text-white">
              Katalog produk masih kosong
            </p>
            <p className="text-sm text-[#A1A1AA] max-w-md mx-auto leading-relaxed">
              Produk dan layanan terbaru akan segera tersedia di katalog RA STORE.
            </p>
          </div>
          {isAdmin && (
            <div className="pt-1">
              <motion.button
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={onOpenAdmin}
                className="btn-sheen inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-xl shadow-[0_1px_0_0_rgba(255,255,255,0.18)_inset] transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Produk Sekarang</span>
              </motion.button>
            </div>
          )}
        </div>
      ) : filteredProducts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.22 }}
          className="bg-[#111318] border border-white/[0.08] rounded-2xl p-12 text-center space-y-3"
        >
          {selectedCategory === '__favorit__' && !searchQuery.trim() ? (
            <Heart className="w-8 h-8 text-[#EF4444] mx-auto" />
          ) : (
            <Package className="w-8 h-8 text-[#A1A1AA] mx-auto" />
          )}
          <div>
            <p className="font-semibold text-white">
              {selectedCategory === '__favorit__' && !searchQuery.trim()
                ? 'Wishlist Anda masih kosong'
                : 'Tidak ada produk yang sesuai'}
            </p>
            <p className="text-sm text-[#A1A1AA] mt-1">
              {selectedCategory === '__favorit__' && !searchQuery.trim()
                ? 'Tekan ikon hati pada produk mana saja untuk menyimpannya di browser ini.'
                : `Coba kata kunci lain atau pilih kategori ${getCatalogCategoryLabel('Semua', categoryLabels)}.`}
            </p>
          </div>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                onSelectCategory('Semua');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#090A0D] border border-white/[0.12] hover:border-[#DC2626]/60 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#EF4444]" />
              <span>
                Tampilkan {getCatalogCategoryLabel('Semua', categoryLabels)} Produk
              </span>
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const outOfStock = product.stockStatus === 'Habis';
            const resolvedImgUrl = resolveProductImageUrl(product.imageUrl);
            const imageErrorKey = `${product.id}::${resolvedImgUrl}`;
            const imgFailed = Boolean(failedImages[imageErrorKey]);
            const retryToken = retriedImages[imageErrorKey] || 0;
            const imgSrc =
              retryToken > 0 && resolvedImgUrl && !resolvedImgUrl.startsWith('data:')
                ? `${resolvedImgUrl}${resolvedImgUrl.includes('?') ? '&' : '?'}r=${retryToken}`
                : resolvedImgUrl;
            const hasPromo =
              typeof product.originalPrice === 'number' &&
              product.originalPrice > product.price;
            const discountPct =
              hasPromo && product.originalPrice
                ? Math.round(
                    ((product.originalPrice - product.price) /
                      product.originalPrice) *
                      100
                  )
                : 0;
            const recencyBadge = getProductRecencyBadge(product);

            return (
              <motion.article
                key={product.id}
                whileHover={{ y: -5 }}
                onMouseMove={handleSpotlightMove}
                className="spotlight-card group relative bg-[#111318] border border-white/[0.08] rounded-2xl overflow-hidden flex flex-col transition-colors duration-200 hover:border-[#DC2626]/55 hover:shadow-[0_14px_34px_-12px_rgba(220,38,38,0.28)]"
              >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[1.5px] bg-gradient-to-r from-transparent via-[#EF4444] to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center"
                  />
                  <div className="card-image-glint relative aspect-[4/3] w-full bg-[#090A0D] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => onSelectProduct(product)}
                      className="relative block w-full h-full text-left cursor-pointer"
                    >
                      {!imgFailed && resolvedImgUrl ? (
                        <>
                          {!loadedImages[imageErrorKey] && (
                            <div
                              aria-hidden="true"
                              className="absolute inset-0 skeleton-shimmer"
                            />
                          )}
                          <img
                            key={`${resolvedImgUrl}-${retryToken}`}
                            src={imgSrc}
                            alt={product.title}
                            referrerPolicy="no-referrer"
                            onLoad={() =>
                              setLoadedImages((prev) => ({
                                ...prev,
                                [imageErrorKey]: true,
                              }))
                            }
                            onError={() => {
                              if (retryToken < 1) {
                                window.setTimeout(() => {
                                  setRetriedImages((prev) => ({
                                    ...prev,
                                    [imageErrorKey]: (prev[imageErrorKey] || 0) + 1,
                                  }));
                                }, 900);
                                return;
                              }
                              setFailedImages((prev) => ({
                                ...prev,
                                [imageErrorKey]: true,
                              }));
                            }}
                            className="relative z-10 w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-300 ease-out"
                          />
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#151820]">
                          <Package className="w-8 h-8 text-[#A1A1AA] mb-2" />
                          <span className="text-xs font-medium text-[#A1A1AA] line-clamp-1">
                            {product.title}
                          </span>
                        </div>
                      )}

                      {/* Subtle hover detail cue */}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/75 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-end p-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-white translate-y-1 group-hover:translate-y-0 transition-transform duration-200">
                          <span>Lihat Detail</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-[#EF4444]" />
                        </span>
                      </div>
                    </button>

                    {recencyBadge && (
                      <span
                        className={`pointer-events-none absolute top-3 left-3 z-20 inline-flex items-center px-2.5 py-1 text-[11px] font-semibold tracking-wide rounded-lg backdrop-blur-md border shadow-sm ${
                          recencyBadge === 'Baru'
                            ? 'bg-[#090A0D]/85 border-emerald-500/50 text-emerald-300'
                            : 'bg-[#090A0D]/85 border-amber-400/50 text-amber-300'
                        }`}
                      >
                        {recencyBadge}
                      </span>
                    )}

                    {onToggleFavorite && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.07 }}
                        whileTap={{ scale: 0.82 }}
                        aria-label={
                          favoriteSet.has(product.id)
                            ? `Hapus ${product.title} dari wishlist`
                            : `Simpan ${product.title} ke wishlist`
                        }
                        aria-pressed={favoriteSet.has(product.id)}
                        onClick={() => onToggleFavorite(product)}
                        className={`absolute top-3 right-3 z-20 w-9 h-9 inline-flex items-center justify-center rounded-xl backdrop-blur-md border transition-colors cursor-pointer ${
                          favoriteSet.has(product.id)
                            ? 'bg-[#090A0D]/85 border-[#DC2626]/70 text-[#EF4444]'
                            : 'bg-[#090A0D]/70 border-white/[0.14] text-white/85 hover:text-white hover:border-[#DC2626]/60'
                        }`}
                      >
                        <motion.span
                          key={favoriteSet.has(product.id) ? 'fav' : 'unfav'}
                          initial={{ scale: 0.7 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 460, damping: 18 }}
                          className="inline-flex"
                        >
                          <Heart
                            className={`w-4 h-4 transition-colors ${
                              favoriteSet.has(product.id)
                                ? 'fill-[#EF4444] text-[#EF4444]'
                                : ''
                            }`}
                          />
                        </motion.span>
                      </motion.button>
                    )}
                  </div>

                  <div className="relative z-10 p-5 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-[#A1A1AA] mb-1.5">
                        <span>{getCatalogCategoryLabel(product.category, categoryLabels)}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={
                            outOfStock
                              ? 'text-[#EF4444] font-medium'
                              : product.stockStatus === 'Stok Terbatas'
                                ? 'text-amber-400 font-medium'
                                : 'text-white font-medium'
                          }
                        >
                          {product.stockStatus}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectProduct(product)}
                        className="text-left cursor-pointer"
                      >
                        <h3 className="text-base font-semibold text-white group-hover:text-[#EF4444] transition-colors line-clamp-1">
                          {product.title}
                        </h3>
                      </button>

                      <p className="text-sm text-[#A1A1AA] mt-1.5 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="pt-3.5 border-t border-white/[0.07] flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        {hasPromo && product.originalPrice && (
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-mono text-[11px] text-[#71717A] line-through tabular-nums">
                              {formatIDR(product.originalPrice)}
                            </span>
                            {discountPct > 0 && (
                              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-[#DC2626]/15 text-[#EF4444] rounded border border-[#DC2626]/30 tabular-nums">
                                -{discountPct}%
                              </span>
                            )}
                          </div>
                        )}
                        <span className="block font-mono text-[15px] font-medium text-white tabular-nums">
                          {formatIDR(product.price)}
                        </span>
                      </div>

                      <motion.button
                        type="button"
                        disabled={outOfStock}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => handleQuickAdd(product)}
                        className={`btn-sheen group/btn inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                          recentlyAddedId === product.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#DC2626] text-white hover:bg-[#B91C1C]'
                        }`}
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          {recentlyAddedId === product.id ? (
                            <motion.span
                              key="added"
                              initial={{ opacity: 0, scale: 0.7 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.7 }}
                              transition={{ duration: 0.15 }}
                              className="inline-flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5 shrink-0" />
                              <span>Masuk!</span>
                            </motion.span>
                          ) : (
                            <motion.span
                              key="add"
                              initial={{ opacity: 0, scale: 0.85 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.85 }}
                              transition={{ duration: 0.15 }}
                              className="inline-flex items-center gap-1.5"
                            >
                              <Plus className="w-3.5 h-3.5 shrink-0 group-hover/btn:rotate-90 transition-transform duration-200" />
                              <span>{outOfStock ? 'Habis' : 'Keranjang'}</span>
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
        </div>
      )}
    </section>
  );
}
