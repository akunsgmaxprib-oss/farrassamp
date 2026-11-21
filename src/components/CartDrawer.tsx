import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Copy, MessageCircle, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { createOrder } from '../lib/storeApi';
import { resolveProductImageUrl } from '../data/starterCatalog';
import {
  CartItem,
  FIELD_LIMITS,
  PAYMENT_METHODS,
  PaymentMethod,
} from '../types/store';
import {
  buildWhatsappOrderUrl,
  createOrderCode,
  formatIDR,
} from '../utils/format';

interface CartDrawerProps {
  open: boolean;
  items: CartItem[];
  storeWhatsapp: string;
  onClose: () => void;
  onUpdateQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

interface ConfirmedReceipt {
  orderCode: string;
  customerName: string;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  whatsappUrl: string;
  summaryText: string;
}

export function CartDrawer({
  open,
  items,
  storeWhatsapp,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
}: CartDrawerProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('QRIS');
  const [customerNote, setCustomerNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [receipt, setReceipt] = useState<ConfirmedReceipt | null>(null);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.qty,
    0
  );

  async function handleCheckoutSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    const cleanName = customerName.trim().slice(0, FIELD_LIMITS.ORDER_NAME_MAX);
    const cleanWa = customerWhatsapp.trim().slice(0, FIELD_LIMITS.ORDER_WA_MAX);
    const cleanNote = customerNote.trim().slice(0, FIELD_LIMITS.ORDER_NOTE_MAX);

    if (cleanName.length < 2) {
      setFormError('Masukkan nama lengkap minimal 2 karakter.');
      return;
    }
    if (cleanWa.length < 6) {
      setFormError('Masukkan nomor WhatsApp yang aktif untuk konfirmasi.');
      return;
    }
    if (items.length === 0) {
      setFormError('Keranjang masih kosong.');
      return;
    }

    setSubmitting(true);
    const orderCode = createOrderCode();
    const orderItems = items.slice(0, 20).map((entry) => ({
      productId: entry.product.id.slice(0, 128),
      title: entry.product.title.slice(0, FIELD_LIMITS.PRODUCT_TITLE_MAX),
      price: entry.product.price,
      qty: Math.min(99, Math.max(1, entry.qty)),
    }));

    try {
      await createOrder({
        orderCode,
        customerName: cleanName,
        customerWhatsapp: cleanWa,
        paymentMethod,
        ...(cleanNote ? { customerNote: cleanNote } : {}),
        items: orderItems,
        totalAmount: subtotal,
      });
    } catch (error) {
      setSubmitting(false);
      setFormError(
        error instanceof Error
          ? error.message
          : 'Gagal menyimpan pesanan. Silakan periksa koneksi dan coba lagi.'
      );
      return;
    }

    const whatsappUrl = buildWhatsappOrderUrl(storeWhatsapp, {
      orderCode,
      customerName: cleanName,
      paymentMethod,
      items: orderItems,
      totalAmount: subtotal,
      customerNote: cleanNote,
    });

    const summaryText = [
      `Pesanan ${orderCode} — RA STORE`,
      `Nama: ${cleanName}`,
      `Pembayaran: ${paymentMethod}`,
      ...orderItems.map((i) => `- ${i.title} (${i.qty}x) ${formatIDR(i.price * i.qty)}`),
      `Total: ${formatIDR(subtotal)}`,
    ].join('\n');

    setReceipt({
      orderCode,
      customerName: cleanName,
      paymentMethod,
      totalAmount: subtotal,
      whatsappUrl,
      summaryText,
    });
    onClearCart();
    setSubmitting(false);
  }

