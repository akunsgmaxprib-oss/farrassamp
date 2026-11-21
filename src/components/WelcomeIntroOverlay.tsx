import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Code2,
  Gamepad2,
  Layers,
  LayoutGrid,
  Map,
  MessageCircle,
  Play,
  Server,
  X,
} from 'lucide-react';
import {
  getCatalogCategoryLabel,
  STORE_LOGO_PATH,
} from '../data/starterCatalog';
import { StoreSettings } from '../types/store';
import { handleSpotlightMove } from '../utils/spotlight';

export type IntroDestinationAction =
  | { type: 'category'; category: string; targetId: 'katalog' }
  | { type: 'section'; targetId: 'top' | 'unduhan-yt' | 'tentang' };

interface WelcomeIntroOverlayProps {
  open: boolean;
  brandName?: string;
  heroTagline?: string;
  settings: Partial<StoreSettings>;
  onSelectDestination: (action: IntroDestinationAction) => void;
  onClose: () => void;
}

export function WelcomeIntroOverlay({
  open,
  brandName = 'RA STORE',
  heroTagline = 'Farrassamp Official',
  settings,
  onSelectDestination,
  onClose,
}: WelcomeIntroOverlayProps) {
  const [showChoices, setShowChoices] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    setShowChoices(false);
    const timer = window.setTimeout(() => {
      setShowChoices(true);
    }, 850);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCloseRef.current();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const featuredDestinations: Array<{
    id: string;
    title: string;
    subtitle: string;
    icon: typeof LayoutGrid;
    action: IntroDestinationAction;
  }> = [
    {
      id: 'hosting',
      title: getCatalogCategoryLabel('Hosting SA-MP', settings),
      subtitle: 'Server AMD EPYC 9750, NVMe & proteksi Anti-DDoS',
      icon: Server,
      action: {
        type: 'category',
        category: 'Hosting SA-MP',
        targetId: 'katalog',
      },
    },
    {
      id: 'youtube',
      title: settings.youtubeTitle || 'Share File YouTube',
      subtitle: 'Arsip mod, config, preset & video @Farrassamp',
      icon: Play,
      action: { type: 'section', targetId: 'unduhan-yt' },
    },
  ];

  const secondaryDestinations: Array<{
    id: string;
    title: string;
    subtitle: string;
    icon: typeof LayoutGrid;
    action: IntroDestinationAction;
  }> = [
    {
      id: 'all',
      title: `${getCatalogCategoryLabel('Semua', settings)} Produk`,
      subtitle: 'Lihat seluruh katalog & layanan toko',
      icon: LayoutGrid,
      action: { type: 'category', category: 'Semua', targetId: 'katalog' },
    },
    {
      id: 'paketon',
      title: getCatalogCategoryLabel('Paket On Server SA-MP', settings),
      subtitle: 'Paket On Inferno & LRP siap pakai',
      icon: Layers,
      action: {
        type: 'category',
        category: 'Paket On Server SA-MP',
        targetId: 'katalog',
      },
    },
    {
      id: 'modpack',
      title: getCatalogCategoryLabel('Modpack GTA SA-MP', settings),
      subtitle: 'Modpack Low, Medium, High & Request',
      icon: Gamepad2,
      action: {
        type: 'category',
        category: 'Modpack GTA SA-MP',
        targetId: 'katalog',
      },
    },
    {
      id: 'developer',
      title: getCatalogCategoryLabel('Jasa Developer', settings),
      subtitle: 'Fix bug, pasang FS & bikin fitur',
      icon: Code2,
      action: {
        type: 'category',
        category: 'Jasa Developer',
        targetId: 'katalog',
      },
    },
    {
      id: 'jasasamp',
      title: getCatalogCategoryLabel('Jasa SA-MP', settings),
      subtitle: 'Jasa mapping & setup server SA-MP',
      icon: Map,
      action: {
        type: 'category',
        category: 'Jasa SA-MP',
        targetId: 'katalog',
      },
    },
    {
      id: 'about',
      title: 'Kontak & Tentang Store',
      subtitle: 'WhatsApp resmi, Discord & FAQ',
      icon: MessageCircle,
      action: { type: 'section', targetId: 'tentang' },
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`Selamat datang di ${brandName}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 bg-[#090A0D]/95 backdrop-blur-xl overflow-y-auto flex items-center justify-center p-4 sm:p-6"
        >
          {/* Architectural Grid & Crimson Radial Studio Light */}
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 bg-architectural-grid opacity-75"
          />
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_65%_50%_at_50%_22%,rgba(220,38,38,0.22),transparent_70%)]"
          />

          {/* Top-right Skip button */}
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={onClose}
            aria-label="Lewati intro dan masuk ke beranda"
            className="fixed top-4 right-4 sm:top-6 sm:right-6 z-20 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#A1A1AA] hover:text-white bg-[#111318]/80 border border-white/[0.1] hover:border-white/[0.22] rounded-xl transition-colors cursor-pointer"
          >
            <span>Lewati</span>
            <X className="w-3.5 h-3.5" />
          </motion.button>

          <div className="relative z-10 w-full max-w-[960px] my-auto py-6 flex flex-col items-center">
            {/* Phase 1: Animated Logo Emblem + Store Title */}
            <motion.div
              layout
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center"
            >
              <div className="relative">
                {/* Expanding crimson halo ring on reveal */}
                <motion.div
                  aria-hidden="true"
                  initial={{ opacity: 0.7, scale: 0.75 }}
                  animate={{ opacity: 0, scale: 1.55 }}
                  transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
                  className="pointer-events-none absolute inset-0 rounded-3xl border border-[#EF4444]/70"
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.55, rotate: -8 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 20,
                  }}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-[#111318] border border-[#DC2626]/70 shadow-[0_0_45px_-8px_rgba(220,38,38,0.55)] flex items-center justify-center"
                >
                  {!logoFailed ? (
                    <img
                      src={STORE_LOGO_PATH}
                      alt={`Logo ${brandName}`}
                      referrerPolicy="no-referrer"
                      onError={() => setLogoFailed(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Server className="w-9 h-9 text-[#EF4444]" />
                  )}
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="mt-4 space-y-1"
              >
                <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#EF4444]">
                  {heroTagline}
                </p>
                <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
                  {brandName}
                </h1>
              </motion.div>
            </motion.div>

            {/* Phase 2: Quick Destination Chooser */}
            <AnimatePresence>
              {showChoices && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full mt-7 sm:mt-8 space-y-4"
                >
                  <div className="text-center space-y-1">
                    <h2 className="font-display text-lg sm:text-xl font-semibold text-white">
                      Mau langsung menuju layanan yang mana?
                    </h2>
                    <p className="text-xs sm:text-sm text-[#A1A1AA]">
                      Pilih tujuan utama di atas atau telusuri kategori lainnya di bawah.
                    </p>
                  </div>

                  {/* Top Featured Row: Hosting SA-MP & Share File YouTube */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {featuredDestinations.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <motion.button
                          key={item.id}
                          type="button"
                          initial={{ opacity: 0, y: 14, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{
                            duration: 0.28,
                            delay: idx * 0.05,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          whileHover={{ y: -4 }}
                          whileTap={{ scale: 0.98 }}
                          onMouseMove={handleSpotlightMove}
                          onClick={() => onSelectDestination(item.action)}
                          className="spotlight-card group text-left bg-[#14171F]/95 hover:bg-[#191D28] rounded-xl p-4 sm:p-5 border border-[#DC2626]/55 hover:border-[#EF4444] shadow-[0_10px_28px_-14px_rgba(220,38,38,0.4)] transition-colors flex items-center justify-between gap-4 cursor-pointer overflow-hidden"
                        >
                          <div className="relative z-10 flex items-center gap-3.5 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-[#DC2626]/20 border border-[#DC2626]/50 text-[#EF4444] flex items-center justify-center shrink-0">
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm sm:text-base font-semibold text-white group-hover:text-[#EF4444] transition-colors truncate">
                                {item.title}
                              </p>
                              <p className="text-xs text-[#A1A1AA] mt-0.5 line-clamp-1">
                                {item.subtitle}
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="relative z-10 w-4 h-4 text-[#EF4444] shrink-0 group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Secondary 3x2 Grid for All Products, Paket On, Modpack, Jasa & Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {secondaryDestinations.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <motion.button
                          key={item.id}
                          type="button"
                          initial={{ opacity: 0, y: 14, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{
                            duration: 0.28,
                            delay: 0.1 + idx * 0.04,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          whileHover={{ y: -4 }}
                          whileTap={{ scale: 0.97 }}
                          onMouseMove={handleSpotlightMove}
                          onClick={() => onSelectDestination(item.action)}
                          className="spotlight-card group text-left bg-[#111318]/90 hover:bg-[#151821] rounded-xl p-4 border border-white/[0.08] hover:border-[#DC2626]/55 transition-colors flex flex-col justify-between gap-2.5 cursor-pointer overflow-hidden"
                        >
                          <div className="relative z-10 flex items-center justify-between gap-2">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center border bg-[#090A0D] border-white/[0.08] text-[#A1A1AA] group-hover:text-[#EF4444] group-hover:border-[#DC2626]/40 transition-colors">
                              <Icon className="w-4 h-4" />
                            </div>
                            <ArrowRight className="w-4 h-4 text-[#71717A] group-hover:text-[#EF4444] group-hover:translate-x-0.5 transition-all" />
                          </div>

                          <div className="relative z-10">
                            <p className="text-sm font-semibold text-white group-hover:text-[#EF4444] transition-colors line-clamp-1">
                              {item.title}
                            </p>
                            <p className="text-xs text-[#A1A1AA] mt-0.5 line-clamp-1">
                              {item.subtitle}
                            </p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  <div className="pt-1 flex justify-center">
                    <motion.button
                      type="button"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() =>
                        onSelectDestination({ type: 'section', targetId: 'top' })
                      }
                      className="btn-sheen inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-xl shadow-[0_1px_0_0_rgba(255,255,255,0.18)_inset] transition-colors cursor-pointer"
                    >
                      <span>Masuk ke Halaman Utama Store</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
