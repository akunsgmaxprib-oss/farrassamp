import { useRef, useState, type MouseEvent } from 'react';
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import { ArrowDownRight, ArrowUpRight, Play, ShoppingBag, X } from 'lucide-react';
import { HERO_EPYC_PATH, STORE_LOGO_PATH } from '../data/starterCatalog';
import { ProductCategory } from '../types/store';
import { handleSpotlightMove } from '../utils/spotlight';

interface HeroSectionProps {
  announcement?: string;
  brandName?: string;
  heroTagline?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImageCaptionTitle?: string;
  heroImageCaptionSubtitle?: string;
  youtubeChannelUrl: string;
  discordInviteUrl?: string;
  onSelectCategoryShortcut: (category: ProductCategory) => void;
}

const SERVICE_PILLARS: { num: string; title: string; subtitle: string; category: ProductCategory }[] = [
  {
    num: '01',
    title: 'Hosting AMD EPYC 9750',
    subtitle: 'NVMe SSD & proteksi Anti-DDoS',
    category: 'Hosting SA-MP',
  },
  {
    num: '02',
    title: 'Modpack GTA SA-MP',
    subtitle: 'Optimasi grafis PC & Android',
    category: 'Modpack GTA SA-MP',
  },
  {
    num: '03',
    title: 'Jasa Developer & SA-MP',
    subtitle: 'Gamemode, MySQL & setup server',
    category: 'Jasa Developer',
  },
  {
    num: '04',
    title: 'Review & Live Streaming',
    subtitle: 'Promosi langsung di YouTube',
    category: 'Review & Streaming',
  },
];

