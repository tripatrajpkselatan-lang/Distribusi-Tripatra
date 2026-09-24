import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  ArrowLeftRight,
  Users,
  UserCheck,
  HardDrive,
  LogOut,
  X,
  Truck,
  FileSpreadsheet,
} from 'lucide-react';
import { AkunPengguna } from '../types';

export type TabType = 'dashboard' | 'barang' | 'mutasi' | 'karyawan' | 'akun';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenBackupModal: () => void;
  onOpenGoogleSheetsModal?: () => void;
  onLogout: () => void;
  currentUser: AkunPengguna | null;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenBackupModal,
  onOpenGoogleSheetsModal,
  onLogout,
  currentUser,
  isOpenMobile,
  onCloseMobile,
}) => {
  const menuItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'barang', label: 'Data Barang', icon: <Boxes className="w-4 h-4" /> },
    { id: 'mutasi', label: 'Barang IN-OUT', icon: <ArrowLeftRight className="w-4 h-4" /> },
    { id: 'karyawan', label: 'Data Karyawan', icon: <Users className="w-4 h-4" /> },
    { id: 'akun', label: 'Manajemen Akun', icon: <UserCheck className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight">JPK-Selatan</span>
              <span className="block text-[10px] text-slate-400 font-medium">Logistik & Personalia</span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="text-slate-400 hover:text-white p-1 rounded-md lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Navigasi Utama
            </div>
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Sistem & Integrasi
            </div>
            <div className="space-y-1">
              {onOpenGoogleSheetsModal && (
                <button
                  onClick={() => {
                    onOpenGoogleSheetsModal();
                    onCloseMobile();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg text-emerald-300 hover:bg-emerald-950/40 hover:text-emerald-200 transition-colors cursor-pointer border border-emerald-900/40 bg-emerald-950/20"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Google Sheets</span>
                  <span className="ml-auto text-[9px] font-bold bg-emerald-800 text-emerald-200 px-1.5 py-0.5 rounded">
                    Cloud
                  </span>
                </button>
              )}
              <button
                onClick={() => {
                  onOpenBackupModal();
                  onCloseMobile();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              >
                <HardDrive className="w-4 h-4 text-slate-400" />
                <span>Database & Cadangan</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Profile & Status */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Database Lokal Aktif</span>
            </div>
            <button
              onClick={onLogout}
              className="text-slate-400 hover:text-red-400 p-1 rounded transition-colors"
              title="Keluar dari sesi"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
          {currentUser && (
            <div className="px-1 py-1 rounded bg-slate-800/60 text-[11px]">
              <div className="font-semibold text-white truncate">{currentUser.nama}</div>
              <div className="text-slate-400 text-[10px]">{currentUser.role}</div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
