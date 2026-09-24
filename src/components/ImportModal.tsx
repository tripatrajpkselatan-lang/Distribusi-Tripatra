import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Download, FileSpreadsheet, AlertCircle, X, Check, ArrowRight } from 'lucide-react';
import { Barang, Karyawan } from '../types';
import { downloadBarangTemplate, downloadKaryawanTemplate } from '../storage';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'barang' | 'karyawan';
  existingBarang: Barang[];
  existingKaryawan: Karyawan[];
  onImportBarang: (items: Barang[], mode: 'update' | 'skip') => void;
  onImportKaryawan: (items: Karyawan[], mode: 'update' | 'skip') => void;
  onShowToast: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  type,
  existingBarang,
  existingKaryawan,
  onImportBarang,
  onImportKaryawan,
  onShowToast,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [duplicateOption, setDuplicateOption] = useState<'update' | 'skip'>('update');
  const [parsedBarang, setParsedBarang] = useState<Barang[]>([]);
  const [parsedKaryawan, setParsedKaryawan] = useState<Karyawan[]>([]);
  const [fileName, setFileName] = useState('');

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    if (type === 'barang') {
      downloadBarangTemplate();
      onShowToast('Template Excel Data Barang berhasil diunduh.', 'info');
    } else {
      downloadKaryawanTemplate();
      onShowToast('Template Excel Data Karyawan berhasil diunduh.', 'info');
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

        if (!rawRows || rawRows.length === 0) {
          onShowToast('File Excel/CSV tidak memiliki data atau baris kosong.', 'warning');
          return;
        }

        if (type === 'barang') {
          let nextIdx = existingBarang.length + 1;
          const items: Barang[] = rawRows
            .map((r) => {
              const rawKode = r['Kode Barang'] || r['Kode'] || r['Item Code'] || r['kode'] || '';
              const rawNama = r['Nama Barang'] || r['Nama'] || r['Item Name'] || r['nama'] || '';
              const rawKategori = r['Kategori'] || r['Category'] || r['kategori'] || 'Material & Sparepart';
              const rawStok = r['Stok Saat Ini'] ?? r['Stok'] ?? r['Qty'] ?? 0;
              const rawMinStok = r['Batas Minimum Stok'] ?? r['Min. Stok'] ?? r['Min Stok'] ?? 5;
              const rawSatuan = r['Satuan'] || r['Unit'] || 'Unit';
              const rawLokasi = r['Lokasi Rak'] || r['Lokasi'] || 'Gudang Utama';

              const kode =
                String(rawKode).trim().toUpperCase() ||
                `BRG-${String(nextIdx++).padStart(3, '0')}`;
              const nama = String(rawNama).trim();

              return {
                id: 'b_imp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
                kode,
                nama: nama || `Barang ${kode}`,
                kategori: String(rawKategori).trim() || 'Material & Sparepart',
                stok: Math.max(0, parseInt(String(rawStok), 10) || 0),
                minStok: Math.max(0, parseInt(String(rawMinStok), 10) || 0),
                satuan: String(rawSatuan).trim() || 'Unit',
                lokasi: String(rawLokasi).trim() || 'Gudang Utama',
              };
            })
            .filter((item) => item.nama);

          setParsedBarang(items);
        } else {
          let nextIdx = existingKaryawan.length + 1;
          const items: Karyawan[] = rawRows
            .map((r) => {
              const rawBadge = r['ID Badge'] || r['Badge ID'] || r['NIK'] || '';
              const rawNama = r['Nama Karyawan'] || r['Nama'] || r['Nama Lengkap'] || '';
              const rawDept = r['Departemen'] || r['Dept'] || 'Logistik & Gudang';
              const rawJabatan = r['Jabatan'] || r['Position'] || 'Staff';
              const rawEmail = r['Email / Kontak'] || r['Email'] || '-';
              const rawStatus = r['Status'] || 'Aktif';

              const badge =
                String(rawBadge).trim().toUpperCase() ||
                `KRY-${String(nextIdx++).padStart(3, '0')}`;
              const nama = String(rawNama).trim();

              const statusValue: 'Aktif' | 'Nonaktif' =
                String(rawStatus).trim().toLowerCase() === 'nonaktif' ? 'Nonaktif' : 'Aktif';

              return {
                id: 'k_imp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
                badge,
                nama: nama || `Karyawan ${badge}`,
                dept: String(rawDept).trim() || 'Logistik & Gudang',
                jabatan: String(rawJabatan).trim() || 'Staff',
                email: String(rawEmail).trim() || '-',
                status: statusValue,
              };
            })
            .filter((item) => item.nama);

          setParsedKaryawan(items);
        }
      } catch (err: unknown) {
        const error = err as Error;
        onShowToast(error.message || 'Gagal membaca format file Excel/CSV.', 'danger');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const totalParsed = type === 'barang' ? parsedBarang.length : parsedKaryawan.length;

  const handleExecute = () => {
    if (type === 'barang') {
      if (parsedBarang.length === 0) return;
      onImportBarang(parsedBarang, duplicateOption);
      onShowToast(`Berhasil mengimpor ${parsedBarang.length} data barang inventaris!`, 'success');
    } else {
      if (parsedKaryawan.length === 0) return;
      onImportKaryawan(parsedKaryawan, duplicateOption);
      onShowToast(`Berhasil mengimpor ${parsedKaryawan.length} data karyawan!`, 'success');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Impor Data {type === 'barang' ? 'Stok Barang' : 'Karyawan & Personalia'}
              </h3>
              <p className="text-xs text-slate-500">
                Unggah file Excel (.xlsx, .xls) atau CSV untuk memasukkan data secara massal
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

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Instructions and Template Download */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 text-blue-900">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Gunakan template resmi agar nama kolom terbaca dengan benar oleh sistem.
              </span>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Template Excel</span>
            </button>
          </div>

          {/* File Picker & Duplication settings */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilih File Excel / CSV
              </label>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileSelected}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>
              {fileName && (
                <div className="mt-1.5 text-[11px] text-slate-600 flex items-center gap-1">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>File terpilih: <strong>{fileName}</strong></span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200/80">
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jika {type === 'barang' ? 'Kode Barang' : 'ID Badge'} sudah terdaftar:
              </span>
              <div className="flex flex-wrap gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dupOpt"
                    value="update"
                    checked={duplicateOption === 'update'}
                    onChange={() => setDuplicateOption('update')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Perbarui Data (Update informasi terbaru)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dupOpt"
                    value="skip"
                    checked={duplicateOption === 'skip'}
                    onChange={() => setDuplicateOption('skip')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Lewati (Skip data yang sudah ada)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Preview Table */}
          {totalParsed > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span>Pratinjau Data Impor ({totalParsed} baris terbaca):</span>
                <span className="text-[11px] text-slate-500">
                  Mode: {duplicateOption === 'update' ? 'Update Duplikat' : 'Lewati Duplikat'}
                </span>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                {type === 'barang' ? (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[10px] uppercase">
                      <tr>
                        <th className="p-2">Kode</th>
                        <th className="p-2">Nama Barang</th>
                        <th className="p-2">Kategori</th>
                        <th className="p-2 text-center">Stok</th>
                        <th className="p-2">Satuan</th>
                        <th className="p-2 text-center">Min</th>
                        <th className="p-2">Lokasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedBarang.slice(0, 15).map((b, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-mono font-bold text-slate-700">{b.kode}</td>
                          <td className="p-2 font-medium text-slate-900">{b.nama}</td>
                          <td className="p-2 text-slate-500">{b.kategori}</td>
                          <td className="p-2 text-center font-semibold text-slate-800">{b.stok}</td>
                          <td className="p-2 text-slate-500">{b.satuan}</td>
                          <td className="p-2 text-center text-slate-500">{b.minStok}</td>
                          <td className="p-2 text-slate-500">{b.lokasi}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[10px] uppercase">
                      <tr>
                        <th className="p-2">ID Badge</th>
                        <th className="p-2">Nama Karyawan</th>
                        <th className="p-2">Departemen</th>
                        <th className="p-2">Jabatan</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedKaryawan.slice(0, 15).map((k, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-mono font-bold text-blue-600">{k.badge}</td>
                          <td className="p-2 font-medium text-slate-900">{k.nama}</td>
                          <td className="p-2 text-slate-500">{k.dept}</td>
                          <td className="p-2 text-slate-500">{k.jabatan}</td>
                          <td className="p-2 text-slate-500">{k.email}</td>
                          <td className="p-2 text-slate-500">{k.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              {totalParsed > 15 && (
                <p className="text-[11px] text-slate-400 text-right">
                  + {totalParsed - 15} baris lainnya siap diimpor
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleExecute}
            disabled={totalParsed === 0}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5 ${
              totalParsed > 0
                ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Mulai Impor ({totalParsed} Data)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
