import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  KeyRound,
  Lock,
  Server,
  ShieldCheck,
} from 'lucide-react';
import { STORE_LOGO_PATH } from '../data/starterCatalog';

interface DiscordEntryGateModalProps {
  open: boolean;
  brandName?: string;
  heroTagline?: string;
  discordInviteUrl: string;
  discordConfigured: boolean;
  subscribeRoleId: string;
  verifying: boolean;
  authError: string;
  onStartDiscordVerify: () => void;
  onOpenAdmin: () => void;
}

export function DiscordEntryGateModal({
  open,
  brandName = 'RA STORE',
  heroTagline = 'Farrassamp Official',
  discordInviteUrl,
  discordConfigured,
  subscribeRoleId,
  verifying,
  authError,
  onStartDiscordVerify,
  onOpenAdmin,
}: DiscordEntryGateModalProps) {
  const [logoFailed, setLogoFailed] = useState(false);
  const [copiedUri, setCopiedUri] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;

  const callbackUri =
    typeof window !== 'undefined'
      ? `${window.location.origin}/auth/discord/callback`
      : '';

  async function handleCopyUri() {
    if (!callbackUri) return;
    try {
      await navigator.clipboard.writeText(callbackUri);
      setCopiedUri(true);
      window.setTimeout(() => setCopiedUri(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Verifikasi Discord ${brandName}`}
      className="fixed inset-0 z-50 bg-[#090A0D]/95 backdrop-blur-xl overflow-y-auto flex items-center justify-center p-4 sm:p-6"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-architectural-grid opacity-75"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_65%_50%_at_50%_20%,rgba(220,38,38,0.22),transparent_70%)]"
      />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-lg bg-[#111318] border border-white/[0.1] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 my-auto"
      >
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#090A0D] border border-[#DC2626]/70 shadow-[0_0_32px_-8px_rgba(220,38,38,0.5)] flex items-center justify-center">
            {!logoFailed ? (
              <img
                src={STORE_LOGO_PATH}
                alt={`Logo ${brandName}`}
                referrerPolicy="no-referrer"
                onError={() => setLogoFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <Server className="w-7 h-7 text-[#EF4444]" />
            )}
          </div>

          <div className="space-y-1">
            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#EF4444]">
              {heroTagline} · {brandName}
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Verifikasi Akun Discord
            </h1>
            <p className="text-sm text-[#A1A1AA] leading-relaxed max-w-md mx-auto">
              Sebelum masuk ke halaman {brandName}, hubungkan akun Discord kamu terlebih
              dahulu untuk verifikasi pengunjung.
            </p>
          </div>
        </div>

        <div className="bg-[#090A0D] border border-white/[0.08] rounded-xl p-4 space-y-2.5 text-xs">
          <div className="flex items-start gap-2.5 text-[#E4E4E7]">
            <ShieldCheck className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">Akses Katalog & Jasa:</strong> Terbuka
              langsung setelah verifikasi Discord berhasil.
            </span>
          </div>
          <div className="flex items-start gap-2.5 text-[#E4E4E7]">
            <Lock className="w-4 h-4 text-[#5865F2] shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">Akses Pusat Unduhan:</strong> Khusus member
              server Discord kami yang memiliki role{' '}
              <strong className="text-white">Subscribe</strong>{' '}
              <span className="font-mono text-[#A1A1AA]">(ID: {subscribeRoleId})</span>.
            </span>
          </div>
        </div>

        {authError && (
          <div className="flex items-start gap-2.5 text-xs text-red-300 bg-red-950/50 border border-red-900 rounded-xl p-3.5 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        {discordConfigured ? (
          <div className="space-y-3">
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              disabled={verifying}
              onClick={onStartDiscordVerify}
              className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 text-sm font-semibold text-white bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-60 rounded-xl shadow-[0_1px_0_0_rgba(255,255,255,0.18)_inset] transition-colors cursor-pointer"
            >
              <svg
                className="w-5 h-5 shrink-0 fill-current"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028ZM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
              </svg>
              <span>
                {verifying ? 'Menunggu Verifikasi Discord...' : 'Verifikasi dengan Discord'}
              </span>
            </motion.button>

            <a
              href={discordInviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-[#E4E4E7] bg-[#090A0D] border border-white/[0.1] hover:border-white/25 rounded-xl transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#5865F2]" />
              <span>Belum Gabung? Join Server Discord RA STORE</span>
            </a>
          </div>
        ) : (
          <div className="bg-amber-950/30 border border-amber-700/40 rounded-xl p-4 space-y-3 text-xs text-amber-200 leading-relaxed">
            <p className="font-semibold text-amber-100">
              Setup Pemilik: Discord OAuth Belum Dikonfigurasi
            </p>
            <p>
              Tambahkan <span className="font-mono text-white">DISCORD_CLIENT_ID</span> dan{' '}
              <span className="font-mono text-white">DISCORD_CLIENT_SECRET</span> di Secrets,
              lalu daftarkan Redirect URI berikut di Discord Developer Portal:
            </p>
            {callbackUri && (
              <div className="flex items-center gap-2 bg-[#090A0D] border border-white/[0.1] rounded-lg px-2.5 py-2">
                <code className="font-mono text-[11px] text-[#F4F4F5] truncate flex-1">
                  {callbackUri}
                </code>
                <button
                  type="button"
                  onClick={handleCopyUri}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-white/[0.08] hover:bg-white/[0.14] text-white rounded cursor-pointer shrink-0"
                >
                  {copiedUri ? (
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
            )}
          </div>
        )}

        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-center">
          <button
            type="button"
            onClick={onOpenAdmin}
            className="inline-flex items-center gap-1.5 text-xs text-[#71717A] hover:text-white transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Pemilik Toko? Masuk Studio</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
