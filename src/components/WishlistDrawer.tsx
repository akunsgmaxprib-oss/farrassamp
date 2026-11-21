import { AnimatePresence, motion } from 'motion/react';
import { Heart, Package, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import {
  getCatalogCategoryLabel,
  resolveProductImageUrl,
} from '../data/starterCatalog';
import { Product, StoreSettings } from '../types/store';
import { formatIDR } from '../utils/format';

interface WishlistDrawerProps {
  open: boolean;
  items: Product[];
  categoryLabels?: Partial<StoreSettings>;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  onToggleFavorite: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onClearWishlist: () => void;
}

export function WishlistDrawer({
  open,
  items,
  categoryLabels,
  onClose,
  onSelectProduct,
  onToggleFavorite,
  onAddToCart,
  onClearWishlist,
}: WishlistDrawerProps) {
  const availableItems = items.filter((item) => item.stockStatus !== 'Habis');

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex justify-end"
          onClick={onClose}
        >
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Wishlist Produk Favorit"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md bg-[#111318] h-full flex flex-col border-l border-white/[0.1] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#DC2626]/15 border border-[#DC2626]/35 flex items-center justify-center text-[#EF4444]">
                  <Heart className="w-4 h-4 fill-[#EF4444]" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-[#F5F5F7] tracking-tight">
                    Wishlist Favorit
                  </h2>
                  <p className="text-xs text-[#9CA3AF]">
                    {items.length} produk tersimpan di browser ini
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup wishlist"
                className="w-9 h-9 inline-flex items-center justify-center rounded-xl text-[#9CA3AF] hover:text-white hover:bg-white/[0.06] cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.length === 0 ? (
                <div className="py-16 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#090A0D] border border-white/[0.08] flex items-center justify-center mx-auto text-[#71717A]">
                    <Heart className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-white">
                      Belum ada produk favorit
                    </p>
                    <p className="text-xs text-[#A1A1AA] max-w-xs mx-auto leading-relaxed">
                      Tekan ikon hati pada produk di katalog untuk menyimpannya
                      sebagai favorit Anda.
                    </p>
                  </div>
                  <a
                    href="#katalog"
                    onClick={onClose}
                    className="btn-sheen inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-xl transition-colors"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Jelajahi Katalog</span>
                  </a>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map((product) => {
                    const outOfStock = product.stockStatus === 'Habis';
                    const resolvedImgUrl = resolveProductImageUrl(product.imageUrl);

                    return (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 24 }}
                        transition={{ duration: 0.2 }}
                        className="bg-[#090A0D] border border-white/[0.08] hover:border-[#DC2626]/40 rounded-xl p-3.5 flex gap-3.5 transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectProduct(product);
                          }}
                          className="w-20 aspect-[4/3] rounded-lg overflow-hidden bg-[#151820] shrink-0 cursor-pointer border border-white/[0.06]"
                        >
                          {resolvedImgUrl ? (
                            <img
                              src={resolvedImgUrl}
                              alt={product.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#71717A]">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                        </button>

                        <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                          <div>
                            <p className="text-[11px] text-[#A1A1AA] truncate">
                              {getCatalogCategoryLabel(product.category, categoryLabels)}
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onSelectProduct(product);
                              }}
                              className="text-left cursor-pointer"
                            >
                              <h3 className="text-sm font-semibold text-white hover:text-[#EF4444] transition-colors truncate">
                                {product.title}
                              </h3>
                            </button>
                            <p className="font-mono text-xs font-medium text-[#EF4444] tabular-nums mt-0.5">
                              {formatIDR(product.price)}
                            </p>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              disabled={outOfStock}
                              onClick={() => onAddToCart(product)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-3 h-3" />
                              <span>{outOfStock ? 'Habis' : 'Keranjang'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onToggleFavorite(product)}
                              aria-label={`Hapus ${product.title} dari wishlist`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-[#A1A1AA] hover:text-[#EF4444] hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 border-t border-white/[0.08] bg-[#0B0D11] space-y-2.5">
                {availableItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      availableItems.forEach((prod) => onAddToCart(prod));
                      onClose();
                    }}
                    className="btn-sheen w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-xl shadow-[0_1px_0_0_rgba(255,255,255,0.18)_inset] transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      Masukkan Semua ke Keranjang ({availableItems.length})
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClearWishlist}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-[#A1A1AA] hover:text-white bg-[#111318] border border-white/[0.08] hover:border-white/[0.2] rounded-xl transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kosongkan Wishlist</span>
                </button>
              </div>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
