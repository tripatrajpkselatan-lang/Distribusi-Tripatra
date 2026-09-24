import React, { useState, useMemo } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Trash2,
  ListFilter,
  FileSpreadsheet,
  AlertTriangle,
  Search,
  CheckCircle2,
  FileText,
  User,
  Boxes,
  RotateCcw,
  X
} from 'lucide-react';
import { Barang, Karyawan, TransaksiMutasi, MutasiFormRow } from '../types';
import { exportMutasiToExcelFile } from '../storage';

interface MutasiTabProps {
  barangList: Barang[];
  karyawanList: Karyawan[];
  transaksiList: TransaksiMutasi[];
  onExecuteMutasi: (
    tipe: 'IN' | 'OUT',
    pic: string,
    catatan: string,
    items: { barangId: string; qty: number }[]
  ) => void;
  onDeleteTransaksi: (id: string, rollbackStock: boolean) => void;
  onDeleteBatchTransaksi?: (ids: string[], rollbackStock: boolean) => void;
  onClearAllTransaksi: (rollbackStock: boolean) => void;
  onOpenMultiSelectModal: () => void;
  formRows: MutasiFormRow[];
  setFormRows: React.Dispatch<React.SetStateAction<MutasiFormRow[]>>;
  onShowToast: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void;
}

