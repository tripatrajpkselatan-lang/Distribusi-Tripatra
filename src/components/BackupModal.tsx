import React, { useRef, useState, useEffect } from 'react';
import {
  HardDrive,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  X,
  Database,
  FileJson,
  ShieldCheck,
  FileSpreadsheet,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Layers,
  FileCheck,
  Check,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  Barang,
  Karyawan,
  TransaksiMutasi,
  AkunPengguna,
  BackupData,
  MasterExcelSyncResult,
  MasterExcelAnalysis,
} from '../types';
import {
  exportDatabaseBackup,
  parseBackupFile,
  exportMasterExcelWorkbook,
  downloadMasterExcelTemplate,
  parseAndAnalyzeMasterExcel,
  loadLastExcelSync,
} from '../storage';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  barang: Barang[];
  karyawan: Karyawan[];
  transaksi: TransaksiMutasi[];
  akun: AkunPengguna[];
  onRestoreData: (data: BackupData) => void;
  onResetDefault: () => void;
  onApplyMasterExcelSync: (
    newBarang: Barang[],
    newKaryawan: Karyawan[],
    syncResult: MasterExcelSyncResult
  ) => void;
  onShowToast: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  barang,
  karyawan,
  transaksi,
  akun,
  onRestoreData,
  onResetDefault,
  onApplyMasterExcelSync,
  onShowToast,
}) => {
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const excelFileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'excel' | 'json' | 'status'>('excel');
  const [isRestoringJson, setIsRestoringJson] = useState(false);
  const [isAnalyzingExcel, setIsAnalyzingExcel] = useState(false);
  const [isApplyingSync, setIsApplyingSync] = useState(false);

  // Analysis result state from uploaded Master Excel file
  const [excelAnalysis, setExcelAnalysis] = useState<MasterExcelAnalysis | null>(null);
  const [syncMode, setSyncMode] = useState<'upsert' | 'replace'>('upsert');
  const [lastSyncInfo, setLastSyncInfo] = useState<MasterExcelSyncResult | null>(() => loadLastExcelSync());
  const [showDiffDetails, setShowDiffDetails] = useState(false);

  // Refresh last sync info whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setLastSyncInfo(loadLastExcelSync());
      setExcelAnalysis(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // --- Excel Handlers ---
  const handleExportMasterExcel = () => {
    try {
      exportMasterExcelWorkbook(barang, karyawan, transaksi);
      onShowToast('File Master Excel Lengkap (.xlsx) berhasil diunduh!', 'success');
    } catch {
      onShowToast('Gagal mengekspor berkas Master Excel.', 'danger');
    }
  };

  const handleDownloadTemplate = () => {
    try {
      downloadMasterExcelTemplate();
      onShowToast('Template Master Excel berhasil diunduh!', 'info');
    } catch {
      onShowToast('Gagal mengunduh template Master Excel.', 'danger');
    }
  };

  const handleExcelFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsAnalyzingExcel(true);
      const analysis = await parseAndAnalyzeMasterExcel(file, barang, karyawan);
      setExcelAnalysis(analysis);

      const totalFound = analysis.allBarangFromExcel.length + analysis.allKaryawanFromExcel.length;
      if (totalFound === 0) {
        onShowToast('File Excel terbaca, namun tidak ditemukan data barang atau karyawan.', 'warning');
      } else {
        onShowToast(
          `Master Excel dianalisis: ${analysis.allBarangFromExcel.length} barang, ${analysis.allKaryawanFromExcel.length} karyawan terdeteksi.`,
          'success'
        );
      }
    } catch (err: unknown) {
      const error = err as Error;
      onShowToast(error.message || 'Gagal menganalisis file Excel.', 'danger');
      setExcelAnalysis(null);
    } finally {
      setIsAnalyzingExcel(false);
      if (excelFileInputRef.current) excelFileInputRef.current.value = '';
    }
  };

  const handleExecuteSync = () => {
    if (!excelAnalysis) return;

    try {
      setIsApplyingSync(true);

      let finalBarang: Barang[] = [];
      let finalKaryawan: Karyawan[] = [];

      if (syncMode === 'replace') {
        // Mode Ganti Total: ambil seluruh data dari Excel
        finalBarang = excelAnalysis.allBarangFromExcel.length > 0 ? excelAnalysis.allBarangFromExcel : [...barang];
        finalKaryawan = excelAnalysis.allKaryawanFromExcel.length > 0 ? excelAnalysis.allKaryawanFromExcel : [...karyawan];
      } else {
        // Mode Upsert / Cerdas: perbarui yang ada, tambah yang baru, pertahankan yang tidak ada di Excel
        const barangMap = new Map(barang.map((b) => [b.kode.trim().toUpperCase(), b]));

        // Perbarui item yang berubah
        excelAnalysis.barangPreview.toUpdate.forEach((u) => {
          barangMap.set(u.updated.kode.trim().toUpperCase(), u.updated);
        });

        // Tambah item baru
        excelAnalysis.barangPreview.toAdd.forEach((a) => {
          barangMap.set(a.kode.trim().toUpperCase(), a);
        });

        finalBarang = Array.from(barangMap.values());

        // Karyawan
        const karyawanMap = new Map(karyawan.map((k) => [k.badge.trim().toUpperCase(), k]));

        excelAnalysis.karyawanPreview.toUpdate.forEach((u) => {
          karyawanMap.set(u.updated.badge.trim().toUpperCase(), u.updated);
        });

        excelAnalysis.karyawanPreview.toAdd.forEach((a) => {
          karyawanMap.set(a.badge.trim().toUpperCase(), a);
        });

        finalKaryawan = Array.from(karyawanMap.values());
      }

      const syncResult: MasterExcelSyncResult = {
        fileName: excelAnalysis.fileName,
        timestamp: new Date().toLocaleString('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        mode: syncMode,
        barangAdded: excelAnalysis.barangPreview.toAdd.length,
        barangUpdated: excelAnalysis.barangPreview.toUpdate.length,
        barangIdentical: excelAnalysis.barangPreview.identical.length,
        karyawanAdded: excelAnalysis.karyawanPreview.toAdd.length,
        karyawanUpdated: excelAnalysis.karyawanPreview.toUpdate.length,
        karyawanIdentical: excelAnalysis.karyawanPreview.identical.length,
      };

      onApplyMasterExcelSync(finalBarang, finalKaryawan, syncResult);
      setLastSyncInfo(syncResult);
      setExcelAnalysis(null);
      onClose();
    } catch {
      onShowToast('Terjadi kesalahan saat menerapkan sinkronisasi data master.', 'danger');
    } finally {
      setIsApplyingSync(false);
    }
  };

  // --- JSON Handlers ---
  const handleExportJson = () => {
    exportDatabaseBackup(barang, karyawan, transaksi, akun);
    onShowToast('File cadangan database JSON berhasil diunduh!', 'success');
  };

  const handleJsonFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsRestoringJson(true);
      const data = await parseBackupFile(file);
      onRestoreData(data);
      onShowToast(
        `Database JSON berhasil dipulihkan! (${data.barang.length} barang, ${data.transaksi.length} mutasi, ${data.karyawan.length} karyawan)`,
        'success'
      );
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      onShowToast(error.message || 'Gagal membaca file cadangan JSON.', 'danger');
    } finally {
      setIsRestoringJson(false);
      if (jsonFileInputRef.current) jsonFileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl border border-emerald-500/20">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Database & Sinkronisasi Master</h3>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Offline Ready
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Sinkronkan dengan Master Excel, Cadangan JSON, dan Pemulihan Sistem
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

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 bg-slate-100/60 px-6 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('excel')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'excel'
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-xs rounded-t-lg -mb-px'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Sinkronisasi Master Excel</span>
            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-semibold rounded-full">
              Fitur Utama
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('json')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'json'
                ? 'border-blue-600 text-blue-700 bg-white shadow-xs rounded-t-lg -mb-px'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileJson className="w-4 h-4 text-blue-600" />
            <span>Cadangan Database JSON</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'status'
                ? 'border-slate-800 text-slate-900 bg-white shadow-xs rounded-t-lg -mb-px'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-slate-600" />
            <span>Status & Ringkasan Data</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* TAB 1: SINKRONISASI MASTER EXCEL */}
          {activeTab === 'excel' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Last Sync Info Banner */}
              <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-xl flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-950 block">
                      Status Sinkronisasi Master Excel
                    </span>
                    <span className="text-[11px] text-emerald-800">
                      {lastSyncInfo ? (
                        <>
                          Terakhir disinkronkan pada <strong>{lastSyncInfo.timestamp}</strong> dari file{' '}
                          <code className="bg-emerald-100/80 px-1 py-0.5 rounded text-emerald-900 font-semibold font-mono text-[10px]">
                            {lastSyncInfo.fileName}
                          </code>
                          {' • '}
                          Mode: <span className="font-semibold">{lastSyncInfo.mode === 'upsert' ? 'Perbarui & Tambah' : 'Ganti Total'}</span>
                        </>
                      ) : (
                        'Belum pernah melakukan sinkronisasi dengan file Master Excel. Anda dapat mengekspor atau mengunggah data master di bawah.'
                      )}
                    </span>
                  </div>
                </div>

                {lastSyncInfo && (
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Tersinkronisasi</span>
                  </span>
                )}
              </div>

              {/* Step 1 & 2 Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Card 1: Ekspor / Unduh Master Excel */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition-all shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[11px] flex items-center justify-center">
                        1
                      </span>
                      <span>Unduh Data Master ke Excel</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                      Ekspor data inventaris terkini ke dalam berkas Excel terpadu (Multi-Sheet: <em>MASTER_BARANG</em>, <em>MASTER_KARYAWAN</em>, <em>RIWAYAT_MUTASI</em>, dan panduan kolom).
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleExportMasterExcel}
                      className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Master Excel Lengkap (.xlsx)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="w-full py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                      <span>Unduh Template Format Kosong</span>
                    </button>
                  </div>
                </div>

                {/* Card 2: Unggah & Sinkronkan */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-all shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-1.5">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center justify-center">
                        2
                      </span>
                      <span>Unggah File Master Excel untuk Sinkron</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                      Pilih berkas Excel master Anda (.xlsx, .xls, .csv). Sistem akan membaca sheet, membandingkan perbedaan stok/data, dan memberi pratinjau sebelum disimpan.
                    </p>
                  </div>

                  <div>
                    <label className="w-full py-2.5 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>{isAnalyzingExcel ? 'Menganalisis File Excel...' : 'Pilih Berkas Master Excel (.xlsx)'}</span>
                      <input
                        ref={excelFileInputRef}
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        className="hidden"
                        onChange={handleExcelFileSelect}
                        disabled={isAnalyzingExcel || isApplyingSync}
                      />
                    </label>
                    <span className="text-[10px] text-slate-400 block text-center mt-1.5">
                      Mendukung multi-sheet otomatis atau sheet tunggal
                    </span>
                  </div>
                </div>

              </div>

              {/* Analysis Result & Execution Area */}
              {excelAnalysis && (
                <div className="p-5 rounded-2xl border-2 border-emerald-300 bg-emerald-50/30 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between border-b border-emerald-200/80 pb-3">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-emerald-600" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          Hasil Analisis: {excelAnalysis.fileName}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Lembar kerja terdeteksi:{' '}
                          {excelAnalysis.sheetNames.map((s, idx) => (
                            <span
                              key={s}
                              className="inline-block bg-white border border-slate-200 rounded px-1.5 py-0.2 font-mono text-[10px] text-slate-700 mx-0.5"
                            >
                              {s}
                            </span>
                          ))}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExcelAnalysis(null)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
                    >
                      Batal / Ganti Berkas
                    </button>
                  </div>

                  {/* Summary Comparison Chips */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Barang Stats */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-blue-600" />
                          <span>Data Barang ({excelAnalysis.barangPreview.totalInExcel} di Excel)</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-800 border border-emerald-100">
                          <span className="text-[10px] block text-emerald-600 font-medium">Item Baru</span>
                          <span className="font-bold text-sm">+{excelAnalysis.barangPreview.toAdd.length}</span>
                        </div>
                        <div className="p-2 bg-amber-50 rounded-lg text-amber-800 border border-amber-100">
                          <span className="text-[10px] block text-amber-600 font-medium">Update Data</span>
                          <span className="font-bold text-sm">~{excelAnalysis.barangPreview.toUpdate.length}</span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-700 border border-slate-200">
                          <span className="text-[10px] block text-slate-500 font-medium">Identik</span>
                          <span className="font-bold text-sm">={excelAnalysis.barangPreview.identical.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Karyawan Stats */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Data Karyawan ({excelAnalysis.karyawanPreview.totalInExcel} di Excel)</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-800 border border-emerald-100">
                          <span className="text-[10px] block text-emerald-600 font-medium">Staf Baru</span>
                          <span className="font-bold text-sm">+{excelAnalysis.karyawanPreview.toAdd.length}</span>
                        </div>
                        <div className="p-2 bg-amber-50 rounded-lg text-amber-800 border border-amber-100">
                          <span className="text-[10px] block text-amber-600 font-medium">Update Data</span>
                          <span className="font-bold text-sm">~{excelAnalysis.karyawanPreview.toUpdate.length}</span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-700 border border-slate-200">
                          <span className="text-[10px] block text-slate-500 font-medium">Identik</span>
                          <span className="font-bold text-sm">={excelAnalysis.karyawanPreview.identical.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sync Mode Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-800 block">
                      Pilih Mode Sinkronisasi:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                          syncMode === 'upsert'
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="syncMode"
                          checked={syncMode === 'upsert'}
                          onChange={() => setSyncMode('upsert')}
                          className="mt-1 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">
                            Perbarui & Tambah (Upsert - Direkomendasikan)
                          </span>
                          <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                            Memperbarui stok/data barang & personalia yang cocok berdasarkan Kode/Badge, menambahkan data baru, dan menjaga data lain tetap utuh.
                          </span>
                        </div>
                      </label>

                      <label
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                          syncMode === 'replace'
                            ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="syncMode"
                          checked={syncMode === 'replace'}
                          onChange={() => setSyncMode('replace')}
                          className="mt-1 text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">
                            Ganti Total Master Data (Replace)
                          </span>
                          <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                            Menimpa seluruh daftar barang dan karyawan lokal sesuai persis dengan isi berkas Excel ini.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Toggle Preview Details */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowDiffDetails((prev) => !prev)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{showDiffDetails ? 'Sembunyikan Rincian Perubahan' : 'Lihat Rincian Perubahan (Pratinjau)'}</span>
                      <ArrowRight className={`w-3.5 h-3.5 transition-transform ${showDiffDetails ? 'rotate-90' : ''}`} />
                    </button>

                    {showDiffDetails && (
                      <div className="mt-2.5 max-h-48 overflow-y-auto p-3 bg-white rounded-xl border border-slate-200 text-[11px] space-y-2">
                        {excelAnalysis.barangPreview.toUpdate.length > 0 && (
                          <div>
                            <span className="font-bold text-amber-700 block mb-1">
                              Barang yang akan diupdate ({excelAnalysis.barangPreview.toUpdate.length}):
                            </span>
                            <ul className="space-y-1 pl-2">
                              {excelAnalysis.barangPreview.toUpdate.slice(0, 10).map((u, i) => (
                                <li key={i} className="text-slate-600 border-l-2 border-amber-400 pl-2">
                                  <strong>[{u.updated.kode}] {u.updated.nama}:</strong> {u.changes.join(', ')}
                                </li>
                              ))}
                              {excelAnalysis.barangPreview.toUpdate.length > 10 && (
                                <li className="text-slate-400 italic">
                                  ...dan {excelAnalysis.barangPreview.toUpdate.length - 10} barang lainnya
                                </li>
                              )}
                            </ul>
                          </div>
                        )}

                        {excelAnalysis.barangPreview.toAdd.length > 0 && (
                          <div className="pt-2 border-t border-slate-100">
                            <span className="font-bold text-emerald-700 block mb-1">
                              Barang baru yang akan ditambahkan ({excelAnalysis.barangPreview.toAdd.length}):
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {excelAnalysis.barangPreview.toAdd.slice(0, 10).map((a, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px]"
                                >
                                  [{a.kode}] {a.nama} ({a.stok} {a.satuan})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {excelAnalysis.karyawanPreview.toUpdate.length > 0 && (
                          <div className="pt-2 border-t border-slate-100">
                            <span className="font-bold text-amber-700 block mb-1">
                              Karyawan yang akan diupdate ({excelAnalysis.karyawanPreview.toUpdate.length}):
                            </span>
                            <ul className="space-y-1 pl-2">
                              {excelAnalysis.karyawanPreview.toUpdate.slice(0, 5).map((u, i) => (
                                <li key={i} className="text-slate-600 border-l-2 border-amber-400 pl-2">
                                  <strong>[{u.updated.badge}] {u.updated.nama}:</strong> {u.changes.join(', ')}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Apply Sync Confirmation Button */}
                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setExcelAnalysis(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteSync}
                      disabled={isApplyingSync}
                      className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-200" />
                      <span>{isApplyingSync ? 'Menerapkan Sinkronisasi...' : 'Terapkan Sinkronisasi Sekarang'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Instructions Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tips Sinkronisasi Cerdas dengan Master Excel:</span>
                </span>
                <p>
                  1. Anda dapat mengunduh berkas Master Excel di tombol <strong>(1)</strong>, mengedit stok fisik hasil stock opname atau menambah data di Excel, lalu mengunggahnya kembali di tombol <strong>(2)</strong>.
                </p>
                <p>
                  2. Kolom <strong>Kode Barang</strong> dan <strong>ID Badge</strong> berfungsi sebagai kunci identifikasi unik sehingga histori mutasi tidak terganggu.
                </p>
              </div>

            </div>
          )}

          {/* TAB 2: CADANGAN JSON (SNAPSHOT LENGKAP) */}
          {activeTab === 'json' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl flex items-start gap-3">
                <FileJson className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-blue-950 block">
                    Cadangan Database JSON Penuh (Full System Snapshot)
                  </span>
                  <span className="text-[11px] text-blue-800 leading-relaxed block mt-0.5">
                    Berkas JSON mencakup seluruh snapshot inventaris, log transaksi mutasi IN-OUT, akun pengguna, dan personalia karyawan dalam format digital standar untuk arsip atau transfer perangkat.
                  </span>
                </div>
              </div>

              {/* JSON Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Backup Card */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-xs mb-1.5">
                      <Download className="w-4 h-4 text-blue-600" />
                      <span>Cadangkan Seluruh Database</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                      Simpan file cadangan .json ke komputer atau flashdisk Anda sebagai arsip aman data logistik.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="w-full py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh File Cadangan JSON</span>
                  </button>
                </div>

                {/* Restore Card */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition-colors flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-xs mb-1.5">
                      <Database className="w-4 h-4 text-emerald-600" />
                      <span>Pulihkan Database (Restore)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                      Muat kembali berkas JSON cadangan yang pernah Anda unduh untuk mengembalikan seluruh sistem.
                    </p>
                  </div>
                  <label className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isRestoringJson ? 'Memulihkan...' : 'Pilih File JSON Cadangan'}</span>
                    <input
                      ref={jsonFileInputRef}
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleJsonFileChange}
                      disabled={isRestoringJson}
                    />
                  </label>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: STATUS & RINGKASAN DATA */}
          {activeTab === 'status' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Storage Status Banner */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-emerald-950 block">
                      Penyimpanan Browser Offline Aktif
                    </span>
                    <span className="text-[11px] text-emerald-800">
                      Semua data inventaris, mutasi, dan personalia tersimpan murni di perangkat Anda tanpa ketergantungan server luar atau Firebase.
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                  100% Bebas Firebase
                </span>
              </div>

              {/* Database Metrics Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  Jumlah Data Tersimpan Saat Ini
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <span className="text-[11px] text-slate-500 block">Stok Barang</span>
                    <span className="text-lg font-bold text-slate-900 tabular-nums">{barang.length}</span>
                    <span className="text-[10px] text-slate-400 block">Item inventaris</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <span className="text-[11px] text-slate-500 block">Mutasi Transaksi</span>
                    <span className="text-lg font-bold text-blue-600 tabular-nums">{transaksi.length}</span>
                    <span className="text-[10px] text-slate-400 block">Log IN & OUT</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <span className="text-[11px] text-slate-500 block">Data Karyawan</span>
                    <span className="text-lg font-bold text-slate-900 tabular-nums">{karyawan.length}</span>
                    <span className="text-[10px] text-slate-400 block">Personalia staf</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <span className="text-[11px] text-slate-500 block">Akun Pengguna</span>
                    <span className="text-lg font-bold text-emerald-600 tabular-nums">{akun.length}</span>
                    <span className="text-[10px] text-slate-400 block">Pengguna sistem</span>
                  </div>
                </div>
              </div>

              {/* Privacy and Security Note */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">Keamanan & Kecepatan:</strong> Akses data instan tanpa latensi jaringan internet. Anda dapat membuat salinan berkala menggunakan Master Excel maupun JSON.
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200 shrink-0">
          <button
            type="button"
            onClick={onResetDefault}
            className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Data Demo Bawaan</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
