import React, { useState, useMemo } from 'react';
import {
  Search,
  UserPlus,
  Trash2,
  Shield,
  CheckCircle2,
  Lock,
  User,
  X,
  AlertCircle
} from 'lucide-react';
import { AkunPengguna } from '../types';
import { ROLE_OPTIONS } from '../defaultData';

interface AkunTabProps {
  akunList: AkunPengguna[];
  currentUser: AkunPengguna | null;
  onAddAkun: (akun: AkunPengguna) => void;
  onDeleteSingleAkun: (id: string) => void;
  onDeleteBatchAkun: (ids: string[]) => void;
  onShowToast: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void;
}

export const AkunTab: React.FC<AkunTabProps> = ({
  akunList,
  currentUser,
  onAddAkun,
  onDeleteSingleAkun,
  onDeleteBatchAkun,
  onShowToast,
}) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [nama, setNama] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AkunPengguna['role']>(ROLE_OPTIONS[0]);

  const filteredAkun = useMemo(() => {
    return akunList.filter((a) => {
      const matchSearch =
        a.username.toLowerCase().includes(search.toLowerCase()) ||
        a.nama.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'ALL' || a.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [akunList, search, roleFilter]);

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const toggleSelectAll = (checked: boolean) => {
    const next = new Set(selectedIds);
    filteredAkun.forEach((a) => {
      if (checked) {
        next.add(a.id);
      } else {
        next.delete(a.id);
      }
    });
    setSelectedIds(next);
  };

  const isAllFilteredSelected =
    filteredAkun.length > 0 && filteredAkun.every((a) => selectedIds.has(a.id));

  const handleOpenAddModal = () => {
    setUsername('');
    setNama('');
    setPassword('');
    setRole(ROLE_OPTIONS[0]);
    setIsAddModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = username.trim().toLowerCase();
    if (!u) {
      onShowToast('Username tidak boleh kosong!', 'warning');
      return;
    }

    if (akunList.some((a) => a.username.toLowerCase() === u)) {
      onShowToast(`Username "${u}" sudah digunakan! Silakan gunakan username lain.`, 'warning');
      return;
    }

    const newAkun: AkunPengguna = {
      id: 'u_' + Date.now(),
      username: u,
      nama: nama.trim() || u,
      role,
      status: 'Aktif',
      lastLogin: '-',
    };

    onAddAkun(newAkun);
    onShowToast(`Akun pengguna @${newAkun.username} berhasil didaftarkan!`, 'success');
    setIsAddModalOpen(false);
  };

  const handleBatchDeleteClick = () => {
    if (selectedIds.size === 0) return;
    onDeleteBatchAkun(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Manajemen Akun Pengguna</h2>
          <p className="text-xs text-slate-500">
            Kelola hak akses dan peran login pengguna sistem logistik & personalia
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleBatchDeleteClick}
              className="px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Terpilih ({selectedIds.size})</span>
            </button>
          )}

          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Akun Baru</span>
          </button>
        </div>
      </div>

      {/* Batch Selection Banner */}
      {selectedIds.size > 0 && (
        <div className="p-3.5 bg-red-50/70 border border-red-200 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 text-red-900 font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              <strong>{selectedIds.size} akun pengguna</strong> telah dipilih untuk dihapus.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-2.5 py-1 bg-white border border-red-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Batal Pilihan
            </button>
            <button
              onClick={handleBatchDeleteClick}
              className="px-3 py-1 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
            >
              Hapus Sekarang
            </button>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari username atau nama lengkap akun..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full py-1.5 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-700 bg-white"
          >
            <option value="ALL">Semua Peran (Role)</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2 text-left sm:text-right text-xs text-slate-500">
          Total: <strong className="text-slate-800 tabular-nums">{filteredAkun.length}</strong> akun
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllFilteredSelected}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="p-3">Username</th>
                <th className="p-3">Nama Lengkap</th>
                <th className="p-3">Peran (Role)</th>
                <th className="p-3">Status</th>
                <th className="p-3">Terakhir Login</th>
                <th className="p-3 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAkun.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Tidak ada data akun pengguna yang sesuai dengan kata kunci.
                  </td>
                </tr>
              ) : (
                filteredAkun.map((a) => {
                  const isCurrent = currentUser?.username.toLowerCase() === a.username.toLowerCase();
                  const isSelected = selectedIds.has(a.id);

                  const roleColors: Record<AkunPengguna['role'], string> = {
                    'Super Admin': 'bg-red-50 text-red-700 border-red-200',
                    'Staff Logistik': 'bg-blue-50 text-blue-700 border-blue-200',
                    'Supervisor Gudang': 'bg-amber-50 text-amber-700 border-amber-200',
                    'HR Admin': 'bg-purple-50 text-purple-700 border-purple-200',
                  };

                  return (
                    <tr
                      key={a.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-red-50/30' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(a.id)}
                          className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>@{a.username}</span>
                          {isCurrent && (
                            <span className="ml-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                              Akun Anda
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-slate-900">{a.nama}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            roleColors[a.role] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          {a.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {a.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 font-mono text-[11px]">
                        {a.lastLogin || '-'}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => onDeleteSingleAkun(a.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-1 mx-auto cursor-pointer"
                          title={`Hapus akun @${a.username}`}
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
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

      {/* Add Account Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/80">
              <h3 className="text-base font-bold text-slate-900">Tambah Akun Pengguna Baru</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username Unik
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs font-mono">
                    @
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: staff_gudang2"
                    required
                    className="w-full pl-8 pr-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
                  />
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
                  placeholder="Nama pemilik akun"
                  required
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password Akun
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 4 karakter"
                    required
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Peran (Role)
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as AkunPengguna['role'])}
                  className="w-full py-1.5 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
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
                  Daftarkan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
