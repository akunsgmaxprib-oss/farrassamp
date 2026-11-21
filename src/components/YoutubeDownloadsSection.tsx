import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  FileArchive,
  Lock,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  XCircle,
} from 'lucide-react';
import {
  DownloadAccessStatus,
  YT_CATEGORIES,
  YoutubeDownload,
} from '../types/store';
import { handleSpotlightMove } from '../utils/spotlight';
import { getProductRecencyBadge } from '../utils/format';

interface YoutubeDownloadsSectionProps {
  downloads: YoutubeDownload[];
  lockedDownloadsCount?: number;
  downloadAccess?: DownloadAccessStatus;
  discordInviteUrl?: string;
  discordConfigured?: boolean;
  verifyingDiscord?: boolean;
  recheckingDiscord?: boolean;
  discordAuthError?: string;
  loading: boolean;
  youtubeEyebrow?: string;
  youtubeTitle?: string;
  ytTabAllLabel?: string;
  ytTabModLabel?: string;
  ytTabPresetLabel?: string;
  ytTabDocLabel?: string;
  onPlayVideo: (item: YoutubeDownload) => void;
  onTrackDownload: (item: YoutubeDownload) => void;
  onVerifyDiscord?: () => void;
  onRecheckDiscordRole?: () => void;
  onOpenAdmin: () => void;
  isAdmin: boolean;
}

