import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, ChevronDown, MessageCircle } from 'lucide-react';
import { normalizeWhatsappNumber } from '../utils/format';
import { handleSpotlightMove } from '../utils/spotlight';

interface FaqSectionProps {
  whatsappNumber: string;
  discordUsername?: string;
  discordInviteUrl?: string;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export function FaqSection({
  whatsappNumber,
  discordUsername = 'farrassamp',
  discordInviteUrl,
}: FaqSectionProps) {
  const [openId, setOpenId] = useState<string>('alur-pesan');
  const waHref = `https://wa.me/${normalizeWhatsappNumber(whatsappNumber) || '6285797123671'}`;

  const faqItems: FaqItem[] = [
    {
      id: 'alur-pesan',
      question: 'Bagaimana alur pembelian produk atau jasa di RA STORE?',
      answer:
        'Pilih produk atau layanan di Katalog, klik Keranjang, lalu isi nama lengkap, nomor WhatsApp aktif, dan metode pembayaran. Setelah menekan Buat Pesanan Sekarang, sistem membuat kode pesanan otomatis dan Anda dapat langsung mengirim ringkasannya ke WhatsApp Farrassamp untuk diproses.',
    },
    {
      id: 'pembayaran',
      question: 'Metode pembayaran apa saja yang didukung?',
      answer:
        'RA STORE menerima pembayaran melalui QRIS, Transfer Bank, E-Wallet, serta COD sesuai kesepakatan. Total pembayaran dan rincian item otomatis tercatat pada bukti pesanan Anda.',
    },
    {
      id: 'aktivasi',
      question: 'Berapa lama aktivasi Hosting SA-MP AMD EPYC 9750 dan pengiriman file?',
      answer:
        'Setelah pembayaran terkonfirmasi, akses panel Hosting AMD EPYC 9750 maupun file Modpack GTA SA-MP dikirim langsung lewat WhatsApp atau Discord. Untuk Jasa Developer, Jasa SA-MP, dan Review & Streaming, jadwal pengerjaan dikonfirmasi langsung bersama Farrassamp.',
    },
    {
      id: 'dukungan',
      question: 'Apakah tersedia dukungan teknis jika server atau modpack bermasalah?',
      answer: `Tentu. Pelanggan mendapat bantuan teknis awal untuk instalasi modpack, pengecekan server SA-MP, serta panduan penggunaan. Anda dapat menghubungi Farrassamp langsung lewat WhatsApp atau Discord (${discordUsername}).`,
    },
    {
      id: 'unduhan-yt',
      question: 'Apakah file di Pusat Unduhan YouTube aman dan gratis?',
      answer:
        'Ya. Seluruh mod, config, preset, dan tool di bagian Unduhan YT merupakan arsip resmi dari video kanal YouTube @Farrassamp dengan tautan langsung bebas jebakan iklan, lengkap dengan pratinjau video tutorialnya.',
    },
    {
      id: 'custom-request',
      question: 'Bisakah memesan jasa custom gamemode atau jadwal review server?',
      answer:
        'Bisa. Untuk permintaan fitur gamemode khusus, setup server skala besar, atau jadwal review & live streaming server GTA SA-MP, silakan konsultasi terlebih dahulu melalui WhatsApp atau Discord Store sebelum melakukan checkout.',
    },
  ];

  return (
    <section
      id="faq"
      className="border-t border-white/[0.08] bg-[#090A0D] py-16 lg:py-20"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Intro & Direct Support Column */}
          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
            <div>
              <p className="text-xs font-medium text-[#EF4444] mb-1.5">
                Bantuan &amp; Informasi
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white text-balance">
                Frequently Asked Questions
              </h2>
              <p className="text-sm text-[#A1A1AA] mt-3 leading-relaxed">
                Panduan singkat seputar alur pemesanan, metode pembayaran,
                aktivasi layanan hosting AMD EPYC 9750, serta dukungan teknis
                bersama Farrassamp.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-1">
              <motion.a
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-sheen inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-xl shadow-[0_1px_0_0_rgba(255,255,255,0.18)_inset] transition-colors whitespace-nowrap shrink-0"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>Tanya via WhatsApp</span>
              </motion.a>

              {discordInviteUrl && (
                <a
                  href={discordInviteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#A1A1AA] hover:text-white transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Discord Store</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#EF4444]" />
                </a>
              )}
            </div>
          </div>

          {/* Right Accordion Column */}
          <div className="lg:col-span-7 space-y-3">
            {faqItems.map((item) => {
              const isOpen = openId === item.id;

              return (
                <div
                  key={item.id}
                  onMouseMove={handleSpotlightMove}
                  className={`spotlight-card bg-[#111318] border rounded-2xl overflow-hidden transition-colors duration-200 ${
                    isOpen
                      ? 'border-[#DC2626]/55 shadow-[0_8px_24px_-12px_rgba(220,38,38,0.25)]'
                      : 'border-white/[0.08] hover:border-white/[0.18]'
                  }`}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${item.id}`}
                    onClick={() => setOpenId(isOpen ? '' : item.id)}
                    className="relative z-10 w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#DC2626]"
                  >
                    <span className="text-sm sm:text-[15px] font-semibold text-white leading-snug">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#EF4444]' : 'text-[#A1A1AA]'
                      }`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-panel-${item.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="relative z-10 overflow-hidden"
                      >
                        <div className="px-5 pb-4 pt-3 text-sm text-[#A1A1AA] leading-relaxed border-t border-white/[0.06] mt-0.5">
                          {item.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
