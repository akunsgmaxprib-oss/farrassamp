import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Play, ShieldCheck, User } from 'lucide-react';
import { OWNER_AVATAR_PATH, STORE_LOGO_PATH } from '../data/starterCatalog';
import { normalizeWhatsappNumber } from '../utils/format';
import { handleSpotlightMove } from '../utils/spotlight';

interface AboutAndFooterProps {
  whatsappNumber: string;
  youtubeChannelUrl: string;
  discordUsername?: string;
  discordInviteUrl?: string;
  brandName?: string;
  aboutRoleLabel?: string;
  ownerDisplayName?: string;
  aboutDescription?: string;
  officialCardSubtitle?: string;
  footerText?: string;
  isAdmin: boolean;
  onOpenAdmin: () => void;
  onSecretOwnerTrigger?: () => void;
  hideFooter?: boolean;
}

export function AboutAndFooter({
  whatsappNumber,
  youtubeChannelUrl,
  discordUsername,
  discordInviteUrl,
  brandName = 'RA STORE',
  aboutRoleLabel = 'Pemilik & Pengelola RA STORE',
  ownerDisplayName = 'Farrassamp',
  aboutDescription = 'RA STORE adalah toko resmi milik Farrassamp untuk kebutuhan GTA SA-MP, hosting AMD EPYC 9750, modpack, jasa developer, review streaming, serta arsip unduhan file resmi dari kanal YouTube @Farrassamp.',
  officialCardSubtitle = 'Sedia Kebutuhan SA-MP · Hosting, Modpack & Jasa',
  footerText = 'RA STORE · Farrassamp. Seluruh hak cipta dilindungi.',
  isAdmin,
  onOpenAdmin,
  onSecretOwnerTrigger,
  hideFooter = false,
}: AboutAndFooterProps) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const waHref = `https://wa.me/${normalizeWhatsappNumber(whatsappNumber) || '6285797123671'}`;

  return (
    <>
      <section id="tentang" className="scroll-mt-20 max-w-[1200px] mx-auto px-4 sm:px-6 py-16 lg:py-20">
        <div
          onMouseMove={handleSpotlightMove}
          className="spotlight-card bg-[#111318] border border-white/[0.08] rounded-2xl p-7 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center overflow-hidden"
        >
          <div className="relative z-10 lg:col-span-7 space-y-6">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.06, rotate: -2 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                className="w-16 h-16 rounded-2xl overflow-hidden bg-[#090A0D] border border-[#DC2626]/70 shrink-0 shadow-lg"
              >
                {!avatarFailed ? (
                  <img
                    src={OWNER_AVATAR_PATH}
                    alt="Foto Profil Farrassamp — Pemilik RA STORE"
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#EF4444]">
                    <User className="w-7 h-7" />
                  </div>
                )}
              </motion.div>

              <div>
                <p className="text-xs font-medium text-[#EF4444]">
                  {aboutRoleLabel}
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {ownerDisplayName}
                </h2>
              </div>
            </div>

            <p className="text-sm sm:text-base text-[#A1A1AA] leading-relaxed">
              {aboutDescription}
            </p>

            {/* Clean Contact Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <motion.a
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
                onMouseMove={handleSpotlightMove}
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="spotlight-card group bg-[#090A0D] border border-white/[0.08] hover:border-[#DC2626]/60 rounded-xl px-4 py-3 transition-colors flex items-center justify-between gap-2 overflow-hidden"
              >
                <div className="relative z-10">
                  <p className="text-[#A1A1AA]">WhatsApp Resmi</p>
                  <p className="font-mono font-medium text-white mt-0.5 tabular-nums">
                    +62 857-9712-3671
                  </p>
                </div>
                <ArrowUpRight className="relative z-10 w-4 h-4 text-[#71717A] group-hover:text-[#EF4444] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </motion.a>

              <motion.a
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
                onMouseMove={handleSpotlightMove}
                href={discordInviteUrl || '#tentang'}
                target={discordInviteUrl ? '_blank' : undefined}
                rel={discordInviteUrl ? 'noopener noreferrer' : undefined}
                className="spotlight-card group bg-[#090A0D] border border-white/[0.08] hover:border-[#DC2626]/60 rounded-xl px-4 py-3 transition-colors flex items-center justify-between gap-2 overflow-hidden"
              >
                <div className="relative z-10">
                  <p className="text-[#A1A1AA]">Discord Pemilik</p>
                  <p className="font-mono font-medium text-white mt-0.5">
                    {discordUsername || 'farrassamp'}
                  </p>
                </div>
                <ArrowUpRight className="relative z-10 w-4 h-4 text-[#71717A] group-hover:text-[#EF4444] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </motion.a>
            </div>

            <div className="pt-1">
              <a
                href={youtubeChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-medium text-[#A1A1AA] hover:text-white transition-colors whitespace-nowrap"
              >
                <Play className="w-3.5 h-3.5 text-[#EF4444]" />
                <span>Lihat Kanal YouTube @Farrassamp</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="relative z-10 lg:col-span-5 space-y-6 pt-6 lg:pt-0 lg:pl-8 border-t lg:border-t-0 lg:border-l border-white/[0.08]">
            <div className="flex items-center gap-4 pb-5 border-b border-white/[0.08]">
              <motion.img
                whileHover={{ scale: 1.07, rotate: 3 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                src={STORE_LOGO_PATH}
                alt="Emblem Resmi RA STORE"
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-2xl object-cover border border-[#DC2626]/50 shrink-0 shadow-lg"
              />
              <div>
                <p className="font-display text-base font-bold text-white">
                  {brandName} Official
                </p>
                <p className="text-xs text-[#A1A1AA] mt-0.5">
                  {officialCardSubtitle}
                </p>
              </div>
            </div>

            <div className="group flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Tautan YouTube Bebas Jebakan Iklan
                </h3>
                <p className="text-xs text-[#A1A1AA] mt-1 leading-relaxed">
                  Semua file yang dibagikan di video YouTube ditautkan langsung di
                  halaman Unduhan YT agar penonton mudah mengunduh.
                </p>
              </div>
            </div>

            <div className="group flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Transaksi Langsung &amp; Aman
                </h3>
                <p className="text-xs text-[#A1A1AA] mt-1 leading-relaxed">
                  Mendukung QRIS, Transfer Bank, E-Wallet, dan COD dengan verifikasi
                  langsung bersama Farrassamp via WhatsApp atau Discord.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {!hideFooter && (
        <StoreFooter
          discordInviteUrl={discordInviteUrl}
          footerText={footerText}
          isAdmin={isAdmin}
          onOpenAdmin={onOpenAdmin}
          onSecretOwnerTrigger={onSecretOwnerTrigger}
        />
      )}
    </>
  );
}

interface StoreFooterProps {
  discordInviteUrl?: string;
  footerText?: string;
  isAdmin: boolean;
  onOpenAdmin: () => void;
  onSecretOwnerTrigger?: () => void;
}

export function StoreFooter({
  discordInviteUrl,
  footerText = 'RA STORE · Farrassamp. Seluruh hak cipta dilindungi.',
  isAdmin,
  onOpenAdmin,
  onSecretOwnerTrigger,
}: StoreFooterProps) {
  const tapStateRef = useRef({ count: 0, timer: 0 });

  function handleCopyrightTap() {
    if (!onSecretOwnerTrigger) return;
    const state = tapStateRef.current;
    window.clearTimeout(state.timer);
    state.count += 1;
    if (state.count >= 5) {
      state.count = 0;
      onSecretOwnerTrigger();
      return;
    }
    state.timer = window.setTimeout(() => {
      state.count = 0;
    }, 1800);
  }

  return (
    <footer className="border-t border-white/[0.08] bg-[#090A0D]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A1A1AA]">
        <p onClick={handleCopyrightTap} className="select-none">
          &copy; {new Date().getFullYear()} {footerText}
        </p>
        <div className="flex flex-wrap items-center gap-6">
          <a href="#katalog" className="hover:text-white transition-colors">
            Katalog
          </a>
          <a href="#unduhan-yt" className="hover:text-white transition-colors">
            Unduhan YT
          </a>
          <a href="#tentang" className="hover:text-white transition-colors">
            Tentang
          </a>
          <a href="#faq" className="hover:text-white transition-colors">
            FAQ
          </a>
          {discordInviteUrl && (
            <a
              href={discordInviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Discord Store
            </a>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="text-[#EF4444] hover:text-white transition-colors cursor-pointer"
            >
              Studio Pemilik
            </button>
          )}
        </div>
      </div>
    </footer>
  );
}
