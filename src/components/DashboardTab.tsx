import React, { useMemo, useState } from 'react';
import {
  Boxes,
  CheckCircle2,
  AlertTriangle,
  ArrowLeftRight,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRight,
  PackageOpen,
  Trash2,
  X,
} from 'lucide-react';
import { Barang, TransaksiMutasi } from '../types';
import { D3StockMovementChart } from './D3StockMovementChart';

interface DashboardTabProps {
  barangList: Barang[];
  transaksiList: TransaksiMutasi[];
  onOpenKritisModal: () => void;
  onNavigateToMutasi: () => void;
  onDeleteTransaksi?: (id: string, rollbackStock: boolean) => void;
  onClearAllTransaksi?: (rollbackStock: boolean) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  barangList,
  transaksiList,
  onOpenKritisModal,
  onNavigateToMutasi,
  onDeleteTransaksi,
  onClearAllTransaksi,
}) => {
  // Delete state
  const [singleDeleteTarget, setSingleDeleteTarget] = useState<TransaksiMutasi | null>(null);
  const [singleRollback, setSingleRollback] = useState(true);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [clearAllRollback, setClearAllRollback] = useState(false);

  // Compute Stats
  const totalBarang = barangList.length;
  const readyCount = useMemo(() => {
    return barangList.filter((b) => Number(b.stok) > Number(b.minStok)).length;
  }, [barangList]);

  const criticalItems = useMemo(() => {
    return barangList.filter((b) => Number(b.stok) <= Number(b.minStok));
  }, [barangList]);

  const reorderCount = criticalItems.length;
  const totalTransaksi = transaksiList.length;

  const recentFive = useMemo(() => {
    return [...transaksiList].slice(0, 5);
  }, [transaksiList]);

  const handleConfirmSingleDelete = () => {
    if (!singleDeleteTarget || !onDeleteTransaksi) return;
    onDeleteTransaksi(singleDeleteTarget.id, singleRollback);
    setSingleDeleteTarget(null);
  };

  const handleConfirmClearAll = () => {
    if (!onClearAllTransaksi) return;
    onClearAllTransaksi(clearAllRollback);
    setIsClearAllModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Barang */}
        <div className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Jenis Barang
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {totalBarang}
            </div>
            <span className="text-xs text-slate-500 mt-0.5 block">Item terdaftar di gudang</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        {/* Barang Ready */}
        <div className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Barang Ready
            </span>
            <div className="text-2xl font-bold text-emerald-600 mt-1 tabular-nums">
              {readyCount}
            </div>
            <span className="text-xs text-slate-500 mt-0.5 block">Stok aman & siap diambil</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Barang Re-Order (Clickable) */}
        <div
          onClick={onOpenKritisModal}
          className="p-5 bg-white rounded-xl border border-amber-200 shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
          title="Klik untuk melihat detail barang re-order dan ekspor Excel"
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block flex items-center gap-1">
              <span>Barang Re-Order</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
            <div className="text-2xl font-bold text-amber-600 mt-1 tabular-nums">
              {reorderCount}
            </div>
            <span className="text-xs text-amber-700 mt-0.5 block">Perlu dipesan ulang &rarr;</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Total Transaksi */}
        <div className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Transaksi
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {totalTransaksi}
            </div>
            <span className="text-xs text-slate-500 mt-0.5 block">Mutasi IN & OUT tercatat</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Middle Grid: Chart & Status Persediaan Kritis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* D3 Data Visualization: Monthly/Daily Stock Movement Bar Chart */}
        <div className="lg:col-span-8">
          <D3StockMovementChart
            transaksiList={transaksiList}
            barangList={barangList}
          />
        </div>

        {/* Status Persediaan Kritis Box */}
        <div className="lg:col-span-4 bg-white p-5 sm:p-6 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Status Persediaan Kritis</h3>
              <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full tabular-nums">
                {reorderCount} Item Kritis
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Item persediaan yang berada di bawah atau sama dengan batas minimum stok (Re-Order).
            </p>
          </div>

          {/* Big Clickable Action Tile */}
          <div
            onClick={onOpenKritisModal}
            className="my-5 p-5 rounded-xl border border-red-200 bg-red-50/40 hover:bg-red-50/80 hover:border-red-300 transition-all text-center cursor-pointer group"
          >
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-500/20 mb-3 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Jumlah Barang Kritis
            </span>
            <div className="text-4xl font-extrabold text-red-600 tabular-nums mb-1 font-mono">
              {reorderCount}
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Perlu segera dibuatkan Purchase Order (PO) atau restok ulang
            </p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 group-hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors">
              <span>Buka Rincian & Ekspor Excel</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Klik kotak untuk melihat daftar lengkap</span>
            <button
              onClick={onOpenKritisModal}
              className="text-red-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Selengkapnya</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 5 Mutasi Terakhir Table */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PackageOpen className="w-4 h-4 text-blue-600" />
              <span>5 Mutasi Transaksi Terakhir</span>
            </h3>
            <p className="text-xs text-slate-500">Aktivitas barang masuk dan keluar terbaru</p>
          </div>
          <div className="flex items-center gap-2">
            {transaksiList.length > 0 && onClearAllTransaksi && (
              <button
                onClick={() => setIsClearAllModalOpen(true)}
                className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Hapus semua riwayat transaksi mutasi"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Semua</span>
              </button>
            )}
            <button
              onClick={onNavigateToMutasi}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Lihat Semua Mutasi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Waktu</th>
                <th className="p-3">Tipe</th>
                <th className="p-3">Nama Barang</th>
                <th className="p-3 text-center">Jumlah</th>
                <th className="p-3">PIC / Penanggung Jawab</th>
                <th className="p-3 text-center">Sisa Stok</th>
                <th className="p-3 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentFive.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    Belum ada catatan mutasi transaksi.
                  </td>
                </tr>
              ) : (
                recentFive.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-slate-500 font-mono text-[11px]">{t.tanggal}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                          t.tipe === 'IN'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {t.tipe === 'IN' ? (
                          <ArrowDownRight className="w-3 h-3" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3" />
                        )}
                        {t.tipe}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{t.nama}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{t.kode}</div>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`font-bold tabular-nums ${
                          t.tipe === 'IN' ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {t.tipe === 'IN' ? '+' : '-'}
                        {t.qty}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{t.pic}</td>
                    <td className="p-3 text-center font-bold text-slate-800 tabular-nums">
                      {t.stokAkhir}
                    </td>
                    <td className="p-3 text-center">
                      {onDeleteTransaksi && (
                        <button
                          type="button"
                          onClick={() => {
                            setSingleDeleteTarget(t);
                            setSingleRollback(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                          title="Hapus mutasi ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Single Delete */}
      {singleDeleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-start justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Hapus Transaksi Mutasi</h3>
                  <p className="text-xs text-slate-500">Konfirmasi penghapusan data mutasi</p>
                </div>
              </div>
              <button
                onClick={() => setSingleDeleteTarget(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 text-xs text-slate-600 space-y-3.5">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Waktu:</span>
                  <span className="font-mono">{singleDeleteTarget.tanggal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Barang:</span>
                  <span className="font-semibold text-slate-900">{singleDeleteTarget.nama}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tipe & Jumlah:</span>
                  <span
                    className={`font-bold ${
                      singleDeleteTarget.tipe === 'IN' ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {singleDeleteTarget.tipe} ({singleDeleteTarget.qty} unit)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">PIC:</span>
                  <span>{singleDeleteTarget.pic}</span>
                </div>
              </div>

              {/* Rollback Option Toggle */}
              <label className="flex items-start gap-2.5 p-3 rounded-lg border border-blue-200 bg-blue-50/50 cursor-pointer hover:bg-blue-50 transition-colors">
                <input
                  type="checkbox"
                  checked={singleRollback}
                  onChange={(e) => setSingleRollback(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 block">
                    Kembalikan (Rollback) stok barang di gudang
                  </span>
                  <span className="text-slate-600 text-[11px] block mt-0.5 leading-relaxed">
                    {singleRollback ? (
                      singleDeleteTarget.tipe === 'IN' ? (
                        <span className="text-amber-800">
                          Stok inventaris barang akan <strong>dikurangi {singleDeleteTarget.qty}</strong> untuk membatalkan barang masuk.
                        </span>
                      ) : (
                        <span className="text-emerald-800">
                          Stok inventaris barang akan <strong>ditambah kembali {singleDeleteTarget.qty}</strong> untuk mengembalikan barang keluar.
                        </span>
                      )
                    ) : (
                      'Hanya menghapus riwayat log transaksi. Kuantitas stok gudang saat ini tidak akan berubah.'
                    )}
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSingleDeleteTarget(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Transaksi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Clear All */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-start justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Hapus Semua Riwayat Transaksi?
                  </h3>
                  <p className="text-xs text-slate-500">Pembersihan seluruh riwayat mutasi IN-OUT</p>
                </div>
              </div>
              <button
                onClick={() => setIsClearAllModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 text-xs text-slate-600 space-y-3.5">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs">
                <strong>Peringatan Penting:</strong> Anda akan menghapus seluruh{' '}
                <strong>{transaksiList.length} catatan riwayat transaksi mutasi</strong>. Tindakan ini tidak dapat dibatalkan.
              </div>

              {/* Rollback Option Toggle */}
              <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/70 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={clearAllRollback}
                  onChange={(e) => setClearAllRollback(e.target.checked)}
                  className="mt-0.5 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 block">
                    Kembalikan juga (Rollback) kuantitas stok seluruh barang
                  </span>
                  <span className="text-slate-600 text-[11px] block mt-0.5 leading-relaxed">
                    {clearAllRollback
                      ? 'Stok seluruh barang akan dihitung mundur membatalkan semua mutasi. Gunakan opsi ini jika ingin mereset dampak mutasi pada stok.'
                      : 'Rekomendasi default: Hanya mengosongkan catatan riwayat log mutasi (misal tutup buku periode). Kuantitas stok gudang saat ini tetap dipertahankan.'}
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Semua Riwayat</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
