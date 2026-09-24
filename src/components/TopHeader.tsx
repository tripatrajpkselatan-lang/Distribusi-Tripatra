import React from 'react';
import { Menu, HardDrive, LogOut, UserCheck, FileSpreadsheet } from 'lucide-react';
import { TabType } from './Sidebar';
import { AkunPengguna } from '../types';

interface TopHeaderProps {
  currentTab: TabType;
  currentUser: AkunPengguna | null;
  onOpenMobileMenu: () => void;
  onOpenBackupModal: () => void;
  onOpenGoogleSheetsModal?: () => void;
  onLogout: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentTab,
  currentUser,
  onOpenMobileMenu,
  onOpenBackupModal,
  onOpenGoogleSheetsModal,
  onLogout,
}) => {
  const tabTitles: Record<TabType, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard Ringkasan',
      subtitle: 'Pengawasan Stok Logistik & Personalia Karyawan',
    },
    barang: {
      title: 'Manajemen Data Stok Barang',
      subtitle: 'Pelacakan stok, inventaris rak, dan batas minimum pesanan',
    },
    mutasi: {
      title: 'Mutasi Barang Masuk & Keluar',
      subtitle: 'Pencatatan mutasi transaksi IN-OUT multi-barang',
    },
    karyawan: {
      title: 'Direktori Data Karyawan',
      subtitle: 'Data staf gudang, operasional, dan penanggung jawab inventaris',
    },
    akun: {
      title: 'Manajemen Akun Pengguna',
      subtitle: 'Hak akses login staf dan administrator sistem',
    },
  };

  const currentInfo = tabTitles[currentTab];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle & Page Info */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 lg:hidden cursor-pointer"
          aria-label="Buka navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block lg:hidden text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
              JPK
            </span>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-none">
              {currentInfo.title}
            </h1>
          </div>
          <p className="hidden sm:block text-xs text-slate-500 mt-1">
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Quick DB Status & User Profile */}
      <div className="flex items-center gap-2">
        {onOpenGoogleSheetsModal && (
          <button
            onClick={onOpenGoogleSheetsModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Integrasi & Ekspor ke Google Sheets"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden xs:inline">Google Sheets</span>
          </button>
        )}

        <button
          onClick={onOpenBackupModal}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          title="Buka Database & Cadangan Lokal"
        >
          <HardDrive className="w-3.5 h-3.5 text-slate-600" />
          <span>Cadangan DB</span>
        </button>

        {currentUser && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="hidden md:block text-right">
              <div className="text-xs font-semibold text-slate-900 leading-tight">
                {currentUser.nama}
              </div>
              <div className="text-[10px] text-slate-500">{currentUser.role}</div>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
              title="Keluar (Logout)"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
