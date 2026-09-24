import React, { useState, useMemo } from 'react';
import { Search, Boxes, Check, X } from 'lucide-react';
import { Barang } from '../types';
import { KATEGORI_BARANG_OPTIONS } from '../defaultData';

interface MultiSelectBarangModalProps {
  isOpen: boolean;
  onClose: () => void;
  barangList: Barang[];
  selectedBarangIds: string[];
  onApplySelected: (newSelectedIds: string[]) => void;
}

export const MultiSelectBarangModal: React.FC<MultiSelectBarangModalProps> = ({
  isOpen,
  onClose,
  barangList,
  selectedBarangIds,
  onApplySelected,
}) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [selectedSet, setSelectedSet] = useState<Set<string>>(new Set(selectedBarangIds));

  // Sync initial state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedSet(new Set(selectedBarangIds));
      setSearch('');
      setCategory('ALL');
    }
  }, [isOpen, selectedBarangIds]);

  const filteredBarang = useMemo(() => {
    return barangList.filter((b) => {
      const matchSearch =
        b.nama.toLowerCase().includes(search.toLowerCase()) ||
        b.kode.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === 'ALL' || b.kategori === category;
      return matchSearch && matchCat;
    });
  }, [barangList, search, category]);

  if (!isOpen) return null;

  const toggleItem = (id: string) => {
    const next = new Set(selectedSet);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedSet(next);
  };

  const toggleSelectAllFiltered = (checked: boolean) => {
    const next = new Set(selectedSet);
    filteredBarang.forEach((b) => {
      if (checked) {
        next.add(b.id);
      } else {
        next.delete(b.id);
      }
    });
    setSelectedSet(next);
  };

  const isAllFilteredSelected =
    filteredBarang.length > 0 && filteredBarang.every((b) => selectedSet.has(b.id));

  const handleApply = () => {
    onApplySelected(Array.from(selectedSet));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Pilih Banyak Barang Sekaligus</h3>
              <p className="text-xs text-slate-500">
                Centang item barang yang ingin Anda masukkan ke form transaksi mutasi
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

        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode atau nama barang inventaris..."
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

        {/* Batch Select Toolbar */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
            <input
              type="checkbox"
              checked={isAllFilteredSelected}
              onChange={(e) => toggleSelectAllFiltered(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span>Pilih Semua yang Ditampilkan</span>
          </label>
          <span className="font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
            {selectedSet.size} Barang Dipilih
          </span>
        </div>

        {/* List Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredBarang.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Tidak ada data barang yang sesuai dengan kata kunci pencarian.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3 w-10 text-center">Pilih</th>
                    <th className="p-3">Kode</th>
                    <th className="p-3">Nama Barang</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3">Stok Saat Ini</th>
                    <th className="p-3">Lokasi Rak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBarang.map((b) => {
                    const isChecked = selectedSet.has(b.id);
                    return (
                      <tr
                        key={b.id}
                        onClick={() => toggleItem(b.id)}
                        className={`cursor-pointer transition-colors ${
                          isChecked ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleItem(b.id)}
                            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-700">{b.kode}</td>
                        <td className="p-3 font-semibold text-slate-900">{b.nama}</td>
                        <td className="p-3 text-slate-500">{b.kategori}</td>
                        <td className="p-3">
                          <span
                            className={`font-semibold tabular-nums ${
                              b.stok > b.minStok ? 'text-slate-900' : 'text-red-600'
                            }`}
                          >
                            {b.stok} {b.satuan}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">{b.lokasi}</td>
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
          <span className="text-xs text-slate-500">
            Centang barang yang diinginkan, lalu klik Tambahkan.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Tambahkan ke Form ({selectedSet.size})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