export function HeroSection({
  announcement,
  brandName = 'RA STORE',
  heroTagline = 'Farrassamp Official',
  heroTitle = 'Hosting SA-MP EPYC 9750, Modpack & Arsip File YouTube.',
  heroSubtitle = 'Platform resmi Farrassamp untuk pemesanan hosting AMD EPYC 9750, modpack GTA SA-MP, jasa developer & setup server, hingga review streaming—dilengkapi pusat unduhan file langsung dari video YouTube.',
  heroImageCaptionTitle = 'AMD EPYC 9750 Infrastructure',
  heroImageCaptionSubtitle = 'Performa server stabil untuk komunitas GTA SA-MP',
  youtubeChannelUrl,
  discordInviteUrl,
  onSelectCategoryShortcut,
}: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  // Scroll-linked subtle parallax depth on the Hero showcase
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const showcaseParallaxY = useTransform(scrollYProgress, [0, 1], [0, 34]);

  // Subtle GPU-driven 3D pointer tilt on the AMD EPYC showcase card
  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);
  const smoothX = useSpring(pointerX, { stiffness: 180, damping: 24 });
  const smoothY = useSpring(pointerY, { stiffness: 180, damping: 24 });
  const rotateY = useTransform(smoothX, [0, 1], [-3.5, 3.5]);
  const rotateX = useTransform(smoothY, [0, 1], [3.5, -3.5]);

  const titleWords = heroTitle.trim().split(/\s+/).filter(Boolean);

  function handleHeroCardMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    pointerX.set(x);
    pointerY.set(y);
    handleSpotlightMove(e);
  }

  function handleHeroCardLeave() {
    pointerX.set(0.5);
    pointerY.set(0.5);
  }

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative overflow-hidden bg-[#090A0D] border-b border-white/[0.08]"
    >
      {/* Drifting architectural grid & ambient crimson studio light */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-12 bg-architectural-grid opacity-70 kinetic-grid-drift"
      />
      <motion.div
        aria-hidden="true"
        animate={{ opacity: [0.65, 1, 0.65], scale: [1, 1.06, 1], x: [-20, 20, -20] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(ellipse_75%_55%_at_50%_-15%,rgba(220,38,38,0.22),transparent)]"
      />

      {announcement && !bannerDismissed && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="relative z-10 bg-[#991B1B] text-white px-4 py-2 text-xs"
        >
          <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4">
            <p className="truncate">{announcement}</p>
            <button
              type="button"
              onClick={() => setBannerDismissed(true)}
              aria-label="Tutup pengumuman"
              className="text-white/80 hover:text-white shrink-0 cursor-pointer p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 pt-12 pb-10 lg:pt-16 lg:pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Left Content Column */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-8">
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-3.5"
              >
                {!logoFailed && (
                  <motion.img
                    whileHover={{ scale: 1.08, rotate: -3 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                    src={STORE_LOGO_PATH}
                    alt="Logo RA STORE"
                    referrerPolicy="no-referrer"
                    onError={() => setLogoFailed(true)}
                    className="w-11 h-11 rounded-xl object-cover border border-[#DC2626]/50 shadow-sm shrink-0"
                  />
                )}
                <div className="text-xs text-[#A1A1AA]">
                  <span className="font-semibold text-white">{brandName}</span>
                  <span className="mx-2 text-white/25" aria-hidden="true">/</span>
                  <span>{heroTagline}</span>
                </div>
              </motion.div>

              <h1 className="font-display text-[clamp(2.25rem,4.1vw,3.5rem)] font-bold leading-[1.06] tracking-[-0.025em] text-white text-balance">
                {titleWords.map((word, idx) => (
                  <span
                    key={`${word}-${idx}`}
                    className="inline-block overflow-hidden align-bottom mr-[0.26em] last:mr-0"
                  >
                    <motion.span
                      className="inline-block"
                      initial={{ y: '105%', opacity: 0 }}
                      animate={{ y: '0%', opacity: 1 }}
                      transition={{
                        duration: 0.44,
                        delay: 0.04 + Math.min(idx, 10) * 0.032,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      {word}
                    </motion.span>
                  </span>
                ))}
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="text-[15px] sm:text-base text-[#A1A1AA] leading-relaxed max-w-xl"
              >
                {heroSubtitle}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-wrap items-center gap-5 pt-1"
              >
                <motion.a
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  href="#katalog"
                  className="btn-sheen inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-xl shadow-[0_1px_0_0_rgba(255,255,255,0.18)_inset] transition-colors duration-150 whitespace-nowrap shrink-0"
                >
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <span>Jelajahi Katalog</span>
                </motion.a>

                <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-[#A1A1AA]">
                  <a
                    href="#unduhan-yt"
                    className="group inline-flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Pusat Unduhan</span>
                    <ArrowDownRight className="w-3.5 h-3.5 text-[#EF4444] group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform" />
                  </a>
                  {discordInviteUrl && (
                    <a
                      href={discordInviteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>Discord</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#EF4444] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>
                  )}
                  <a
                    href={youtubeChannelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 text-[#EF4444]" />
                    <span>@Farrassamp</span>
                  </a>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Right Media Column: Parallax, Breathing Crimson Halo, 3D Tilt & Specular Beam */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            style={{ perspective: 1000, y: showcaseParallaxY }}
            className="relative lg:col-span-6"
          >
            {/* Breathing crimson backlight aura behind hero media */}
            <div
              aria-hidden="true"
              className="pointer-events-none red-halo-breathe absolute -inset-4 rounded-3xl bg-[radial-gradient(circle_at_60%_40%,rgba(220,38,38,0.22),transparent_68%)] blur-2xl"
            />

            <motion.div
              style={{ rotateX, rotateY }}
              onMouseMove={handleHeroCardMove}
              onMouseLeave={handleHeroCardLeave}
              className="spotlight-card hero-beam group relative h-full min-h-[280px] lg:min-h-[420px] rounded-2xl overflow-hidden bg-[#111318] border border-white/[0.1] hover:border-[#DC2626]/55 transition-colors duration-300 shadow-2xl will-change-transform"
            >
              {!heroImgFailed ? (
                <img
                  src={HERO_EPYC_PATH}
                  alt="Prosesor server AMD EPYC bertenaga tinggi untuk Hosting SA-MP RA STORE"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgFailed(true)}
                  className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                />
              ) : (
                <div className="w-full h-full min-h-[320px] flex flex-col items-center justify-center p-8 text-center bg-[#111318]">
                  <ShoppingBag className="w-10 h-10 text-[#DC2626] mb-3" />
                  <p className="font-display text-lg font-semibold text-white">
                    RA STORE · AMD EPYC 9750
                  </p>
                  <p className="text-sm text-[#A1A1AA] mt-1">
                    Hosting SA-MP, Modpack, Jasa &amp; Unduhan YouTube
                  </p>
                </div>
              )}

              {/* Subtle top-edge highlight reflection */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-60 group-hover:opacity-100 transition-opacity"
              />

              {/* Measured bottom contrast scrim with clean hardware caption */}
              <div className="pointer-events-none relative z-10 -mt-28 bg-gradient-to-t from-[#090A0D]/95 via-[#090A0D]/55 to-transparent p-5 pt-10 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-mono text-[#EF4444]">
                    {heroImageCaptionTitle}
                  </p>
                  <p className="text-sm font-medium text-white mt-0.5">
                    {heroImageCaptionSubtitle}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Full-Width 4-Column Capability Strip with pointer-tracking spotlight & crimson hairline */}
        <div className="mt-12 pt-8 border-t border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SERVICE_PILLARS.map((pillar) => (
            <motion.a
              key={pillar.num}
              href="#katalog"
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onMouseMove={handleSpotlightMove}
              onClick={() => onSelectCategoryShortcut(pillar.category)}
              className="spotlight-card group relative bg-[#111318]/80 hover:bg-[#151820] border border-white/[0.07] hover:border-[#DC2626]/50 rounded-xl p-4 transition-colors duration-200 flex flex-col justify-between gap-2 overflow-hidden"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#EF4444] to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center"
              />
              <div className="relative z-10 flex items-center justify-between text-xs font-mono text-[#71717A] group-hover:text-[#EF4444] transition-colors">
                <span>{pillar.num}</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <div className="relative z-10">
                <p className="text-sm font-semibold text-white group-hover:text-white transition-colors">
                  {pillar.title}
                </p>
                <p className="text-xs text-[#A1A1AA] mt-0.5">{pillar.subtitle}</p>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
