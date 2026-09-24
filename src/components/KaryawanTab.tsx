import React, { useState, useMemo } from 'react';
import {
  Search,
  UserPlus,
  FileSpreadsheet,
  Upload,
  Download,
  Trash2,
  ChevronDown,
  Mail,
  X,
  FileText,
  BadgeCheck
} from 'lucide-react';
import { Karyawan } from '../types';
import { DEPARTEMEN_OPTIONS } from '../defaultData';
import {
  exportKaryawanToExcelFile,
  exportKaryawanToCsvFile,
  downloadKaryawanTemplate,
} from '../storage';

interface KaryawanTabProps {
  karyawanList: Karyawan[];
  onAddKaryawan: (k: Karyawan) => void;
  onDeleteKaryawan: (id: string) => void;
  onOpenImportModal: () => void;
  onShowToast: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void;
}

export const KaryawanTab: React.FC<KaryawanTabProps> = ({
  karyawanList,
  onAddKaryawan,
  onDeleteKaryawan,
  onOpenImportModal,
  onShowToast,
}) => {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  // Add Karyawan Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [badge, setBadge] = useState('');
  const [nama, setNama] = useState('');
  const [dept, setDept] = useState(DEPARTEMEN_OPTIONS[0]);
  const [jabatan, setJabatan] = useState('');
  const [email, setEmail] = useState('');

  const filteredKaryawan = useMemo(() => {
    return karyawanList.filter((k) => {
      const matchSearch =
        k.nama.toLowerCase().includes(search.toLowerCase()) ||
        k.badge.toLowerCase().includes(search.toLowerCase()) ||
        k.jabatan.toLowerCase().includes(search.toLowerCase());
      const matchDept = deptFilter === 'ALL' || k.dept === deptFilter;
      return matchSearch && matchDept;
    });
  }, [karyawanList, search, deptFilter]);

  const handleOpenAddModal = () => {
    const nextIdx = karyawanList.length + 1;
    setBadge(`KRY-${String(nextIdx).padStart(3, '0')}`);
    setNama('');
    setDept(DEPARTEMEN_OPTIONS[0]);
    setJabatan('');
    setEmail('');
    setIsAddModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      onShowToast('Nama karyawan tidak boleh kosong!', 'warning');
      return;
    }

    const newK: Karyawan = {
      id: 'k_' + Date.now(),
      badge: badge.trim().toUpperCase(),
      nama: nama.trim(),
      dept,
      jabatan: jabatan.trim() || 'Staff',
      email: email.trim() || `${badge.toLowerCase()}@jpkselatan.com`,
      status: 'Aktif',
    };

    onAddKaryawan(newK);
    onShowToast(`Data karyawan "${newK.nama}" (${newK.badge}) berhasil ditambahkan!`, 'success');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Data Karyawan & Personalia</h2>
          <p className="text-xs text-slate-500">
            Daftar penanggung jawab operasional, logistik gudang, dan staf inventaris
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
                    exportKaryawanToExcelFile(karyawanList);
                    setIsExportDropdownOpen(false);
                    onShowToast('Data karyawan berhasil diekspor ke Excel (.xlsx)', 'success');
                  }}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Ekspor ke Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => {
                    exportKaryawanToCsvFile(karyawanList);
                    setIsExportDropdownOpen(false);
                    onShowToast('Data karyawan berhasil diekspor ke CSV (.csv)', 'success');
                  }}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Ekspor ke CSV (.csv)</span>
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={() => {
                    downloadKaryawanTemplate();
                    setIsExportDropdownOpen(false);
                    onShowToast('Template Excel karyawan berhasil diunduh.', 'info');
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

          {/* Add Karyawan Button */}
          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Karyawan</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari ID badge, nama karyawan, atau jabatan..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full py-1.5 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-700 bg-white"
          >
            <option value="ALL">Semua Departemen</option>
            {DEPARTEMEN_OPTIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2 text-left sm:text-right text-xs text-slate-500">
          Total: <strong className="text-slate-800 tabular-nums">{filteredKaryawan.length}</strong> orang
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">ID Badge</th>
                <th className="p-3">Nama Lengkap</th>
                <th className="p-3">Departemen</th>
                <th className="p-3">Jabatan</th>
                <th className="p-3">Email / Kontak</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredKaryawan.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Tidak ada data karyawan yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredKaryawan.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-blue-600">{k.badge}</td>
                    <td className="p-3 font-semibold text-slate-900">{k.nama}</td>
                    <td className="p-3 text-slate-500">{k.dept}</td>
                    <td className="p-3 text-slate-700 font-medium">{k.jabatan}</td>
                    <td className="p-3 text-slate-500">
                      <span className="inline-flex items-center gap-1.5 text-[11px]">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{k.email}</span>
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <BadgeCheck className="w-3 h-3 text-emerald-600" />
                        {k.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => onDeleteKaryawan(k.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer"
                        title="Hapus Karyawan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Karyawan */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/80">
              <h3 className="text-base font-bold text-slate-900">Tambah Data Karyawan</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-5 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ID Badge
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Departemen
                  </label>
                  <select
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
                  >
                    {DEPARTEMEN_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Masukkan nama lengkap karyawan"
                  required
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jabatan / Posisi
                </label>
                <input
                  type="text"
                  value={jabatan}
                  onChange={(e) => setJabatan(e.target.value)}
                  placeholder="Contoh: Staff Logistik Senior / Picker"
                  required
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email / Kontak
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="karyawan@jpkselatan.com"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                >
                  Simpan Karyawan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
