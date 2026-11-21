import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Check, Heart, Package, Plus, X } from 'lucide-react';
import { resolveProductImageUrl } from '../data/starterCatalog';
import { Product } from '../types/store';
import { formatIDR } from '../utils/format';

interface ProductDetailModalProps {
  product: Product | null;
  categoryLabel?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (product: Product) => void;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export function ProductDetailModal({
  product,
  categoryLabel,
  isFavorite = false,
  onToggleFavorite,
  onClose,
  onAddToCart,
}: ProductDetailModalProps) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [product?.id, product?.imageUrl]);

  if (!product) return null;

  const outOfStock = product.stockStatus === 'Habis';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdp-title"
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="bg-[#111318] border border-white/[0.1] rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
          <p className="text-xs font-medium text-[#9CA3AF]">
            Detail Produk · {categoryLabel || product.category}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail produk"
            className="w-9 h-9 inline-flex items-center justify-center rounded-xl text-[#9CA3AF] hover:text-white hover:bg-white/[0.06] cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="bg-[#090A0D] aspect-[4/3] md:aspect-auto md:min-h-[340px]">
            {!imgFailed ? (
              <img
                src={resolveProductImageUrl(product.imageUrl)}
                alt={product.title}
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                <Package className="w-10 h-10 text-[#9CA3AF] mb-2" />
                <span className="text-sm text-[#9CA3AF]">{product.title}</span>
              </div>
            )}
          </div>

          <div className="p-6 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#9CA3AF] mb-1.5">
                  <span>{categoryLabel || product.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-[#F5F5F7]">
                    {product.stockStatus}
                  </span>
                </div>
                <h2
                  id="pdp-title"
                  className="font-display text-2xl font-bold text-[#F5F5F7] tracking-tight"
                >
                  {product.title}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2.5">
                  <p className="font-mono text-xl font-semibold text-[#EF4444] tabular-nums">
                    {formatIDR(product.price)}
                  </p>
                  {typeof product.originalPrice === 'number' &&
                    product.originalPrice > product.price && (
                      <>
                        <span className="font-mono text-sm text-[#71717A] line-through tabular-nums">
                          {formatIDR(product.originalPrice)}
                        </span>
                        <span className="font-mono text-xs font-semibold text-[#EF4444] bg-[#DC2626]/15 border border-[#DC2626]/35 px-2 py-0.5 rounded-md">
                          Hemat{' '}
                          {Math.round(
                            ((product.originalPrice - product.price) /
                              product.originalPrice) *
                              100
                          )}
                          %
                        </span>
                      </>
                    )}
                </div>
              </div>

              <p className="text-sm text-[#9CA3AF] leading-relaxed whitespace-pre-line">
                {product.description}
              </p>

              {(product.variantLabel || product.deliveryNote) && (
                <div className="pt-3 border-t border-white/[0.08] space-y-2 text-xs text-[#9CA3AF]">
                  {product.variantLabel && (
                    <div className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#EF4444] shrink-0 mt-0.5" />
                      <span>Varian: {product.variantLabel}</span>
                    </div>
                  )}
                  {product.deliveryNote && (
                    <div className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#EF4444] shrink-0 mt-0.5" />
                      <span>{product.deliveryNote}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5 pt-4 border-t border-white/[0.08]">
              {onToggleFavorite && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  aria-label={isFavorite ? 'Hapus dari wishlist' : 'Simpan ke wishlist'}
                  aria-pressed={isFavorite}
                  onClick={() => onToggleFavorite(product)}
                  className={`inline-flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium rounded-xl border transition-colors cursor-pointer shrink-0 ${
                    isFavorite
                      ? 'bg-[#DC2626]/15 border-[#DC2626]/65 text-[#EF4444]'
                      : 'bg-[#090A0D] border-white/[0.12] hover:border-[#DC2626]/60 text-white'
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isFavorite ? 'fill-[#EF4444] text-[#EF4444]' : ''
                    }`}
                  />
                  <span>{isFavorite ? 'Difavoritkan' : 'Favorit'}</span>
                </motion.button>
              )}

              <button
                type="button"
                disabled={outOfStock}
                onClick={() => {
                  onAddToCart(product);
                  onClose();
                }}
                className="btn-sheen flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span>{outOfStock ? 'Stok Habis' : 'Tambah ke Keranjang'}</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
