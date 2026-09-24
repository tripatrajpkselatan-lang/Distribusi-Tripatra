import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  Upload,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  FolderOpen,
  Copy,
  Check,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  getAccessToken,
} from '../googleAuth';
import {
  exportInventoryToGoogleSheets,
  listRecentGoogleSpreadsheets,
  readGoogleSheetBarang,
  GoogleDriveFile,
  GoogleSheetExportResult,
} from '../googleSheetsService';
import { Barang, TransaksiMutasi, Karyawan } from '../types';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  barangList: Barang[];
  transaksiList: TransaksiMutasi[];
  karyawanList: Karyawan[];
  onImportBarang: (items: Omit<Barang, 'id'>[], mode: 'upsert' | 'replace') => void;
  onShowToast: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  barangList,
  transaksiList,
  karyawanList,
  onImportBarang,
  onShowToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'export' | 'import' | 'recent'>('export');
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Export state
  const [exportTitle, setExportTitle] = useState(
    `Portal Logistik - Inventaris (${new Date().toLocaleDateString('id-ID')})`
  );
  const [exportResult, setExportResult] = useState<GoogleSheetExportResult | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Import state
  const [spreadsheetInput, setSpreadsheetInput] = useState('');
  const [recentSpreadsheets, setRecentSpreadsheets] = useState<GoogleDriveFile[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [previewImport, setPreviewImport] = useState<{
    sheetTitle: string;
    items: Omit<Barang, 'id'>[];
  } | null>(null);
  const [importMode, setImportMode] = useState<'upsert' | 'replace'>('upsert');

  // Confirmation dialog state (Mandatory for Workspace modifications per Skill instructions)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    confirmLabel: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: null,
    confirmLabel: 'Ya, Lanjutkan',
    onConfirm: () => {},
  });

  // Listen to Auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setGoogleUser(user);
      },
      () => {
        setGoogleUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch recent spreadsheets when tab is changed or when user signs in
  useEffect(() => {
    if (googleUser && (activeSubTab === 'recent' || activeSubTab === 'import')) {
      loadRecentFiles();
    }
  }, [googleUser, activeSubTab]);

  const loadRecentFiles = async () => {
    setIsLoadingRecent(true);
    try {
      const files = await listRecentGoogleSpreadsheets();
      setRecentSpreadsheets(files);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingRecent(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setGoogleUser(res.user);
        onShowToast(`Berhasil terhubung dengan Google (${res.user.email})`, 'success');
        loadRecentFiles();
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        onShowToast(err?.message || 'Gagal masuk dengan akun Google.', 'danger');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logoutGoogle();
    setGoogleUser(null);
    setExportResult(null);
    setPreviewImport(null);
    onShowToast('Akun Google berhasil diputuskan.', 'info');
  };

  // Trigger export with confirmation dialog
  const promptExportConfirmation = () => {
    if (!googleUser) {
      onShowToast('Silakan hubungkan akun Google Anda terlebih dahulu.', 'warning');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Buat Spreadsheet Baru di Google Drive?',
      message: (
        <div className="space-y-2 text-xs text-slate-600">
          <p>
            Aplikasi akan membuat spreadsheet baru berjudul <strong>"{exportTitle}"</strong> di
            Google Drive akun <strong>{googleUser.email}</strong> dengan data:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-700">
            <li>
              Sheet <strong>"Data Barang"</strong>: {barangList.length} item stok
            </li>
            <li>
              Sheet <strong>"Riwayat Mutasi"</strong>: {transaksiList.length} catatan mutasi
            </li>
            <li>
              Sheet <strong>"Data Karyawan"</strong>: {karyawanList.length} karyawan
            </li>
          </ul>
        </div>
      ),
      confirmLabel: 'Ya, Buat Spreadsheet',
      onConfirm: executeExport,
    });
  };

  const executeExport = async () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    setIsProcessing(true);
    try {
      const result = await exportInventoryToGoogleSheets({
        title: exportTitle,
        barangList,
        transaksiList,
        karyawanList,
      });
      setExportResult(result);
      onShowToast('Berhasil mengekspor data ke Google Sheets!', 'success');
      loadRecentFiles();
    } catch (err: any) {
      onShowToast(err?.message || 'Gagal mengekspor data ke Google Sheets.', 'danger');
    } finally {
      setIsProcessing(false);
    }
  };

  // Extract Spreadsheet ID from URL or ID string
  const parseSpreadsheetId = (input: string) => {
    const trimmed = input.trim();
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : trimmed;
  };

  // Read and preview spreadsheet
  const handlePreviewSheet = async (idOrUrl?: string) => {
    const targetId = parseSpreadsheetId(idOrUrl || spreadsheetInput);
    if (!targetId) {
      onShowToast('Masukkan Link atau ID Google Spreadsheet terlebih dahulu.', 'warning');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await readGoogleSheetBarang(targetId);
      setPreviewImport(result);
      onShowToast(
        `Berhasil membaca ${result.items.length} data barang dari sheet "${result.sheetTitle}"`,
        'success'
      );
    } catch (err: any) {
      setPreviewImport(null);
      onShowToast(err?.message || 'Gagal membaca data dari Google Spreadsheet.', 'danger');
    } finally {
      setIsProcessing(false);
    }
  };

  // Trigger import with confirmation
  const promptImportConfirmation = () => {
    if (!previewImport || previewImport.items.length === 0) {
      onShowToast('Tidak ada data barang yang valid untuk diimpor.', 'warning');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: `Konfirmasi Impor Data Barang (${importMode.toUpperCase()})`,
      message: (
        <div className="space-y-2 text-xs text-slate-600">
          <p>
            Anda akan mengimpor <strong>{previewImport.items.length} barang</strong> dari Google
            Sheets ke database inventaris lokal.
          </p>
          <div
            className={`p-3 rounded-lg border ${
              importMode === 'replace'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            {importMode === 'replace' ? (
              <strong>
                Peringatan: Mode Replace akan mengganti seluruh daftar data barang saat ini dengan
                data dari Google Sheets.
              </strong>
            ) : (
              <span>
                Mode Upsert: Barang dengan kode yang sudah ada akan diperbarui stok & datanya, dan kode
                baru akan ditambahkan.
              </span>
            )}
          </div>
        </div>
      ),
      confirmLabel: 'Ya, Terapkan Impor',
      onConfirm: executeImport,
    });
  };

  const executeImport = () => {
    if (!previewImport) return;
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    onImportBarang(previewImport.items, importMode);
    onShowToast(
      `Sukses mengimpor ${previewImport.items.length} barang dari Google Sheets (${importMode}).`,
      'success'
    );
    setPreviewImport(null);
    setSpreadsheetInput('');
  };

  const copySpreadsheetLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    onShowToast('Link Google Sheet disalin ke clipboard!', 'info');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Integrasi Google Sheets
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Google Workspace
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Sinkronisasi, ekspor & impor data stok inventaris langsung ke Google Spreadsheet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Google Account Bar */}
        <div className="px-5 py-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
          {googleUser ? (
            <div className="flex items-center gap-2.5">
              {googleUser.photoURL ? (
                <img
                  src={googleUser.photoURL}
                  alt={googleUser.displayName || 'Google User'}
                  className="w-7 h-7 rounded-full border border-slate-300"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                  {googleUser.displayName ? googleUser.displayName[0] : 'G'}
                </div>
              )}
              <div>
                <div className="font-semibold text-slate-800 leading-none">
                  {googleUser.displayName || 'Akun Google Terhubung'}
                </div>
                <div className="text-[11px] text-slate-500">{googleUser.email}</div>
              </div>
            </div>
          ) : (
            <div className="text-slate-600 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Hubungkan akun Google untuk mengakses Google Sheets & Drive</span>
            </div>
          )}

          <div>
            {googleUser ? (
              <button
                type="button"
                onClick={handleGoogleLogout}
                className="px-2.5 py-1 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Putuskan Akun</span>
              </button>
            ) : (
              /* Official Google Sign-In button specification from SKILL.md */
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs font-semibold text-slate-700 transition-all cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                <span>{isLoggingIn ? 'Menghubungkan...' : 'Sign in with Google'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex border-b border-slate-200 px-5 bg-white">
          <button
            type="button"
            onClick={() => setActiveSubTab('export')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeSubTab === 'export'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor ke Google Sheets</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('import')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeSubTab === 'import'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Impor dari Google Sheets</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('recent')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeSubTab === 'recent'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Riwayat File Spreadsheet</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {!googleUser ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                Masuk dengan Akun Google untuk Menggunakan Google Sheets
              </h4>
              <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                Fitur ini membutuhkan izin untuk membaca dan membuat spreadsheet pada Google Drive
                Anda. Klik tombol di bawah untuk memberikan akses secara aman.
              </p>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-sm font-semibold text-slate-700 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                <span>{isLoggingIn ? 'Menghubungkan...' : 'Sign in with Google'}</span>
              </button>
            </div>
          ) : (
            <>
              {/* TAB 1: EKSPOR */}
              {activeSubTab === 'export' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Judul Spreadsheet Google
                    </label>
                    <input
                      type="text"
                      value={exportTitle}
                      onChange={(e) => setExportTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 bg-white"
                      placeholder="Masukkan nama spreadsheet..."
                    />
                  </div>

                  {/* Summary of Data to Export */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200">
                      <span className="text-[10px] font-bold text-blue-600 uppercase block">
                        Master Barang
                      </span>
                      <span className="text-xl font-bold text-blue-900 tabular-nums">
                        {barangList.length}
                      </span>
                      <span className="text-[11px] text-blue-700 block mt-0.5">Item & Stok</span>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase block">
                        Mutasi Transaksi
                      </span>
                      <span className="text-xl font-bold text-emerald-900 tabular-nums">
                        {transaksiList.length}
                      </span>
                      <span className="text-[11px] text-emerald-700 block mt-0.5">Catatan Log</span>
                    </div>

                    <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase block">
                        Personalia
                      </span>
                      <span className="text-xl font-bold text-indigo-900 tabular-nums">
                        {karyawanList.length}
                      </span>
                      <span className="text-[11px] text-indigo-700 block mt-0.5">Karyawan</span>
                    </div>
                  </div>

                  {exportResult && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Spreadsheet berhasil dibuat dan tersimpan di Google Drive!</span>
                      </div>
                      <div className="text-slate-700 font-medium">{exportResult.title}</div>
                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href={exportResult.spreadsheetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
                        >
                          <span>Buka di Google Sheets</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => copySpreadsheetLink(exportResult.spreadsheetUrl)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCopied ? 'Tersalin' : 'Salin Link'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500">
                      Akan membuat dokumen Google Sheets multi-sheet di Drive Anda
                    </span>
                    <button
                      type="button"
                      onClick={promptExportConfirmation}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileSpreadsheet className="w-4 h-4" />
                      )}
                      <span>Ekspor Sekarang</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: IMPOR */}
              {activeSubTab === 'import' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      URL atau ID Google Spreadsheet
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={spreadsheetInput}
                        onChange={(e) => setSpreadsheetInput(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900 bg-white"
                        placeholder="https://docs.google.com/spreadsheets/d/1A2B3C.../edit"
                      />
                      <button
                        type="button"
                        onClick={() => handlePreviewSheet()}
                        disabled={isProcessing || !spreadsheetInput}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <FolderOpen className="w-3.5 h-3.5" />
                        )}
                        <span>Pratinjau Data</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Sistem akan membaca sheet yang memuat daftar barang (misal: "Data Barang" atau sheet pertama).
                    </p>
                  </div>

                  {/* Mode Impor */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="font-semibold text-slate-800 block">Metode Sinkronisasi Impor:</span>
                    <div className="grid grid-cols-2 gap-3">
                      <label
                        className={`p-2.5 rounded-lg border cursor-pointer transition-colors flex items-start gap-2 ${
                          importMode === 'upsert'
                            ? 'bg-blue-50/70 border-blue-300 text-blue-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="importMode"
                          value="upsert"
                          checked={importMode === 'upsert'}
                          onChange={() => setImportMode('upsert')}
                          className="mt-0.5"
                        />
                        <div>
                          <span className="font-bold block text-xs">Upsert (Rekomendasi)</span>
                          <span className="text-[11px] text-slate-500 block">
                            Perbarui stok barang lama, tambahkan yang baru
                          </span>
                        </div>
                      </label>

                      <label
                        className={`p-2.5 rounded-lg border cursor-pointer transition-colors flex items-start gap-2 ${
                          importMode === 'replace'
                            ? 'bg-amber-50/70 border-amber-300 text-amber-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="importMode"
                          value="replace"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                          className="mt-0.5"
                        />
                        <div>
                          <span className="font-bold block text-xs">Replace (Timpa Total)</span>
                          <span className="text-[11px] text-slate-500 block">
                            Ganti seluruh data stok lokal dengan data Google Sheets
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Preview Table */}
                  {previewImport && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">
                          Pratinjau: Sheet "{previewImport.sheetTitle}" ({previewImport.items.length} item)
                        </span>
                      </div>

                      <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                        <table className="w-full text-left text-[11px] border-collapse">
                          <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                            <tr>
                              <th className="p-2">Kode</th>
                              <th className="p-2">Nama Barang</th>
                              <th className="p-2">Kategori</th>
                              <th className="p-2 text-center">Stok</th>
                              <th className="p-2">Satuan</th>
                              <th className="p-2">Lokasi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {previewImport.items.slice(0, 15).map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-2 font-mono font-bold text-slate-700">
                                  {item.kode}
                                </td>
                                <td className="p-2 font-semibold text-slate-900">{item.nama}</td>
                                <td className="p-2">{item.kategori}</td>
                                <td className="p-2 text-center font-bold text-slate-900">
                                  {item.stok}
                                </td>
                                <td className="p-2">{item.satuan}</td>
                                <td className="p-2 text-slate-500">{item.lokasi}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {previewImport.items.length > 15 && (
                        <p className="text-[10px] text-slate-400 text-right">
                          Menampilkan 15 dari {previewImport.items.length} item...
                        </p>
                      )}

                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={promptImportConfirmation}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Terapkan Impor Data ({importMode})</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: RIWAYAT FILE GOOGLE DRIVE */}
              {activeSubTab === 'recent' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">
                      File Spreadsheet Terakhir di Akun Google Anda:
                    </span>
                    <button
                      type="button"
                      onClick={loadRecentFiles}
                      disabled={isLoadingRecent}
                      className="text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRecent ? 'animate-spin' : ''}`} />
                      <span>Segarkan</span>
                    </button>
                  </div>

                  {isLoadingRecent ? (
                    <div className="p-8 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
                      <span>Memuat daftar spreadsheet dari Google Drive...</span>
                    </div>
                  ) : recentSpreadsheets.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                      Tidak ada file spreadsheet yang ditemukan di Google Drive.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recentSpreadsheets.map((file) => (
                        <div
                          key={file.id}
                          className="p-3 bg-white border border-slate-200 hover:border-emerald-300 rounded-xl transition-all flex items-center justify-between gap-3 shadow-2xs group"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                              <FileSpreadsheet className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                              <div className="font-semibold text-slate-900 truncate">
                                {file.name}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {file.modifiedTime
                                    ? new Date(file.modifiedTime).toLocaleString('id-ID')
                                    : 'Baru saja'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setSpreadsheetInput(file.id);
                                setActiveSubTab('import');
                                handlePreviewSheet(file.id);
                              }}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              title="Pilih untuk diimpor ke aplikasi"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Impor</span>
                            </button>

                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Buka Spreadsheet di Google Sheets"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Terhubung langsung melalui Google Workspace REST API</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Confirmation Modal for destructive/modifying operations */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-start justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">{confirmModal.title}</h4>
              </div>
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4">{confirmModal.message}</div>

            <div className="flex items-center justify-end gap-2 px-4 py-3 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
