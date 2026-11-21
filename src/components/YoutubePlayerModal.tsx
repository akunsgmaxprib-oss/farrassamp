import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Download, ExternalLink, Play, X } from 'lucide-react';
import { YoutubeDownload } from '../types/store';

interface YoutubePlayerModalProps {
  item: YoutubeDownload | null;
  categoryLabel?: string;
  onClose: () => void;
  onTrackDownload: (item: YoutubeDownload) => void;
}

export function YoutubePlayerModal({
  item,
  categoryLabel,
  onClose,
  onTrackDownload,
}: YoutubePlayerModalProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    setIframeLoaded(false);
  }, [item?.id]);

  if (!item) return null;

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
        aria-labelledby="yt-modal-title"
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="bg-[#111318] border border-white/[0.1] rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
          <div className="min-w-0">
            <p className="text-xs text-[#9CA3AF]">
              {categoryLabel || item.category} · {item.version} · {item.fileSize}
            </p>
            <h2
              id="yt-modal-title"
              className="font-display text-lg font-bold text-[#F5F5F7] truncate tracking-tight"
            >
              {item.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pemutar video"
            className="w-9 h-9 inline-flex items-center justify-center rounded-xl text-[#9CA3AF] hover:text-white hover:bg-white/[0.06] shrink-0 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative aspect-video bg-[#0B0C10] w-full overflow-hidden">
          {!iframeLoaded && (
            <div
              aria-hidden="true"
              className="absolute inset-0 skeleton-shimmer flex flex-col items-center justify-center gap-3 z-10 pointer-events-none"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#1D212B]/90 border border-white/[0.08] flex items-center justify-center shadow-lg">
                <Play className="w-6 h-6 text-[#EF4444]/80 fill-[#EF4444]/30" />
              </div>
              <div className="h-3 w-36 rounded-md bg-white/[0.06]" />
            </div>
          )}
          <iframe
            src={`https://www.youtube.com/embed/${item.youtubeVideoId}`}
            title={item.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => setIframeLoaded(true)}
            className={`w-full h-full border-0 transition-opacity duration-300 ${
              iframeLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>

        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-xs text-[#F5F5F7] font-medium truncate">
              {item.fileName}
            </p>
            <p className="text-sm text-[#9CA3AF] mt-1">{item.notes}</p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href={item.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-[#F5F5F7] bg-[#090A0D] border border-white/[0.1] hover:border-white/25 rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka YouTube</span>
            </a>
            <a
              href={item.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onTrackDownload(item)}
              className="btn-sheen inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh File</span>
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