  function handleCopySummary() {
    if (!receipt) return;
    navigator.clipboard.writeText(receipt.summaryText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex justify-end"
      onClick={onClose}
    >
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label="Keranjang Belanja RA STORE"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md bg-[#111318] h-full flex flex-col border-l border-white/[0.1] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#EF4444]" />
            <h2 className="font-display text-lg font-bold text-[#F5F5F7] tracking-tight">
              Keranjang Belanja
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup keranjang"
            className="w-9 h-9 inline-flex items-center justify-center rounded-xl text-[#9CA3AF] hover:text-white hover:bg-white/[0.06] cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {receipt ? (
            <div className="bg-[#090A0D] border border-white/[0.08] rounded-2xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-mono text-[#A1A1AA]">
                    {receipt.orderCode}
                  </p>
                  <h3 className="font-display text-lg font-bold text-[#F4F4F5]">
                    Pesanan Berhasil Dicatat
                  </h3>
                  <p className="text-sm text-[#A1A1AA] mt-1 leading-relaxed">
                    Terima kasih, {receipt.customerName}. Pesanan Anda telah masuk ke
                    sistem RA STORE dengan metode {receipt.paymentMethod}.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#232730] flex items-center justify-between text-sm">
                <span className="text-[#A1A1AA]">Total Pembayaran</span>
                <span className="font-mono font-semibold text-[#F4F4F5] tabular-nums">
                  {formatIDR(receipt.totalAmount)}
                </span>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                <a
                  href={receipt.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Konfirmasi ke WhatsApp Farrassamp</span>
                </a>
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-[#F4F4F5] bg-[#14161B] border border-[#232730] hover:border-[#3F4554] rounded-lg transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Ringkasan Disalin' : 'Salin Ringkasan Pesanan'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReceipt(null);
                    onClose();
                  }}
                  className="text-xs text-[#A1A1AA] hover:text-white py-2 cursor-pointer"
                >
                  Kembali ke Toko
                </button>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingBag className="w-10 h-10 text-[#A1A1AA] mx-auto mb-3 opacity-60" />
              <p className="font-semibold text-[#F4F4F5]">
                Keranjang Anda masih kosong
              </p>
              <p className="text-sm text-[#A1A1AA] mt-1">
                Pilih produk dari katalog RA STORE untuk mulai memesan.
              </p>
            </div>
          ) : (
            <>
              {/* Item List */}
              <div className="divide-y divide-[#232730]">
                {items.map(({ product, qty }) => (
                  <div key={product.id} className="py-4 first:pt-0 flex gap-3.5">
                    <img
                      src={resolveProductImageUrl(product.imageUrl)}
                      alt={product.title}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-lg object-cover bg-[#0B0C0F] shrink-0 border border-[#232730]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#F4F4F5] truncate">
                        {product.title}
                      </p>
                      <p className="font-mono text-xs text-[#A1A1AA] tabular-nums mt-0.5">
                        {formatIDR(product.price)}
                      </p>
                      <div className="flex items-center justify-between mt-2.5">
                        <div className="inline-flex items-center border border-[#232730] rounded-lg bg-[#0B0C0F]">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(product.id, -1)}
                            aria-label="Kurangi jumlah"
                            className="w-7 h-7 inline-flex items-center justify-center text-[#F4F4F5] hover:bg-[#1C1F26] rounded-l-lg cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 font-mono text-xs tabular-nums text-[#F4F4F5]">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(product.id, 1)}
                            aria-label="Tambah jumlah"
                            className="w-7 h-7 inline-flex items-center justify-center text-[#F4F4F5] hover:bg-[#1C1F26] rounded-r-lg cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(product.id)}
                          aria-label={`Hapus ${product.title}`}
                          className="p-1.5 text-[#A1A1AA] hover:text-[#EF4444] cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Checkout Form */}
              <form
                id="checkout-form"
                onSubmit={handleCheckoutSubmit}
                className="pt-4 border-t border-[#232730] space-y-4"
              >
                <h3 className="text-sm font-semibold text-[#F4F4F5]">
                  Data Pemesan &amp; Pembayaran
                </h3>

                {formError && (
                  <p className="text-xs text-red-300 bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">
                    {formError}
                  </p>
                )}

                <div>
                  <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={FIELD_LIMITS.ORDER_NAME_MAX}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#0B0C0F] border border-[#232730] text-[#F4F4F5] placeholder:text-[#71717A] rounded-lg focus:outline-none focus:border-[#DC2626]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                    Nomor WhatsApp Aktif
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={FIELD_LIMITS.ORDER_WA_MAX}
                    value={customerWhatsapp}
                    onChange={(e) => setCustomerWhatsapp(e.target.value)}
                    placeholder="0857xxxxxxxx"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#0B0C0F] border border-[#232730] text-[#F4F4F5] placeholder:text-[#71717A] rounded-lg focus:outline-none focus:border-[#DC2626]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                    Metode Pembayaran
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_METHODS.map((method) => {
                      const active = paymentMethod === method;
                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`px-3 py-2 text-xs font-medium rounded-lg border text-center transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#DC2626] text-white border-[#DC2626]'
                              : 'bg-[#0B0C0F] text-[#A1A1AA] border-[#232730] hover:text-white'
                          }`}
                        >
                          {method}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                    Catatan / Username Discord (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    maxLength={FIELD_LIMITS.ORDER_NOTE_MAX}
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="Catatan order, email, atau username Discord..."
                    className="w-full px-3.5 py-2 text-sm bg-[#0B0C0F] border border-[#232730] text-[#F4F4F5] placeholder:text-[#71717A] rounded-lg focus:outline-none focus:border-[#DC2626]"
                  />
                </div>
              </form>
            </>
          )}
        </div>

        {/* Sticky Checkout Footer */}
        {!receipt && items.length > 0 && (
          <div className="p-6 border-t border-white/[0.08] bg-[#090A0D] space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#9CA3AF]">Subtotal</span>
              <span className="font-mono text-base font-bold text-[#F5F5F7] tabular-nums">
                {formatIDR(subtotal)}
              </span>
            </div>
            <button
              type="submit"
              form="checkout-form"
              disabled={submitting}
              className="w-full py-3 px-4 text-sm font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Memproses Pesanan...' : 'Buat Pesanan Sekarang'}
            </button>
          </div>
        )}
      </motion.aside>
    </div>
  );
}
