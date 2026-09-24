import React, { useState, useMemo } from 'react';
import { AlertTriangle, Search, FileSpreadsheet, X, Plus, CheckCircle2 } from 'lucide-react';
import { Barang } from '../types';
import { exportPersediaanKritisToExcelFile } from '../storage';
import { KATEGORI_BARANG_OPTIONS } from '../defaultData';

interface PersediaanKritisModalProps {
  isOpen: boolean;
  onClose: () => void;
  barangList: Barang[];
  onQuickMutasiIn: (barangId: string) => void;
  onShowToast: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void;
}

export const PersediaanKritisModal: React.FC<PersediaanKritisModalProps> = ({
  isOpen,
  onClose,
  barangList,
  onQuickMutasiIn,
  onShowToast,
}) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');

  const allCritical = useMemo(() => {
    return barangList.filter((b) => Number(b.stok) <= Number(b.minStok));
  }, [barangList]);

  const filteredCritical = useMemo(() => {
    return allCritical.filter((b) => {
      const matchSearch =
        b.nama.toLowerCase().includes(search.toLowerCase()) ||
        b.kode.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === 'ALL' || b.kategori === category;
      return matchSearch && matchCat;
    });
  }, [allCritical, search, category]);

  const totalDeficit = useMemo(() => {
    return allCritical.reduce((sum, b) => sum + Math.max(0, b.minStok - b.stok), 0);
  }, [allCritical]);

  if (!isOpen) return null;

  const handleExportExcel = () => {
    if (allCritical.length === 0) {
      onShowToast('Tidak ada barang berstatus kritis saat ini.', 'warning');
      return;
    }
    exportPersediaanKritisToExcelFile(allCritical);
    onShowToast('Laporan Persediaan Kritis berhasil diekspor ke Excel!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-red-100 bg-red-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600 text-white rounded-xl shadow-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Daftar Status Persediaan Kritis (Re-Order)</h3>
              <p className="text-xs text-slate-500">
                Barang dengan jumlah stok saat ini $\le$ batas minimum pemesanan ulang
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Stats bar inside modal */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-5 border-b border-slate-100 bg-slate-50/60">
          <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
            <span className="text-[11px] text-slate-500 block">Total Item Kritis</span>
            <span className="text-xl font-bold text-red-600 tabular-nums">{allCritical.length} Item</span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
            <span className="text-[11px] text-slate-500 block">Total Defisit Kebutuhan</span>
            <span className="text-xl font-bold text-blue-600 tabular-nums">{totalDeficit} Unit</span>
          </div>
          <div className="flex items-center">
            <button
              onClick={handleExportExcel}
              className="w-full h-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor ke Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode atau nama barang kritis..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
            />
          </div>
          <div className="sm:col-span-4">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full py-1.5 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-700 bg-white"
            >
              <option value="ALL">Semua Kategori</option>
              {KATEGORI_BARANG_OPTIONS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredCritical.length === 0 ? (
            <div className="py-12 text-center">
              {allCritical.length === 0 ? (
                <div className="space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <p className="text-sm font-semibold text-slate-800">Semua persediaan dalam kondisi aman!</p>
                  <p className="text-xs text-slate-500">Tidak ada barang yang berada di bawah batas minimum stok.</p>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Tidak ada barang kritis sesuai filter pencarian.</p>
              )}
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Kode</th>
                    <th className="p-3">Nama Barang</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3 text-center">Stok</th>
                    <th className="p-3 text-center">Min Stok</th>
                    <th className="p-3 text-center">Defisit</th>
                    <th className="p-3">Lokasi Rak</th>
                    <th className="p-3 text-center">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCritical.map((b) => {
                    const deficit = Math.max(0, b.minStok - b.stok);
                    return (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-700">{b.kode}</td>
                        <td className="p-3 font-semibold text-slate-900">{b.nama}</td>
                        <td className="p-3 text-slate-500">{b.kategori}</td>
                        <td className="p-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold tabular-nums">
                            {b.stok} {b.satuan}
                          </span>
                        </td>
                        <td className="p-3 text-center text-slate-500 tabular-nums">
                          {b.minStok} {b.satuan}
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-semibold text-red-600 tabular-nums">
                            -{deficit} {b.satuan}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">{b.lokasi}</td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              onQuickMutasiIn(b.id);
                              onClose();
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center justify-center gap-1 mx-auto cursor-pointer"
                            title="Buka form mutasi masuk untuk item ini"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Mutasi IN</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Menampilkan <strong className="text-slate-800 tabular-nums">{filteredCritical.length}</strong> dari{' '}
            <strong className="text-slate-800 tabular-nums">{allCritical.length}</strong> barang kritis
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
