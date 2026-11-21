export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function extractYoutubeVideoId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  // Direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    if (url.hostname.includes('youtu.be')) {
      const seg = url.pathname.split('/').filter(Boolean)[0] || '';
      return seg.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);
    }
    const vParam = url.searchParams.get('v');
    if (vParam) {
      return vParam.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);
    }
    const parts = url.pathname.split('/').filter(Boolean);
    const embedIdx = parts.findIndex((p) => p === 'embed' || p === 'shorts' || p === 'live');
    if (embedIdx !== -1 && parts[embedIdx + 1]) {
      return parts[embedIdx + 1].replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);
    }
  } catch {
    // fallback regex
  }

  const match = trimmed.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([a-zA-Z0-9_-]{6,32})/);
  return match ? match[1] : '';
}

export function createSafeDocId(prefix: string): string {
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 16) || 'item';
  const rand = Math.random().toString(36).slice(2, 8);
  return `${cleanPrefix}_${Date.now()}_${rand}`;
}

export function createOrderCode(): string {
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `RA-${suffix}-${Date.now().toString().slice(-4)}`;
}

export function normalizeWhatsappNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    return `62${digits.slice(1)}`;
  }
  return digits;
}

export function buildWhatsappOrderUrl(
  storeWhatsapp: string,
  params: {
    orderCode: string;
    customerName: string;
    paymentMethod: string;
    items: { title: string; qty: number; price: number }[];
    totalAmount: number;
    customerNote?: string;
  }
): string {
  const phone = normalizeWhatsappNumber(storeWhatsapp) || '6281234567890';
  const lines = [
    `Halo Farrassamp (RA STORE), saya ingin konfirmasi pesanan:`,
    `Kode Pesanan: ${params.orderCode}`,
    `Nama: ${params.customerName}`,
    `Metode Bayar: ${params.paymentMethod}`,
    ``,
    `Daftar Item:`,
    ...params.items.map((item) => `- ${item.title} (${item.qty}x) = ${formatIDR(item.price * item.qty)}`),
    ``,
    `Total: ${formatIDR(params.totalAmount)}`,
    params.customerNote ? `Catatan: ${params.customerNote}` : '',
  ].filter(Boolean);

  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function isSafeExternalUrl(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed.startsWith('/')) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function isSafeProductImageUrl(url: string): boolean {
  const trimmed = url.trim();
  if (
    trimmed.length <= 300000 &&
    /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(trimmed)
  ) {
    return true;
  }
  return isSafeExternalUrl(trimmed);
}

export type ProductRecencyBadge = 'Baru' | 'Diperbarui' | null;

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function parseFirestoreTimestampMs(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) return null;
    return value < 1e12 ? value * 1000 : value;
  }
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const ms = Date.parse(trimmed);
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof value === 'object') {
    const obj = value as {
      seconds?: unknown;
      _seconds?: unknown;
      nanoseconds?: unknown;
      _nanoseconds?: unknown;
      toMillis?: () => number;
      toDate?: () => Date;
    };
    if (typeof obj.toMillis === 'function') {
      const ms = obj.toMillis();
      return Number.isFinite(ms) ? ms : null;
    }
    if (typeof obj.toDate === 'function') {
      const ms = obj.toDate().getTime();
      return Number.isFinite(ms) ? ms : null;
    }
    const sec =
      typeof obj.seconds === 'number'
        ? obj.seconds
        : typeof obj._seconds === 'number'
          ? obj._seconds
          : null;
    if (sec !== null && Number.isFinite(sec)) {
      const ns =
        typeof obj.nanoseconds === 'number'
          ? obj.nanoseconds
          : typeof obj._nanoseconds === 'number'
            ? obj._nanoseconds
            : 0;
      return sec * 1000 + Math.floor(ns / 1_000_000);
    }
  }
  return null;
}

export function getProductRecencyBadge(
  product: { createdAt?: unknown; updatedAt?: unknown; isDemo?: boolean },
  nowMs = Date.now()
): ProductRecencyBadge {
  if (product.isDemo) return null;
  const createdMs = parseFirestoreTimestampMs(product.createdAt);
  const updatedMs = parseFirestoreTimestampMs(product.updatedAt);

  const isWithin24h = (ts: number | null): boolean =>
    ts !== null && ts <= nowMs + 5 * 60 * 1000 && nowMs - ts <= TWENTY_FOUR_HOURS_MS;

  const createdRecent = isWithin24h(createdMs);
  const updatedRecent = isWithin24h(updatedMs);

  if (
    updatedRecent &&
    updatedMs !== null &&
    (createdMs === null || updatedMs - createdMs > 60_000)
  ) {
    return 'Diperbarui';
  }
  if (createdRecent) {
    return 'Baru';
  }
  if (updatedRecent) {
    return 'Diperbarui';
  }
  return null;
}
