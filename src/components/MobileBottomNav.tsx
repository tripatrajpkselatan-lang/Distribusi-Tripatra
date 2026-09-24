import React from 'react';
import { LayoutDashboard, Boxes, ArrowLeftRight, Users, UserCheck } from 'lucide-react';
import { TabType } from './Sidebar';

interface MobileBottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentTab, onSelectTab }) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Beranda', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'barang', label: 'Barang', icon: <Boxes className="w-4 h-4" /> },
    { id: 'mutasi', label: 'IN-OUT', icon: <ArrowLeftRight className="w-4 h-4" /> },
    { id: 'karyawan', label: 'Karyawan', icon: <Users className="w-4 h-4" /> },
    { id: 'akun', label: 'Akun', icon: <UserCheck className="w-4 h-4" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 h-14 bg-white border-t border-slate-200 flex items-center justify-around px-1 lg:hidden shadow-lg shadow-slate-900/5">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors cursor-pointer ${
              isActive ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] mt-0.5">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