export const MutasiTab: React.FC<MutasiTabProps> = ({
  barangList,
  karyawanList,
  transaksiList,
  onExecuteMutasi,
  onDeleteTransaksi,
  onDeleteBatchTransaksi,
  onClearAllTransaksi,
  onOpenMultiSelectModal,
  formRows,
  setFormRows,
  onShowToast,
}) => {
  const [tipeMutasi, setTipeMutasi] = useState<'IN' | 'OUT'>('IN');
  const [pic, setPic] = useState('');
  const [catatan, setCatatan] = useState('');

  // History Filter
  const [historySearch, setHistorySearch] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');

  // Deletion modals state
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const [singleDeleteTarget, setSingleDeleteTarget] = useState<TransaksiMutasi | null>(null);
  const [singleRollback, setSingleRollback] = useState(true);

  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [batchRollback, setBatchRollback] = useState(true);

  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [clearAllRollback, setClearAllRollback] = useState(false);

  // Selection handlers
  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTxIds(filteredHistory.map((t) => t.id));
    } else {
      setSelectedTxIds([]);
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedTxIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Delete Action Handlers
  const handleConfirmSingleDelete = () => {
    if (!singleDeleteTarget) return;
    onDeleteTransaksi(singleDeleteTarget.id, singleRollback);
    setSelectedTxIds((prev) => prev.filter((id) => id !== singleDeleteTarget.id));
    setSingleDeleteTarget(null);
  };

  const handleConfirmBatchDelete = () => {
    if (selectedTxIds.length === 0) return;
    if (onDeleteBatchTransaksi) {
      onDeleteBatchTransaksi(selectedTxIds, batchRollback);
    } else {
      selectedTxIds.forEach((id) => onDeleteTransaksi(id, batchRollback));
    }
    setSelectedTxIds([]);
    setIsBatchDeleteModalOpen(false);
  };

  const handleConfirmClearAll = () => {
    onClearAllTransaksi(clearAllRollback);
    setSelectedTxIds([]);
    setIsClearAllModalOpen(false);
  };

  // Multi-item form management
  const addRow = (barangId = '') => {
    setFormRows((prev) => [
      ...prev,
      { uid: 'r_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6), barangId, qty: 1 },
    ]);
  };

  const removeRow = (uid: string) => {
    setFormRows((prev) => {
      const next = prev.filter((r) => r.uid !== uid);
      return next.length > 0
        ? next
        : [{ uid: 'r_' + Date.now(), barangId: '', qty: 1 }];
    });
  };

  const updateRowBarang = (uid: string, barangId: string) => {
    setFormRows((prev) =>
      prev.map((r) => (r.uid === uid ? { ...r, barangId } : r))
    );
  };

  const updateRowQty = (uid: string, val: number) => {
    setFormRows((prev) =>
      prev.map((r) => (r.uid === uid ? { ...r, qty: Math.max(1, val) } : r))
    );
  };

  // Summaries
  const validRows = useMemo(() => {
    return formRows.filter((r) => r.barangId && r.barangId.trim() !== '');
  }, [formRows]);

  const totalQty = useMemo(() => {
    return validRows.reduce((sum, r) => sum + (Number(r.qty) || 1), 0);
  }, [validRows]);

  const hasDeficit = useMemo(() => {
    if (tipeMutasi !== 'OUT') return false;
    return validRows.some((r) => {
      const b = barangList.find((item) => item.id === r.barangId);
      return b ? Number(b.stok) < Number(r.qty) : false;
    });
  }, [tipeMutasi, validRows, barangList]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!pic) {
      onShowToast('Pilih PIC / Penanggung Jawab mutasi terlebih dahulu!', 'warning');
      return;
    }

    if (validRows.length === 0) {
      onShowToast('Pilih minimal satu barang pada daftar mutasi!', 'warning');
      return;
    }

    const itemsToProcess = validRows.map((r) => ({
      barangId: r.barangId,
      qty: Number(r.qty) || 1,
    }));

    onExecuteMutasi(tipeMutasi, pic, catatan, itemsToProcess);

    // Reset form
    setCatatan('');
    setFormRows([{ uid: 'r_' + Date.now(), barangId: '', qty: 1 }]);
  };

  // Filtered History
  const filteredHistory = useMemo(() => {
    return transaksiList.filter((t) => {
      const matchType = historyTypeFilter === 'ALL' || t.tipe === historyTypeFilter;
      const matchSearch =
        t.nama.toLowerCase().includes(historySearch.toLowerCase()) ||
        t.kode.toLowerCase().includes(historySearch.toLowerCase()) ||
        t.pic.toLowerCase().includes(historySearch.toLowerCase()) ||
        t.keterangan.toLowerCase().includes(historySearch.toLowerCase());
      return matchType && matchSearch;
    });
  }, [transaksiList, historyTypeFilter, historySearch]);

  const handleExportHistory = () => {
    if (filteredHistory.length === 0) {
      onShowToast('Tidak ada data riwayat transaksi mutasi untuk diekspor.', 'warning');
      return;
    }
    exportMutasiToExcelFile(filteredHistory);
    onShowToast('Riwayat transaksi mutasi berhasil diekspor ke Excel!', 'success');
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* LEFT: Multi-Item Mutasi Form */}
      <div className="xl:col-span-5 bg-white p-5 sm:p-6 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Form Transaksi Mutasi</h3>
                <p className="text-[11px] text-slate-500">
                  Mendukung pilih banyak barang sekaligus dalam 1 transaksi
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
              {validRows.length} Barang Dipilih
            </span>
          </div>

          {/* 1. Tipe Transaksi IN / OUT */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tipe Transaksi
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipeMutasi('IN')}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  tipeMutasi === 'IN'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>Barang MASUK (IN)</span>
              </button>

              <button
                type="button"
                onClick={() => setTipeMutasi('OUT')}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  tipeMutasi === 'OUT'
                    ? 'bg-red-600 text-white border-red-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Barang KELUAR (OUT)</span>
              </button>
            </div>
          </div>

          {/* 2. PIC / Penanggung Jawab */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              PIC / Penanggung Jawab
            </label>
            <div className="relative">
              <select
                value={pic}
                onChange={(e) => setPic(e.target.value)}
                required
                className="w-full py-1.5 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
              >
                <option value="">-- Pilih Karyawan --</option>
                {karyawanList.map((k) => (
                  <option key={k.id} value={k.nama}>
                    {k.badge} - {k.nama} ({k.dept})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Catatan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan / Keperluan Mutasi
            </label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Divisi penerima, vendor pengirim, atau proyek..."
              className="w-full py-1.5 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
            />
          </div>

          {/* 4. Daftar Barang Dinamis */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <span>Daftar Barang Mutasi</span>
                <span className="text-slate-400 font-normal">({formRows.length} baris)</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onOpenMultiSelectModal}
                  className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ListFilter className="w-3 h-3" />
                  <span>Pilih Banyak</span>
                </button>
                <button
                  type="button"
                  onClick={() => addRow()}
                  className="px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Tambah Baris</span>
                </button>
              </div>
            </div>

            {/* Rows List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {formRows.map((row, idx) => {
                const selectedItem = barangList.find((b) => b.id === row.barangId);
                const currentStok = selectedItem ? Number(selectedItem.stok) : 0;
                const qtyVal = Number(row.qty) || 1;
                const satuan = selectedItem ? selectedItem.satuan : 'Unit';

                const estimatedStock =
                  tipeMutasi === 'IN' ? currentStok + qtyVal : currentStok - qtyVal;
                const isDeficit = tipeMutasi === 'OUT' && estimatedStock < 0;

                return (
                  <div
                    key={row.uid}
                    className={`p-3 rounded-xl border text-xs transition-colors ${
                      isDeficit
                        ? 'border-red-300 bg-red-50/40'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-700 text-[11px]">
                        Item #{idx + 1}
                        {selectedItem && (
                          <span className="ml-1.5 font-mono text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            {selectedItem.kode}
                          </span>
                        )}
                      </span>
                      {formRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(row.uid)}
                          className="text-slate-400 hover:text-red-600 p-0.5 rounded transition-colors cursor-pointer"
                          title="Hapus baris barang ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="mb-2">
                      <select
                        value={row.barangId}
                        onChange={(e) => updateRowBarang(row.uid, e.target.value)}
                        required
                        className="w-full py-1.5 px-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
                      >
                        <option value="">-- Pilih Barang dari Stok Gudang --</option>
                        {barangList.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.kode} - {b.nama} (Stok: {b.stok} {b.satuan})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2 items-center">
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-1">
                          Jumlah ({satuan})
                        </span>
                        <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden">
                          <button
                            type="button"
                            onClick={() => updateRowQty(row.uid, qtyVal - 1)}
                            className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 transition-colors font-bold cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={row.qty}
                            onChange={(e) => updateRowQty(row.uid, parseInt(e.target.value, 10) || 1)}
                            className="w-full text-center text-xs font-bold text-slate-900 focus:outline-none py-1"
                          />
                          <button
                            type="button"
                            onClick={() => updateRowQty(row.uid, qtyVal + 1)}
                            className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 transition-colors font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="text-center p-2 rounded-lg bg-white border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 block">Stok &rarr; Sisa</span>
                        <div className="font-bold text-xs mt-0.5 tabular-nums">
                          <span className="text-slate-500">{currentStok}</span> &rarr;{' '}
                          <span className={isDeficit ? 'text-red-600' : 'text-blue-600'}>
                            {estimatedStock} {satuan}
                          </span>
                        </div>
                        {isDeficit && (
                          <span className="text-[10px] font-bold text-red-600 block mt-0.5">
                            Defisit (-{Math.abs(estimatedStock)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Realtime Summary Card */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between items-center text-slate-600">
              <span>Total Jenis Barang:</span>
              <strong className="text-slate-900">{validRows.length} Jenis</strong>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Total Kuantitas Mutasi:</span>
              <strong className="text-blue-600 tabular-nums">{totalQty} Unit</strong>
            </div>
            {hasDeficit && (
              <div className="p-2 mt-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[11px] font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>Ada barang yang jumlah keluarnya melebihi stok gudang!</span>
              </div>
            )}
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-500/30 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Proses & Simpan Mutasi ({validRows.length} Barang)</span>
          </button>
        </form>
      </div>

      {/* RIGHT: History Log Table */}
      <div className="xl:col-span-7 bg-white p-5 sm:p-6 rounded-xl border border-slate-200/80 shadow-xs flex flex-col">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Riwayat Transaksi IN-OUT</h3>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {transaksiList.length} Transaksi
              </span>
            </div>
            <p className="text-xs text-slate-500">Log mutasi barang masuk dan keluar tercatat</p>
          </div>
          <div className="flex items-center flex-wrap gap-2">
            <select
              value={historyTypeFilter}
              onChange={(e) => setHistoryTypeFilter(e.target.value as 'ALL' | 'IN' | 'OUT')}
              className="py-1.5 px-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-700 bg-white"
            >
              <option value="ALL">Semua Tipe</option>
              <option value="IN">Hanya MASUK (IN)</option>
              <option value="OUT">Hanya KELUAR (OUT)</option>
            </select>
            <button
              onClick={handleExportHistory}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Ekspor ke Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Ekspor Excel</span>
            </button>
            {selectedTxIds.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setBatchRollback(true);
                  setIsBatchDeleteModalOpen(true);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer animate-in fade-in"
                title={`Hapus ${selectedTxIds.length} transaksi terpilih`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Terpilih ({selectedTxIds.length})</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setClearAllRollback(false);
                setIsClearAllModalOpen(true);
              }}
              disabled={transaksiList.length === 0}
              className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Hapus semua riwayat transaksi mutasi"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Semua</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            placeholder="Cari transaksi berdasarkan kode, nama barang, atau PIC..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
          />
        </div>

        {/* Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden flex-1 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3 text-center w-8">
                  <input
                    type="checkbox"
                    checked={
                      filteredHistory.length > 0 &&
                      filteredHistory.every((t) => selectedTxIds.includes(t.id))
                    }
                    onChange={(e) => handleToggleSelectAll(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    title="Pilih Semua Baris"
                  />
                </th>
                <th className="p-3">Waktu</th>
                <th className="p-3">Tipe</th>
                <th className="p-3">Barang</th>
                <th className="p-3 text-center">Jumlah</th>
                <th className="p-3 text-center">Stok Awal</th>
                <th className="p-3 text-center">Sisa</th>
                <th className="p-3">PIC</th>
                <th className="p-3">Keterangan</th>
                <th className="p-3 text-center w-14">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    Belum ada riwayat transaksi mutasi yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((t) => {
                  const isChecked = selectedTxIds.includes(t.id);
                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isChecked ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRow(t.id)}
                          className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {t.tanggal}
                      </td>
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
                      <td className="p-3 text-center font-bold tabular-nums">
                        <span className={t.tipe === 'IN' ? 'text-emerald-600' : 'text-red-600'}>
                          {t.tipe === 'IN' ? '+' : '-'}
                          {t.qty}
                        </span>
                      </td>
                      <td className="p-3 text-center text-slate-400 tabular-nums">{t.stokAwal}</td>
                      <td className="p-3 text-center font-bold text-slate-900 tabular-nums">
                        {t.stokAkhir}
                      </td>
                      <td className="p-3 text-slate-600">
                        <span className="inline-flex items-center gap-1 text-[11px]">
                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{t.pic}</span>
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 text-[11px]">{t.keterangan}</td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSingleDeleteTarget(t);
                            setSingleRollback(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus riwayat transaksi ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL 1: Single Delete Modal --- */}
      {singleDeleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-start justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Hapus Riwayat Transaksi</h3>
                  <p className="text-xs text-slate-500">Konfirmasi penghapusan data mutasi barang</p>
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
              {/* Transaction Detail Card */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                      singleDeleteTarget.tipe === 'IN'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {singleDeleteTarget.tipe === 'IN' ? 'Barang Masuk (IN)' : 'Barang Keluar (OUT)'}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    {singleDeleteTarget.tanggal}
                  </span>
                </div>
                <div className="font-semibold text-slate-900 text-sm mb-0.5">
                  {singleDeleteTarget.nama}
                </div>
                <div className="text-[11px] text-slate-500">
                  Kode: <span className="font-mono text-slate-700">{singleDeleteTarget.kode}</span> | Jumlah: <strong className="text-slate-800">{singleDeleteTarget.qty}</strong> | PIC: <span className="text-slate-700">{singleDeleteTarget.pic}</span>
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

      {/* --- MODAL 2: Batch Delete Modal --- */}
      {isBatchDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-start justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Hapus {selectedTxIds.length} Transaksi Terpilih
                  </h3>
                  <p className="text-xs text-slate-500">Konfirmasi hapus beberapa data mutasi sekaligus</p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchDeleteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 text-xs text-slate-600 space-y-3.5">
              <p>
                Apakah Anda yakin ingin menghapus <strong>{selectedTxIds.length} data riwayat transaksi</strong> yang dipilih?
              </p>

              {/* Rollback Option Toggle */}
              <label className="flex items-start gap-2.5 p-3 rounded-lg border border-blue-200 bg-blue-50/50 cursor-pointer hover:bg-blue-50 transition-colors">
                <input
                  type="checkbox"
                  checked={batchRollback}
                  onChange={(e) => setBatchRollback(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 block">
                    Kembalikan (Rollback) stok barang terpilih di gudang
                  </span>
                  <span className="text-slate-600 text-[11px] block mt-0.5 leading-relaxed">
                    {batchRollback
                      ? 'Stok seluruh barang yang terlibat dalam transaksi terpilih akan disesuaikan kembali (IN dikurangi, OUT ditambah).'
                      : 'Hanya menghapus catatan riwayat transaksi terpilih. Kuantitas stok gudang saat ini tetap tidak berubah.'}
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBatchDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus {selectedTxIds.length} Transaksi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: Clear All Modal --- */}
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
