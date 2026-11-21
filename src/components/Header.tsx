import { useState } from 'react';
import { AnimatePresence, motion, useScroll, useSpring } from 'motion/react';
import { CheckCircle2, Heart, LogOut, Menu, ShoppingBag, X } from 'lucide-react';
import { DiscordSessionUser } from '../types/store';

interface HeaderProps {
  brandName?: string;
  cartCount: number;
  wishlistCount?: number;
  discordUser?: DiscordSessionUser | null;
  onLogoutDiscord?: () => void;
  onOpenCart: () => void;
  onOpenWishlist?: () => void;
  onOpenAdmin: () => void;
  isAdmin: boolean;
}

export function Header({
  brandName = 'RA STORE',
  cartCount,
  wishlistCount = 0,
  discordUser,
  onLogoutDiscord,
  onOpenCart,
  onOpenWishlist,
  onOpenAdmin,
  isAdmin,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 260,
    damping: 32,
    restDelta: 0.001,
  });

  return (
    <header className="sticky top-0 z-40 bg-[#090A0D]/80 backdrop-blur-md border-b border-white/[0.08]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <motion.a
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          href="#top"
          className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#DC2626] rounded hover:text-[#EF4444] transition-colors"
        >
          {brandName}
        </motion.a>

        {/* Zone 2: Clean single-line text nav links with animated underline */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#A1A1AA]">
          <a
            href="#katalog"
            className="group relative py-1 hover:text-white transition-colors duration-150 whitespace-nowrap shrink-0"
          >
            <span>Katalog</span>
            <span
              aria-hidden="true"
              className="absolute inset-x-0 -bottom-0.5 h-[1.5px] bg-[#EF4444] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-200"
            />
          </a>
          <a
            href="#unduhan-yt"
            className="group relative py-1 hover:text-white transition-colors duration-150 whitespace-nowrap shrink-0"
          >
            <span>Unduhan YT</span>
            <span
              aria-hidden="true"
              className="absolute inset-x-0 -bottom-0.5 h-[1.5px] bg-[#EF4444] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-200"
            />
          </a>
          <a
            href="#tentang"
            className="group relative py-1 hover:text-white transition-colors duration-150 whitespace-nowrap shrink-0"
          >
            <span>Tentang</span>
            <span
              aria-hidden="true"
              className="absolute inset-x-0 -bottom-0.5 h-[1.5px] bg-[#EF4444] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-200"
            />
          </a>
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="group relative py-1 text-[#EF4444] hover:text-white transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Studio Pemilik</span>
              <span
                aria-hidden="true"
                className="absolute inset-x-0 -bottom-0.5 h-[1.5px] bg-white scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-200"
              />
            </button>
          )}
        </nav>

        {/* Zone 3: Discord Status + Wishlist + Primary Cart Action */}
        <div className="flex items-center gap-2 shrink-0">
          {discordUser && (
            <div className="hidden sm:inline-flex items-center gap-2 pl-2.5 pr-1.5 py-1 bg-[#111318] border border-white/[0.1] rounded-lg text-xs">
              {discordUser.avatarUrl ? (
                <img
                  src={discordUser.avatarUrl}
                  alt={discordUser.username}
                  referrerPolicy="no-referrer"
                  className="w-5 h-5 rounded-full object-cover shrink-0"
                />
              ) : (
                <span className="w-2 h-2 rounded-full bg-[#5865F2] shrink-0" />
              )}
              <span className="text-white font-medium max-w-[110px] truncate">
                @{discordUser.username}
              </span>
              {discordUser.hasSubscribeRole && (
                <span title="Role Subscribe Terverifikasi">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </span>
              )}
              {onLogoutDiscord && (
                <button
                  type="button"
                  onClick={onLogoutDiscord}
                  title="Keluar akun Discord"
                  aria-label="Keluar akun Discord"
                  className="p-1 text-[#71717A] hover:text-[#EF4444] rounded transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {onOpenWishlist && (
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.94 }}
              onClick={onOpenWishlist}
              aria-label={`Buka Wishlist (${wishlistCount} produk)`}
              className="relative inline-flex items-center justify-center w-10 h-10 bg-[#111318] border border-white/[0.1] hover:border-[#DC2626]/60 text-white rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  wishlistCount > 0 ? 'fill-[#EF4444] text-[#EF4444]' : 'text-[#A1A1AA]'
                }`}
              />
              {wishlistCount > 0 && (
                <motion.span
                  key={wishlistCount}
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                  className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-[#DC2626] text-[10px] font-mono font-semibold text-white tabular-nums shadow"
                >
                  {wishlistCount}
                </motion.span>
              )}
            </motion.button>
          )}

          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenCart}
            className="btn-sheen inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg shadow-[0_1px_0_0_rgba(255,255,255,0.18)_inset] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer min-h-[40px]"
          >
            <motion.span
              key={`bag-${cartCount}`}
              initial={cartCount > 0 ? { rotate: -14, scale: 1.15 } : false}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 420, damping: 16 }}
              className="inline-flex"
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
            </motion.span>
            <span>Keranjang</span>
            <motion.span
              key={cartCount}
              initial={{ scale: 0.72 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 450, damping: 22 }}
              className="font-mono text-xs tabular-nums bg-black/30 px-1.5 py-0.5 rounded"
            >
              {cartCount}
            </motion.span>
          </motion.button>

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 text-white hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Dynamic Crimson Scroll Progress Indicator */}
      <motion.div
        aria-hidden="true"
        style={{ scaleX }}
        className="absolute bottom-0 left-0 right-0 h-[2px] origin-left bg-gradient-to-r from-[#991B1B] via-[#EF4444] to-[#DC2626] pointer-events-none"
      />

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden border-t border-white/[0.08] bg-[#090A0D] px-4 py-3 flex flex-col gap-1"
          >
            <a
              href="#katalog"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-3 text-sm font-medium text-white rounded-lg hover:bg-white/[0.06]"
            >
              Katalog
            </a>
            <a
              href="#unduhan-yt"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-3 text-sm font-medium text-white rounded-lg hover:bg-white/[0.06]"
            >
              Unduhan YT
            </a>
            <a
              href="#tentang"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-3 text-sm font-medium text-white rounded-lg hover:bg-white/[0.06]"
            >
              Tentang
            </a>
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdmin();
                }}
                className="py-2.5 px-3 text-left text-sm font-medium text-[#EF4444] rounded-lg hover:bg-white/[0.06] cursor-pointer"
              >
                Studio Pemilik
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