export function YoutubeDownloadsSection({
  downloads,
  lockedDownloadsCount = 0,
  downloadAccess,
  discordInviteUrl = 'https://discord.gg/ss2WFZK6Zg',
  discordConfigured = true,
  verifyingDiscord = false,
  recheckingDiscord = false,
  discordAuthError = '',
  loading,
  youtubeEyebrow = 'Dibagikan dari Kanal YouTube Farrassamp',
  youtubeTitle = 'Pusat Unduhan YouTube',
  ytTabAllLabel = 'Semua',
  ytTabModLabel = 'Mod & Config',
  ytTabPresetLabel = 'Preset & Editing',
  ytTabDocLabel = 'Dokumen & Tool',
  onPlayVideo,
  onTrackDownload,
  onVerifyDiscord,
  onRecheckDiscordRole,
  onOpenAdmin,
  isAdmin,
}: YoutubeDownloadsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [failedThumbs, setFailedThumbs] = useState<Record<string, boolean>>({});
  const [loadedThumbs, setLoadedThumbs] = useState<Record<string, boolean>>({});
  const isDownloadsLocked = Boolean(downloadAccess && !downloadAccess.allowed);

  function getCategoryLabel(key: string): string {
    if (key === 'Semua') return ytTabAllLabel || 'Semua';
    if (key === 'Mod & Config') return ytTabModLabel || 'Mod & Config';
    if (key === 'Preset & Editing') return ytTabPresetLabel || 'Preset & Editing';
    if (key === 'Dokumen & Tool') return ytTabDocLabel || 'Dokumen & Tool';
    return key;
  }

  const filteredDownloads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return downloads.filter((item) => {
      const matchesCat =
        selectedCategory === 'Semua' || item.category === selectedCategory;
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.fileName.toLowerCase().includes(q) ||
        item.notes.toLowerCase().includes(q) ||
        getCategoryLabel(item.category).toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [downloads, selectedCategory, searchQuery, ytTabAllLabel, ytTabModLabel, ytTabPresetLabel, ytTabDocLabel]);

  const hasActiveFilter =
    selectedCategory !== 'Semua' || searchQuery.trim().length > 0;

  return (
    <section
      id="unduhan-yt"
      className="scroll-mt-20 bg-[#0D0F14] border-y border-white/[0.08] py-16 lg:py-20"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-xs font-medium text-[#EF4444] mb-1.5">
              {youtubeEyebrow}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {youtubeTitle}
            </h2>
          </div>

          <div className="w-full md:w-80 relative">
            <Search className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari file atau nama video..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#111318] border border-white/[0.08] rounded-xl text-white placeholder:text-[#71717A] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 transition-all"
            />
          </div>
        </div>

        {/* Unified Segmented Category Tabs */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1 p-1 bg-[#111318] border border-white/[0.08] rounded-xl overflow-x-auto max-w-full">
            {['Semua', ...YT_CATEGORIES].map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`relative px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active ? 'text-white' : 'text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="yt-active-tab"
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute inset-0 bg-[#DC2626] rounded-lg shadow-[0_1px_0_0_rgba(255,255,255,0.18)_inset]"
                    />
                  )}
                  <span className="relative z-10">{getCategoryLabel(cat)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            aria-busy="true"
            aria-label="Memuat daftar unduhan video"
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {[0, 1, 2, 3].map((n) => (
              <motion.div
                key={n}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: n * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="bg-[#111318] border border-white/[0.08] rounded-2xl p-5 flex flex-col justify-between gap-5"
              >
                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="w-full sm:w-52 aspect-video skeleton-shimmer rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-20 skeleton-shimmer rounded-md" />
                      <div className="h-3 w-14 skeleton-shimmer rounded-md" />
                      <div className="h-3 w-16 skeleton-shimmer rounded-md" />
                    </div>
                    <div className="h-4 w-full skeleton-shimmer rounded-md" />
                    <div className="h-4 w-4/5 skeleton-shimmer rounded-md" />
                    <div className="h-3 w-40 skeleton-shimmer rounded-md mt-1" />
                    <div className="h-3.5 w-3/4 skeleton-shimmer rounded-md" />
                  </div>
                </div>
                <div className="pt-4 border-t border-white/[0.07] flex items-center justify-between gap-3">
                  <div className="h-4 w-24 skeleton-shimmer rounded-md" />
                  <div className="h-8 w-28 skeleton-shimmer rounded-lg" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : isDownloadsLocked ? (
          <div className="bg-[#111318] border border-[#5865F2]/35 rounded-2xl p-6 sm:p-10 max-w-3xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#5865F2]/15 border border-[#5865F2]/40 text-[#818CF8] flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                  Khusus Member Discord Role Subscribe
                </h3>
                <p className="text-sm text-[#A1A1AA] leading-relaxed">
                  {lockedDownloadsCount > 0
                    ? `${lockedDownloadsCount} file modpack & gamemode GTA SA-MP terkunci. Hanya akun Discord yang sudah tergabung di server kami dan memiliki role Subscribe yang dapat mengakses tempat unduhan.`
                    : 'Hanya akun Discord yang tergabung di server kami dengan role Subscribe yang dapat mengakses pusat unduhan.'}
                </p>
              </div>
            </div>

            <div className="bg-[#090A0D] border border-white/[0.08] rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#A1A1AA]">Akun Discord</span>
                {downloadAccess?.authenticated && downloadAccess.discordUser ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>@{downloadAccess.discordUser.username}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-medium text-[#EF4444]">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Belum Terverifikasi</span>
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-[#A1A1AA]">Keanggotaan Server Discord</span>
                {downloadAccess?.inGuild ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Sudah Bergabung</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-medium text-amber-400">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Belum Gabung Server</span>
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-[#A1A1AA]">
                  Role Subscribe{' '}
                  <span className="font-mono text-[11px] text-[#71717A]">
                    ({downloadAccess?.subscribeRoleId || '1558118487409295460'})
                  </span>
                </span>
                {downloadAccess?.hasSubscribeRole ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aktif</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-medium text-[#EF4444]">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Belum Dimiliki</span>
                  </span>
                )}
              </div>
            </div>

            {discordAuthError && (
              <div className="flex items-start gap-2.5 text-xs text-red-300 bg-red-950/50 border border-red-900 rounded-xl p-3.5 leading-relaxed">
                <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
                <span>{discordAuthError}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <div className="flex flex-wrap items-center gap-3">
                {discordConfigured && downloadAccess?.authenticated && onRecheckDiscordRole ? (
                  <button
                    type="button"
                    disabled={recheckingDiscord || verifyingDiscord}
                    onClick={onRecheckDiscordRole}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${recheckingDiscord ? 'animate-spin' : ''}`}
                    />
                    <span>
                      {recheckingDiscord ? 'Mengecek Role...' : 'Cek Ulang Role Subscribe'}
                    </span>
                  </button>
                ) : discordConfigured && onVerifyDiscord ? (
                  <button
                    type="button"
                    disabled={verifyingDiscord || recheckingDiscord}
                    onClick={onVerifyDiscord}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
                  >
                    <span>
                      {verifyingDiscord
                        ? 'Menunggu Verifikasi Discord...'
                        : 'Verifikasi Discord Sekarang'}
                    </span>
                  </button>
                ) : null}

                {!discordConfigured && (
                  <p className="text-xs text-amber-300 bg-amber-950/40 border border-amber-700/40 rounded-lg px-3 py-2">
                    Verifikasi Discord sedang menunggu konfigurasi pemilik toko (Client ID &amp; Secret).
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
                {discordConfigured && downloadAccess?.authenticated && onVerifyDiscord && (
                  <button
                    type="button"
                    disabled={verifyingDiscord || recheckingDiscord}
                    onClick={onVerifyDiscord}
                    className="text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
                  >
                    Ganti akun Discord
                  </button>
                )}

                <a
                  href={discordInviteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#A1A1AA] hover:text-white transition-colors"
                >
                  <span>Gabung Server Discord</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#5865F2]" />
                </a>
              </div>
            </div>
          </div>
        ) : downloads.length === 0 ? (
          <div className="bg-[#111318] border border-white/[0.08] rounded-2xl p-10 sm:p-14 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#DC2626]/12 border border-[#DC2626]/30 text-[#EF4444] flex items-center justify-center mx-auto">
              <FileArchive className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <p className="font-display text-lg font-semibold text-white">
                Daftar unduhan YouTube masih kosong
              </p>
              <p className="text-sm text-[#A1A1AA] max-w-md mx-auto leading-relaxed">
                File mod, config, dan preset yang dibagikan dari video YouTube
                Farrassamp akan muncul di sini setelah ditambahkan.
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
                  <span>Tambah File YouTube</span>
                </motion.button>
              </div>
            )}
          </div>
        ) : filteredDownloads.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.22 }}
            className="bg-[#111318] border border-white/[0.08] rounded-2xl p-12 text-center space-y-3"
          >
            <FileArchive className="w-8 h-8 text-[#A1A1AA] mx-auto" />
            <div>
              <p className="font-semibold text-white">
                Belum ada file unduhan yang cocok
              </p>
              <p className="text-sm text-[#A1A1AA] mt-1">
                Coba ubah kata kunci pencarian atau pilih kategori {ytTabAllLabel || 'Semua'}.
              </p>
            </div>
            {hasActiveFilter && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('Semua');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#090A0D] border border-white/[0.12] hover:border-[#DC2626]/60 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#EF4444]" />
                <span>Tampilkan Semua File</span>
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredDownloads.map((item) => {
              const thumbFailed = failedThumbs[item.id];
              const thumbUrl = `https://i.ytimg.com/vi/${item.youtubeVideoId}/hqdefault.jpg`;
              const recencyBadge = getProductRecencyBadge(item);

              return (
                <motion.article
                  key={item.id}
                  whileHover={{ y: -5 }}
                  onMouseMove={handleSpotlightMove}
                  className="spotlight-card group relative bg-[#111318] border border-white/[0.08] rounded-2xl p-5 flex flex-col justify-between gap-5 overflow-hidden transition-colors duration-200 hover:border-[#DC2626]/55 hover:shadow-[0_14px_34px_-12px_rgba(220,38,38,0.26)]"
                >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[1.5px] bg-gradient-to-r from-transparent via-[#EF4444] to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center"
                    />
                    <div className="relative z-10 flex flex-col sm:flex-row gap-5">
                      {/* Video Thumbnail with Play Preview */}
                      <button
                        type="button"
                        onClick={() => onPlayVideo(item)}
                        className="card-image-glint group/thumb relative w-full sm:w-52 aspect-video rounded-xl overflow-hidden bg-[#090A0D] shrink-0 text-left cursor-pointer border border-white/[0.08]"
                      >
                        {!thumbFailed ? (
                          <>
                            {!loadedThumbs[item.id] && (
                              <div
                                aria-hidden="true"
                                className="absolute inset-0 skeleton-shimmer"
                              />
                            )}
                            <img
                              src={thumbUrl}
                              alt={`Thumbnail video ${item.title}`}
                              referrerPolicy="no-referrer"
                              onLoad={() =>
                                setLoadedThumbs((prev) => ({
                                  ...prev,
                                  [item.id]: true,
                                }))
                              }
                              onError={() =>
                                setFailedThumbs((prev) => ({
                                  ...prev,
                                  [item.id]: true,
                                }))
                              }
                              className="relative z-10 w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                            />
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-[#151820]">
                            <Play className="w-6 h-6 text-[#EF4444] mb-1" />
                            <span className="text-[11px] font-medium text-[#A1A1AA] line-clamp-1">
                              Video YouTube
                            </span>
                          </div>
                        )}

                        {recencyBadge && (
                          <span
                            className={`pointer-events-none absolute top-2.5 left-2.5 z-20 inline-flex items-center px-2 py-0.5 text-[11px] font-semibold tracking-wide rounded-lg backdrop-blur-md border shadow-sm ${
                              recencyBadge === 'Baru'
                                ? 'bg-[#090A0D]/85 border-emerald-500/50 text-emerald-300'
                                : 'bg-[#090A0D]/85 border-amber-400/50 text-amber-300'
                            }`}
                          >
                            {recencyBadge}
                          </span>
                        )}

                        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex items-end p-2.5">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white">
                            <Play className="w-3.5 h-3.5 fill-white group-hover/thumb:scale-110 transition-transform" />
                            <span>Tonton Video</span>
                          </span>
                        </div>
                      </button>

                      {/* Resource Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#A1A1AA] mb-1.5">
                          <span>{getCategoryLabel(item.category)}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{item.version}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{item.fileSize}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {item.downloadCount.toLocaleString('id-ID')} unduhan
                          </span>
                        </div>

                        <h3 className="text-base font-semibold text-white group-hover:text-[#EF4444] transition-colors leading-snug line-clamp-2">
                          {item.title}
                        </h3>

                        <p className="font-mono text-xs text-[#A1A1AA] mt-1 truncate">
                          {item.fileName}
                        </p>

                        <p className="text-sm text-[#A1A1AA] mt-2 line-clamp-2 leading-relaxed">
                          {item.notes}
                        </p>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="relative z-10 pt-4 border-t border-white/[0.07] flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => onPlayVideo(item)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#A1A1AA] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 text-[#EF4444]" />
                        <span>Tonton Video</span>
                      </button>

                      <motion.a
                        whileTap={{ scale: 0.96 }}
                        href={item.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onTrackDownload(item)}
                        className="btn-sheen group/dl inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg shadow-[0_1px_0_0_rgba(255,255,255,0.18)_inset] transition-colors whitespace-nowrap shrink-0"
                      >
                        <Download className="w-3.5 h-3.5 shrink-0 group-hover/dl:translate-y-0.5 transition-transform" />
                        <span>Unduh File</span>
                      </motion.a>
                    </div>
                  </motion.article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
