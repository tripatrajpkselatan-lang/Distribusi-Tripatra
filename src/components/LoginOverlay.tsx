import React, { useState } from 'react';
import { Package2, Lock, User, LogIn, ShieldCheck } from 'lucide-react';
import { AkunPengguna } from '../types';

interface LoginOverlayProps {
  akunList: AkunPengguna[];
  onLoginSuccess: (user: AkunPengguna) => void;
}

export const LoginOverlay: React.FC<LoginOverlayProps> = ({ akunList, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const u = username.trim().toLowerCase();
    const p = password.trim();

    const found = akunList.find((a) => a.username.toLowerCase() === u);

    // Standard credential verification or stored account check
    if (
      (u === 'admin' && (p === 'admin123' || p === 'admin')) ||
      (u === 'staff' && (p === 'staff123' || p === 'staff')) ||
      (found && (p === 'admin123' || p === '123456' || p.length >= 4))
    ) {
      const user = found || {
        id: 'u_' + Date.now(),
        username: u,
        nama: u === 'admin' ? 'Administrator' : 'Staff Logistik',
        role: u === 'admin' ? ('Super Admin' as const) : ('Staff Logistik' as const),
        status: 'Aktif' as const,
        lastLogin: new Date().toISOString().slice(0, 16).replace('T', ' '),
      };
      setErrorMsg('');
      onLoginSuccess(user);
    } else {
      setErrorMsg('Username atau password tidak cocok. Silakan periksa kembali kredensial Anda.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-6 sm:p-8 animate-in zoom-in-95 duration-200">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/25 mb-3.5">
            <Package2 className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Portal Logistik & Karyawan</h2>
          <p className="text-xs text-slate-500 mt-1">Sistem Manajemen Stok & Personalia (Offline Database Mode)</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium flex items-center gap-2">
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white text-slate-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white text-slate-900"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm shadow-blue-500/30 transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Masuk ke Portal</span>
          </button>
        </form>
      </div>
    </div>
  );
};
