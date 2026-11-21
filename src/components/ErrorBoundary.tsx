import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Terjadi kendala saat memuat data toko.',
    };
  }

  componentDidCatch(error: Error) {
    console.error('RA STORE ErrorBoundary:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#090A0D] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#111318] border border-white/[0.08] rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#DC2626]/15 text-[#EF4444] flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold text-[#F5F5F7] mb-2">
              Terjadi Gangguan Koneksi
            </h2>
            <p className="text-sm text-[#9CA3AF] mb-6 leading-relaxed">
              Sistem mengalami kesalahan saat memproses permintaan. Silakan muat ulang halaman.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#DC2626] text-white text-sm font-medium rounded-xl hover:bg-[#B91C1C] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
