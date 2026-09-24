import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  FileSpreadsheet,
  Upload,
  Download,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  MapPin,
  ChevronDown,
  Filter,
  Layers,
  Tag
} from 'lucide-react';
import { Barang } from '../types';
import { KATEGORI_BARANG_OPTIONS } from '../defaultData';
import { exportBarangToExcelFile, exportBarangToCsvFile, downloadBarangTemplate } from '../storage';

interface BarangTabProps {
  barangList: Barang[];
  onAddBarang: (item: Barang) => void;
  onUpdateBarang: (item: Barang) => void;
  onDeleteBarang: (id: string) => void;
  onOpenImportModal: () => void;
  onOpenGoogleSheetsModal?: () => void;
  onShowToast: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void;
}

export const BarangTab: React.FC<BarangTabProps> = ({
  barangList,
  onAddBarang,
  onUpdateBarang,
  onDeleteBarang,
  onOpenImportModal,
  onOpenGoogleSheetsModal,
  onShowToast,
}) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  // Add / Edit Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Barang | null>(null);

  // Form Fields
  const [kode, setKode] = useState('');
  const [nama, setNama] = useState('');
  const [kategoriForm, setKategoriForm] = useState(KATEGORI_BARANG_OPTIONS[0]);
  const [stok, setStok] = useState(10);
  const [minStok, setMinStok] = useState(5);
  const [satuan, setSatuan] = useState('Unit');
  const [lokasi, setLokasi] = useState('Gudang A - Rak 01');

  // Filtered List
  const filteredBarang = useMemo(() => {
    return barangList.filter((b) => {
      const matchSearch =
        b.nama.toLowerCase().includes(search.toLowerCase()) ||
        b.kode.toLowerCase().includes(search.toLowerCase()) ||
        b.lokasi.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === 'ALL' || b.kategori === category;
      return matchSearch && matchCat;
    });
  }, [barangList, search, category]);

  // Category counts
  const categoryStats = useMemo(() => {
    let atkCount = 0;
    let consumableCount = 0;
    barangList.forEach((b) => {
      if (b.kategori === 'ATK') atkCount++;
      else if (b.kategori === 'Consumable') consumableCount++;
    });
    return {
      all: barangList.length,
      atk: atkCount,
      consumable: consumableCount,
    };
  }, [barangList]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    const nextIdx = barangList.length + 1;
    setKode(`BRG-${String(nextIdx).padStart(3, '0')}`);
    setNama('');
    setKategoriForm(KATEGORI_BARANG_OPTIONS[0]);
    setStok(10);
    setMinStok(5);
    setSatuan('Unit');
    setLokasi('Gudang A - Rak 01');
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item: Barang) => {
    setEditingItem(item);
    setKode(item.kode);
    setNama(item.nama);
    setKategoriForm(item.kategori === 'Consumable' ? 'Consumable' : 'ATK');
    setStok(item.stok);
    setMinStok(item.minStok);
    setSatuan(item.satuan);
    setLokasi(item.lokasi);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      onShowToast('Nama barang tidak boleh kosong!', 'warning');
      return;
    }

    if (editingItem) {
      const updated: Barang = {
        ...editingItem,
        kode: kode.trim().toUpperCase(),
        nama: nama.trim(),
        kategori: kategoriForm,
        stok: Number(stok) || 0,
        minStok: Number(minStok) || 0,
        satuan: satuan.trim() || 'Unit',
        lokasi: lokasi.trim() || 'Gudang Utama',
      };
      onUpdateBarang(updated);
      onShowToast(`Data barang "${updated.nama}" berhasil diperbarui.`, 'success');
    } else {
      const newItem: Barang = {
        id: 'b_' + Date.now(),
        kode: kode.trim().toUpperCase(),
        nama: nama.trim(),
        kategori: kategoriForm,
        stok: Number(stok) || 0,
        minStok: Number(minStok) || 0,
        satuan: satuan.trim() || 'Unit',
        lokasi: lokasi.trim() || 'Gudang Utama',
      };
      onAddBarang(newItem);
      onShowToast(`Barang baru "${newItem.nama}" (${newItem.kode}) berhasil ditambahkan!`, 'success');
    }

    setIsFormModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Daftar Stok Inventaris Gudang</h2>
          <p className="text-xs text-slate-500">
            Penyimpanan lokal real-time dengan monitoring stok aman dan batas minimum re-order
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Ekspor Data</span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {isExportDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 text-xs">
                <button
                  onClick={() => {
                    exportBarangToExcelFile(barangList);
                    setIsExportDropdownOpen(false);
                    onShowToast('Data barang berhasil diekspor ke Excel (.xlsx)', 'success');
                  }}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Ekspor ke Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => {
                    exportBarangToCsvFile(barangList);
                    setIsExportDropdownOpen(false);
                    onShowToast('Data barang berhasil diekspor ke CSV (.csv)', 'success');
                  }}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Ekspor ke CSV (.csv)</span>
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={() => {
                    downloadBarangTemplate();
                    setIsExportDropdownOpen(false);
                    onShowToast('Format template Excel barang berhasil diunduh.', 'info');
                  }}
                  className="w-full px-3 py-2 text-left text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-400" />
                  <span>Download Format Template</span>
                </button>
              </div>
            )}
          </div>

          {/* Import Button */}
          <button
            onClick={onOpenImportModal}
            className="px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Impor Excel / CSV</span>
          </button>

          {/* Google Sheets Integration Button */}
          {onOpenGoogleSheetsModal && (
            <button
              onClick={onOpenGoogleSheetsModal}
              className="px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Ekspor atau Impor langsung dengan Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Google Sheets</span>
            </button>
          )}

          {/* Add Item Button */}
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Barang</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        {/* Top row: Category Pill Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Filter Kategori:</span>
            </span>

            {/* ALL Pill */}
            <button
              type="button"
              onClick={() => setCategory('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                category === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20 ring-1 ring-blue-600'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Semua Kategori</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                  category === 'ALL'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {categoryStats.all}
              </span>
            </button>

            {/* ATK Pill */}
            <button
              type="button"
              onClick={() => setCategory('ATK')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                category === 'ATK'
                  ? 'bg-blue-700 text-white shadow-xs shadow-blue-600/25 ring-1 ring-blue-700'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>ATK</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                  category === 'ATK'
                    ? 'bg-white/20 text-white'
                    : 'bg-blue-200/70 text-blue-800'
                }`}
              >
                {categoryStats.atk}
              </span>
            </button>

            {/* Consumable Pill */}
            <button
              type="button"
              onClick={() => setCategory('Consumable')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                category === 'Consumable'
                  ? 'bg-amber-600 text-white shadow-xs shadow-amber-500/25 ring-1 ring-amber-600'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Consumable</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                  category === 'Consumable'
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-200/70 text-amber-800'
                }`}
              >
                {categoryStats.consumable}
              </span>
            </button>
          </div>

          <div className="text-xs text-slate-500 sm:text-right">
            Menampilkan: <strong className="text-slate-800 tabular-nums">{filteredBarang.length}</strong> dari {barangList.length} barang
          </div>
        </div>

        {/* Bottom row: Search input & quick reset */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode, nama barang, atau lokasi rak..."
              className="w-full pl-9 pr-8 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="sm:col-span-4 flex items-center justify-between sm:justify-end gap-2">
            {(category !== 'ALL' || search) && (
              <button
                type="button"
                onClick={() => {
                  setCategory('ALL');
                  setSearch('');
                }}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Reset Semua Filter</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Kode Barang</th>
                <th className="p-3">Nama Barang</th>
                <th className="p-3">Kategori</th>
                <th className="p-3 text-center">Stok</th>
                <th className="p-3">Satuan</th>
                <th className="p-3 text-center">Batas Min</th>
                <th className="p-3">Status</th>
                <th className="p-3">Lokasi Rak</th>
                <th className="p-3 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBarang.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 space-y-2">
                    <p>Tidak ada data barang yang cocok dengan filter {category !== 'ALL' ? `kategori "${category}"` : ''} {search ? `atau kata kunci "${search}"` : ''}.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setCategory('ALL');
                        setSearch('');
                      }}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                    >
                      Tampilkan Semua Barang
                    </button>
                  </td>
                </tr>
              ) : (
                filteredBarang.map((b) => {
                  const isReady = Number(b.stok) > Number(b.minStok);
                  const isAtk = b.kategori === 'ATK';
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-700">{b.kode}</td>
                      <td className="p-3 font-semibold text-slate-900">{b.nama}</td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => setCategory(b.kategori)}
                          title={`Klik untuk memfilter hanya kategori ${b.kategori}`}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                            isAtk
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          <Tag className="w-3 h-3" />
                          <span>{b.kategori}</span>
                        </button>
                      </td>
                      <td className="p-3 text-center font-bold tabular-nums text-slate-900">
                        {b.stok}
                      </td>
                      <td className="p-3 text-slate-500">{b.satuan}</td>
                      <td className="p-3 text-center text-slate-400 tabular-nums">{b.minStok}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                            isReady
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isReady ? (
                            <CheckCircle2 className="w-3 h-3 text-blue-600" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                          )}
                          {isReady ? 'Ready' : 'Re-Order'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">
                        <span className="inline-flex items-center gap-1 text-[11px]">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{b.lokasi}</span>
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(b)}
                            className="p-1 text-slate-500 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit Data Barang"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteBarang(b.id)}
                            className="p-1 text-slate-500 hover:text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer"
                            title="Hapus Barang"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Barang */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/80">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? 'Edit Data Barang' : 'Tambah Barang Baru'}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-5 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode Barang
                  </label>
                  <input
                    type="text"
                    value={kode}
                    onChange={(e) => setKode(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori
                  </label>
                  <select
                    value={kategoriForm}
                    onChange={(e) => setKategoriForm(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
                  >
                    {KATEGORI_BARANG_OPTIONS.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Barang
                </label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Barcode Scanner Handheld 2D"
                  required
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stok Awal
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stok}
                    onChange={(e) => setStok(parseInt(e.target.value, 10) || 0)}
                    required
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Min. Stok
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={minStok}
                    onChange={(e) => setMinStok(parseInt(e.target.value, 10) || 1)}
                    required
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Satuan
                  </label>
                  <input
                    type="text"
                    value={satuan}
                    onChange={(e) => setSatuan(e.target.value)}
                    placeholder="Unit, Box, Pcs"
                    required
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lokasi Rak / Gudang
                </label>
                <input
                  type="text"
                  value={lokasi}
                  onChange={(e) => setLokasi(e.target.value)}
                  placeholder="Contoh: Gudang A - Rak 01"
                  required
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Barang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
