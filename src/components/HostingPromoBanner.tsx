import { motion } from 'motion/react';
import { ArrowUpRight, Tag, X } from 'lucide-react';
import { Product } from '../types/store';
import { formatIDR } from '../utils/format';

interface HostingPromoBannerProps {
  hostingProducts: Product[];
  onViewHosting: () => void;
  onDismiss: () => void;
}

export function HostingPromoBanner({
  hostingProducts,
  onViewHosting,
  onDismiss,
}: HostingPromoBannerProps) {
  const discountedHosting = hostingProducts.filter(
    (item) =>
      typeof item.originalPrice === 'number' && item.originalPrice > item.price
  );

  const maxDiscountPct = discountedHosting.reduce((max, item) => {
    if (!item.originalPrice || item.originalPrice <= item.price) return max;
    const pct = Math.round(
      ((item.originalPrice - item.price) / item.originalPrice) * 100
    );
    return Math.max(max, pct);
  }, 0);

  const lowestHostingPrice = hostingProducts.reduce<number | null>(
    (min, item) => (min === null ? item.price : Math.min(min, item.price)),
    null
  );

  return (
    <motion.aside
      role="region"
      aria-label="Penawaran Terbatas Hosting SA-MP"
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.98 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-3.5 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 sm:w-[min(92vw,680px)]"
    >
      <div className="relative overflow-hidden bg-[#111318]/95 backdrop-blur-md border border-[#DC2626]/40 rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 shadow-[0_20px_50px_-14px_rgba(0,0,0,0.88)] flex items-center justify-between gap-3 sm:gap-4">
        {/* Crisp top crimson highlight hairline */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#EF4444]/85 to-transparent"
        />

        <div className="flex items-center gap-3 min-w-0">
          <div className="hidden sm:flex w-9 h-9 rounded-xl bg-[#DC2626]/14 border border-[#DC2626]/35 text-[#EF4444] items-center justify-center shrink-0">
            <Tag className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#EF4444]">
              <span>Limited Time Offer</span>
              {maxDiscountPct > 0 && (
                <>
                  <span aria-hidden="true" className="text-white/25">
                    ·
                  </span>
                  <span className="font-mono tabular-nums text-white">
                    Hemat hingga {maxDiscountPct}%
                  </span>
                </>
              )}
            </div>
            <p className="text-xs sm:text-[13px] text-[#F4F4F5] font-medium truncate mt-0.5">
              {discountedHosting.length > 0
                ? `${discountedHosting.length} paket Hosting SA-MP lagi diskon spesial AMD EPYC 9750.`
                : lowestHostingPrice !== null
                  ? `Diskon paket Hosting SA-MP AMD EPYC 9750 — mulai ${formatIDR(lowestHostingPrice)}.`
                  : 'Diskon spesial paket Hosting SA-MP AMD EPYC 9750 sedang berlangsung.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={onViewHosting}
            className="btn-sheen inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-xl shadow-[0_1px_0_0_rgba(255,255,255,0.18)_inset] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Lihat Hosting</span>
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
          </motion.button>

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Tutup banner promo"
            className="w-8 h-8 inline-flex items-center justify-center rounded-xl text-[#A1A1AA] hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
