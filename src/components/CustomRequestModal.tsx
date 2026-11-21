import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Gamepad2,
  Map,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react';
import {
  CUSTOM_MAPPING_IMG_PATH,
  CUSTOM_MODPACK_IMG_PATH,
} from '../data/starterCatalog';
import { FIELD_LIMITS, Product } from '../types/store';
import { formatIDR, normalizeWhatsappNumber } from '../utils/format';

export type CustomRequestMode = 'mapping' | 'modpack';

interface CustomRequestModalProps {
  initialMode?: CustomRequestMode;
  storeWhatsapp: string;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

const MAPPING_PACKETS = [
  { id: 'low', label: 'Packet Low', objects: 30, price: 8000 },
  { id: 'medium', label: 'Packet Medium', objects: 50, price: 10000 },
  { id: 'high', label: 'Packet High', objects: 100, price: 20000 },
] as const;

const MODPACK_TIERS = [
  {
    id: 'low',
    label: 'Modpack Low',
    range: 'Rp5.000 - Rp10.000',
    basePrice: 5000,
    customPrice: 10000,
    summary: 'Ringan & anti lag untuk spek rendah',
  },
  {
    id: 'medium',
    label: 'Modpack Medium',
    range: 'Rp12.000 - Rp15.000',
    basePrice: 12000,
    customPrice: 15000,
    summary: 'Visual tajam & FPS stabil',
  },
  {
    id: 'high',
    label: 'Modpack High',
    range: 'Rp18.000 - Rp25.000',
    basePrice: 18000,
    customPrice: 25000,
    summary: 'Grafis HD, ENB & racikan lengkap',
  },
] as const;

const MODPACK_STYLES = [
  'Polosan Ringan',
  'Anti Lag',
  'Modpack Compe',
  'Style Gangster',
  'Carton',
  'Modpack HD',
  'Modpack ENB',
] as const;

export function CustomRequestModal({
  initialMode = 'mapping',
  storeWhatsapp,
  onClose,
  onAddToCart,
}: CustomRequestModalProps) {
  const [mode, setMode] = useState<CustomRequestMode>(initialMode);

  // Mapping Calculator State
  const [mapPacketId, setMapPacketId] = useState<'low' | 'medium' | 'high'>('medium');
  const [extraTenBlocks, setExtraTenBlocks] = useState(0);
  const [mapLocation, setMapLocation] = useState('');

  // Modpack Configurator State
  const [modTierId, setModTierId] = useState<'low' | 'medium' | 'high'>('medium');
  const [selectedStyles, setSelectedStyles] = useState<string[]>(['Style Gangster']);
  const [isDetailedRequest, setIsDetailedRequest] = useState(false);
  const [modSpecsNote, setModSpecsNote] = useState('');

  const activeMappingPacket = useMemo(
    () => MAPPING_PACKETS.find((p) => p.id === mapPacketId) || MAPPING_PACKETS[1],
    [mapPacketId]
  );

  const activeModTier = useMemo(
    () => MODPACK_TIERS.find((t) => t.id === modTierId) || MODPACK_TIERS[1],
    [modTierId]
  );

  const mappingTotalObjects = activeMappingPacket.objects + extraTenBlocks * 10;
  const mappingExtraCost = extraTenBlocks * 2000;
  const mappingTotalPrice = activeMappingPacket.price + mappingExtraCost;

  const modpackTotalPrice = isDetailedRequest
    ? activeModTier.customPrice
    : activeModTier.basePrice;

  const currentPrice = mode === 'mapping' ? mappingTotalPrice : modpackTotalPrice;

  function toggleStyle(styleName: string) {
    setSelectedStyles((prev) => {
      if (prev.includes(styleName)) {
        return prev.length > 1 ? prev.filter((s) => s !== styleName) : prev;
      }
      return [...prev, styleName];
    });
  }

  function buildConfiguredProduct(): Product {
    const uniqueSuffix = Date.now().toString(36);
    if (mode === 'mapping') {
      const cleanLoc = mapLocation.trim().slice(0, 48);
      const baseTitle = `Custom Mapping ${mappingTotalObjects} Object (${activeMappingPacket.label})${
        cleanLoc ? ` — ${cleanLoc}` : ''
      }`;
      return {
        id: `custom_map_${mapPacketId}_${extraTenBlocks}_${uniqueSuffix}`,
        title: baseTitle.slice(0, FIELD_LIMITS.PRODUCT_TITLE_MAX),
        category: 'Jasa SA-MP',
        price: mappingTotalPrice,
        stockStatus: 'Tersedia',
        imageUrl: CUSTOM_MAPPING_IMG_PATH,
        variantLabel: `${activeMappingPacket.objects} Obj + ${extraTenBlocks * 10} Obj Tambahan`,
        deliveryNote: 'Bebas request lokasi & model mapping · hasil rapi',
        description: `Konfigurasi Jasa Mapping: ${activeMappingPacket.label} (${activeMappingPacket.objects} Object = ${formatIDR(
          activeMappingPacket.price
        )})${
          extraTenBlocks > 0
            ? ` + Tambah ${extraTenBlocks * 10} Object (${formatIDR(mappingExtraCost)})`
            : ''
        }. Total: ${mappingTotalObjects} Object.${
          cleanLoc ? ` Catatan lokasi/tema: ${cleanLoc}.` : ''
        }`,
        featured: true,
        ownerId: 'farrassamp',
        isDemo: true,
      };
    }

    const stylesText = selectedStyles.join(', ');
    const cleanNote = modSpecsNote.trim().slice(0, 60);
    const baseTitle = `Request ${activeModTier.label} (${stylesText})`;
    return {
      id: `custom_mod_${modTierId}_${isDetailedRequest ? 'req' : 'std'}_${uniqueSuffix}`,
      title: baseTitle.slice(0, FIELD_LIMITS.PRODUCT_TITLE_MAX),
      category: 'Modpack GTA SA-MP',
      price: modpackTotalPrice,
      stockStatus: 'Tersedia',
      imageUrl: CUSTOM_MODPACK_IMG_PATH,
      variantLabel: `${isDetailedRequest ? 'Request Detail Khusus' : 'Racikan Standar'} · ${stylesText}`.slice(
        0,
        FIELD_LIMITS.PRODUCT_VARIANT_MAX
      ),
      deliveryNote: 'Konsultasi detail & kirim link via WhatsApp/Discord',
      description: `Konfigurasi ${activeModTier.label}: Style (${stylesText}), mode ${
        isDetailedRequest ? 'Request Detail Khusus' : 'Racikan Standar'
      }.${cleanNote ? ` Catatan spek/request: ${cleanNote}.` : ''}`,
      featured: true,
      ownerId: 'farrassamp',
      isDemo: true,
    };
  }

  function buildWhatsappInquiryUrl(): string {
    const cleanWa = normalizeWhatsappNumber(storeWhatsapp) || '6285797123671';
    const lines =
      mode === 'mapping'
        ? [
            'Halo Admin RA STORE, saya mau pesan *Jasa Mapping Custom*:',
            `- Paket Dasar: ${activeMappingPacket.label} (${activeMappingPacket.objects} Object)`,
            `- Tambahan Object: +${extraTenBlocks * 10} Object`,
            `- Total Object: ${mappingTotalObjects} Object`,
            `- Estimasi Harga: ${formatIDR(mappingTotalPrice)}`,
            ...(mapLocation.trim()
              ? [`- Lokasi / Tema Request: ${mapLocation.trim()}`]
              : []),
          ]
        : [
            'Halo Admin RA STORE, saya mau pesan *Request Racik Modpack SA-MP*:',
            `- Tingkat: ${activeModTier.label} (${isDetailedRequest ? 'Request Khusus' : 'Standar'})`,
            `- Gaya / Jenis: ${selectedStyles.join(', ')}`,
            `- Estimasi Harga: ${formatIDR(modpackTotalPrice)}`,
            ...(modSpecsNote.trim()
              ? [`- Spek PC / Catatan: ${modSpecsNote.trim()}`]
              : []),
          ];

    return `https://wa.me/${cleanWa}?text=${encodeURIComponent(lines.join('\n'))}`;
  }

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
        aria-labelledby="custom-calc-title"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="bg-[#111318] border border-white/[0.1] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#DC2626]/15 border border-[#DC2626]/40 text-[#EF4444] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="custom-calc-title"
                className="font-display text-base sm:text-lg font-bold text-[#F5F5F7] tracking-tight"
              >
                Kalkulator Request Custom
              </h2>
              <p className="text-xs text-[#9CA3AF]">
                Hitung estimasi harga Jasa Mapping atau racik Modpack sesuai kebutuhan Anda
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup kalkulator custom"
            className="w-9 h-9 inline-flex items-center justify-center rounded-xl text-[#9CA3AF] hover:text-white hover:bg-white/[0.06] cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#090A0D] border border-white/[0.08] rounded-xl">
            <button
              type="button"
              onClick={() => setMode('mapping')}
              className={`inline-flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                mode === 'mapping'
                  ? 'bg-[#DC2626] text-white shadow'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Jasa Mapping</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('modpack')}
              className={`inline-flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                mode === 'modpack'
                  ? 'bg-[#DC2626] text-white shadow'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Racik Modpack SA-MP</span>
            </button>
          </div>
        </div>

        {/* Scrollable Configurator Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {mode === 'mapping' ? (
            <>
              <div className="space-y-2.5">
                <label className="block text-xs font-semibold text-white">
                  1. Pilih Paket Dasar Mapping
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {MAPPING_PACKETS.map((pkt) => {
                    const selected = mapPacketId === pkt.id;
                    return (
                      <button
                        key={pkt.id}
                        type="button"
                        onClick={() => setMapPacketId(pkt.id)}
                        className={`text-left p-3.5 rounded-xl border transition-colors cursor-pointer ${
                          selected
                            ? 'bg-[#DC2626]/12 border-[#DC2626] text-white'
                            : 'bg-[#090A0D] border-white/[0.08] hover:border-white/[0.2] text-[#A1A1AA]'
                        }`}
                      >
                        <p className="text-xs font-semibold text-white">{pkt.label}</p>
                        <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                          {pkt.objects} Object
                        </p>
                        <p className="font-mono text-xs font-semibold text-[#EF4444] mt-1.5 tabular-nums">
                          {formatIDR(pkt.price)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-[#090A0D] border border-white/[0.08] rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-white">
                    2. Tambah Custom Object (+10 Object / Rp2.000)
                  </p>
                  <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                    Total saat ini:{' '}
                    <span className="font-mono font-semibold text-white">
                      {mappingTotalObjects} Object
                    </span>
                    {extraTenBlocks > 0 && (
                      <span className="text-[#EF4444]">
                        {' '}
                        (+{formatIDR(mappingExtraCost)})
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    aria-label="Kurangi 10 object tambahan"
                    disabled={extraTenBlocks === 0}
                    onClick={() => setExtraTenBlocks((prev) => Math.max(0, prev - 1))}
                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-[#14161B] border border-white/[0.1] text-white hover:border-[#DC2626] disabled:opacity-40 cursor-pointer transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-12 text-center font-mono text-xs font-semibold text-white tabular-nums">
                    +{extraTenBlocks * 10}
                  </span>
                  <button
                    type="button"
                    aria-label="Tambah 10 object"
                    disabled={extraTenBlocks >= 20}
                    onClick={() => setExtraTenBlocks((prev) => Math.min(20, prev + 1))}
                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-[#14161B] border border-white/[0.1] text-white hover:border-[#DC2626] disabled:opacity-40 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">
                  3. Lokasi / Tema / Request Model (Opsional)
                </label>
                <input
                  type="text"
                  maxLength={80}
                  value={mapLocation}
                  onChange={(e) => setMapLocation(e.target.value)}
                  placeholder="Contoh: Base gangster di El Corona + parkiran & garasi rapi"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#090A0D] border border-white/[0.1] text-white placeholder:text-[#71717A] rounded-xl focus:outline-none focus:border-[#DC2626]"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2.5">
                <label className="block text-xs font-semibold text-white">
                  1. Pilih Tingkat Modpack
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {MODPACK_TIERS.map((tier) => {
                    const selected = modTierId === tier.id;
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setModTierId(tier.id)}
                        className={`text-left p-3.5 rounded-xl border transition-colors cursor-pointer ${
                          selected
                            ? 'bg-[#DC2626]/12 border-[#DC2626] text-white'
                            : 'bg-[#090A0D] border-white/[0.08] hover:border-white/[0.2] text-[#A1A1AA]'
                        }`}
                      >
                        <p className="text-xs font-semibold text-white">{tier.label}</p>
                        <p className="text-[11px] text-[#A1A1AA] mt-0.5 line-clamp-2">
                          {tier.summary}
                        </p>
                        <p className="font-mono text-[11px] font-semibold text-[#EF4444] mt-1.5 tabular-nums">
                          {tier.range}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="block text-xs font-semibold text-white">
                  2. Pilih Gaya / Jenis Modpack (Bisa pilih lebih dari satu)
                </label>
                <div className="flex flex-wrap gap-2">
                  {MODPACK_STYLES.map((style) => {
                    const active = selectedStyles.includes(style);
                    return (
                      <button
                        key={style}
                        type="button"
                        onClick={() => toggleStyle(style)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#DC2626] border-[#DC2626] text-white'
                            : 'bg-[#090A0D] border-white/[0.1] text-[#A1A1AA] hover:text-white hover:border-white/[0.22]'
                        }`}
                      >
                        {style}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-[#090A0D] border border-white/[0.08] rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-white">
                    Mode Request Khusus Full Detail
                  </p>
                  <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                    Pilih jika ingin menyesuaikan warna HUD, skin, atau animasi secara spesifik ({formatIDR(activeModTier.customPrice)})
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isDetailedRequest}
                  onClick={() => setIsDetailedRequest((prev) => !prev)}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
                    isDetailedRequest ? 'bg-[#DC2626]' : 'bg-[#27272A]'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      isDetailedRequest ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">
                  3. Spek Perangkat &amp; Catatan Request (Opsional)
                </label>
                <input
                  type="text"
                  maxLength={90}
                  value={modSpecsNote}
                  onChange={(e) => setModSpecsNote(e.target.value)}
                  placeholder="Contoh: PC RAM 4GB / butuh skin gangster + sound pack"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#090A0D] border border-white/[0.1] text-white placeholder:text-[#71717A] rounded-xl focus:outline-none focus:border-[#DC2626]"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer Price & Actions */}
        <div className="px-6 py-4 border-t border-white/[0.08] bg-[#0B0D11] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] text-[#9CA3AF]">Estimasi Total Harga</p>
            <p className="font-mono text-xl font-bold text-white tabular-nums">
              {formatIDR(currentPrice)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={buildWhatsappInquiryUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-white bg-[#14161D] border border-white/[0.12] hover:border-[#DC2626]/60 rounded-xl transition-colors whitespace-nowrap"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#EF4444]" />
              <span>Tanya WA</span>
            </a>

            <button
              type="button"
              onClick={() => {
                onAddToCart(buildConfiguredProduct());
                onClose();
              }}
              className="btn-sheen inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-xl shadow-[0_1px_0_0_rgba(255,255,255,0.18)_inset] transition-colors whitespace-nowrap cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Masukkan Keranjang</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
