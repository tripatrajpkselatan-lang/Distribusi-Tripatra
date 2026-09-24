import * as XLSX from 'xlsx';
import {
  Barang,
  Karyawan,
  TransaksiMutasi,
  AkunPengguna,
  BackupData,
  MasterExcelSyncResult,
  MasterExcelAnalysis,
} from './types';
import { DEFAULT_BARANG, DEFAULT_KARYAWAN, DEFAULT_TRANSAKSI, DEFAULT_AKUN } from './defaultData';

const STORAGE_KEYS = {
  BARANG: 'jpk_logistik_barang_v2',
  KARYAWAN: 'jpk_logistik_karyawan_v2',
  TRANSAKSI: 'jpk_logistik_transaksi_v2',
  AKUN: 'jpk_logistik_akun_v2',
  SESSION: 'jpk_logistik_session_user_v2',
  LAST_EXCEL_SYNC: 'jpk_logistik_last_excel_sync_v2',
};

// --- Last Excel Sync Log ---
export function loadLastExcelSync(): MasterExcelSyncResult | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LAST_EXCEL_SYNC);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveLastExcelSync(info: MasterExcelSyncResult): void {
  localStorage.setItem(STORAGE_KEYS.LAST_EXCEL_SYNC, JSON.stringify(info));
}

// --- Storage Loaders ---
export function normalizeKategoriBarang(cat?: string): string {
  if (!cat) return 'Consumable';
  const c = cat.trim().toUpperCase();
  if (c === 'ATK' || c.includes('TULIS') || c.includes('KANTOR') || c.includes('KERTAS') || c.includes('STATIONERY') || c.includes('PRINTER')) {
    return 'ATK';
  }
  return 'Consumable';
}

export function loadBarang(): Barang[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BARANG);
    if (!data) return [...DEFAULT_BARANG];
    const parsed: Barang[] = JSON.parse(data);
    return parsed.map((item) => ({
      ...item,
      kategori: item.kategori === 'ATK' || item.kategori === 'Consumable' 
        ? item.kategori 
        : normalizeKategoriBarang(item.kategori),
    }));
  } catch {
    return [...DEFAULT_BARANG];
  }
}

export function saveBarang(items: Barang[]): void {
  localStorage.setItem(STORAGE_KEYS.BARANG, JSON.stringify(items));
}

export function loadKaryawan(): Karyawan[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.KARYAWAN);
    return data ? JSON.parse(data) : [...DEFAULT_KARYAWAN];
  } catch {
    return [...DEFAULT_KARYAWAN];
  }
}

export function saveKaryawan(items: Karyawan[]): void {
  localStorage.setItem(STORAGE_KEYS.KARYAWAN, JSON.stringify(items));
}

function cleanKeteranganMutasi(ket?: string): string {
  if (!ket) return '-';
  let s = ket
    .replace(/^Doc:\s*[^|]+\|\s*/i, '')
    .replace(/^Batch-[0-9a-zA-Z]+\s*\|\s*/i, '')
    .replace(/\bPO\s*#?\s*[0-9a-zA-Z_-]+/gi, '')
    .replace(/\b(No\.?\s*Dokumen|Dokumen|Ref\.?)\s*[:#-]?\s*[0-9a-zA-Z_-]+/gi, '')
    .trim();
  if (s.startsWith('|')) s = s.substring(1).trim();
  if (s.endsWith('|')) s = s.substring(0, s.length - 1).trim();
  return s || '-';
}

export function loadTransaksi(): TransaksiMutasi[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSAKSI);
    if (!data) return [...DEFAULT_TRANSAKSI];
    const parsed: TransaksiMutasi[] = JSON.parse(data);
    return parsed.map((t) => ({
      ...t,
      keterangan: cleanKeteranganMutasi(t.keterangan),
    }));
  } catch {
    return [...DEFAULT_TRANSAKSI];
  }
}

export function saveTransaksi(items: TransaksiMutasi[]): void {
  localStorage.setItem(STORAGE_KEYS.TRANSAKSI, JSON.stringify(items));
}

export function loadAkun(): AkunPengguna[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.AKUN);
    return data ? JSON.parse(data) : [...DEFAULT_AKUN];
  } catch {
    return [...DEFAULT_AKUN];
  }
}

export function saveAkun(items: AkunPengguna[]): void {
  localStorage.setItem(STORAGE_KEYS.AKUN, JSON.stringify(items));
}

export function loadSessionUser(): AkunPengguna | null {
  try {
    const data = sessionStorage.getItem(STORAGE_KEYS.SESSION);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveSessionUser(user: AkunPengguna | null): void {
  if (user) {
    sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(STORAGE_KEYS.SESSION);
  }
}

export function resetAllDataToDefault(): void {
  saveBarang([...DEFAULT_BARANG]);
  saveKaryawan([...DEFAULT_KARYAWAN]);
  saveTransaksi([...DEFAULT_TRANSAKSI]);
  saveAkun([...DEFAULT_AKUN]);
}

// --- JSON Backup & Restore ---
export function exportDatabaseBackup(
  barang: Barang[],
  karyawan: Karyawan[],
  transaksi: TransaksiMutasi[],
  akun: AkunPengguna[]
): void {
  const backup: BackupData = {
    version: '2.0',
    app: 'Portal Logistik & Karyawan (Offline DB)',
    exportedAt: new Date().toISOString(),
    barang,
    karyawan,
    transaksi,
    akun,
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Backup_Database_Logistik_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function parseBackupFile(file: File): Promise<BackupData> {
  const text = await file.text();
  const parsed = JSON.parse(text) as BackupData;
  if (!parsed || !Array.isArray(parsed.barang) || !Array.isArray(parsed.karyawan)) {
    throw new Error('Format file cadangan (backup) tidak valid.');
  }
  return parsed;
}

// --- Excel & CSV Export Helpers ---
export function exportBarangToExcelFile(barang: Barang[]): void {
  const data = barang.map((b, idx) => ({
    'No': idx + 1,
    'Kode Barang': b.kode,
    'Nama Barang': b.nama,
    'Kategori': b.kategori,
    'Stok Saat Ini': b.stok,
    'Satuan': b.satuan,
    'Batas Minimum Stok': b.minStok,
    'Status': b.stok > b.minStok ? 'Ready' : 'Re-Order',
    'Lokasi Rak': b.lokasi,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Stok Barang');
  XLSX.writeFile(wb, `Stok_Barang_Logistik_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportBarangToCsvFile(barang: Barang[]): void {
  const data = barang.map((b, idx) => ({
    'No': idx + 1,
    'Kode Barang': b.kode,
    'Nama Barang': b.nama,
    'Kategori': b.kategori,
    'Stok Saat Ini': b.stok,
    'Satuan': b.satuan,
    'Batas Minimum Stok': b.minStok,
    'Status': b.stok > b.minStok ? 'Ready' : 'Re-Order',
    'Lokasi Rak': b.lokasi,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const csvOutput = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Stok_Barang_Logistik_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadBarangTemplate(): void {
  const sample = [
    {
      'Kode Barang': 'BRG-101',
      'Nama Barang': 'Kertas HVS A4 75gr Sinar Dunia',
      'Kategori': 'ATK',
      'Stok': 25,
      'Batas Minimum Stok': 10,
      'Satuan': 'Rim',
      'Lokasi Rak': 'Gudang A - Rak 03',
    },
    {
      'Kode Barang': 'BRG-102',
      'Nama Barang': 'Sarung Tangan Karet Nitrile Heavy Duty',
      'Kategori': 'Consumable',
      'Stok': 60,
      'Batas Minimum Stok': 20,
      'Satuan': 'Pasang',
      'Lokasi Rak': 'Loker APD - Rak 03',
    },
    {
      'Kode Barang': 'BRG-103',
      'Nama Barang': 'Lakban Coklat Packing 2 Inch',
      'Kategori': 'Consumable',
      'Stok': 50,
      'Batas Minimum Stok': 15,
      'Satuan': 'Roll',
      'Lokasi Rak': 'Gudang B - Rak 05',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sample);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Barang');
  XLSX.writeFile(wb, 'Template_Impor_Data_Barang.xlsx');
}

export function exportKaryawanToExcelFile(karyawan: Karyawan[]): void {
  const data = karyawan.map((k, idx) => ({
    'No': idx + 1,
    'ID Badge': k.badge,
    'Nama Karyawan': k.nama,
    'Departemen': k.dept,
    'Jabatan': k.jabatan,
    'Email / Kontak': k.email,
    'Status': k.status,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data Karyawan');
  XLSX.writeFile(wb, `Data_Karyawan_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportKaryawanToCsvFile(karyawan: Karyawan[]): void {
  const data = karyawan.map((k, idx) => ({
    'No': idx + 1,
    'ID Badge': k.badge,
    'Nama Karyawan': k.nama,
    'Departemen': k.dept,
    'Jabatan': k.jabatan,
    'Email / Kontak': k.email,
    'Status': k.status,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const csvOutput = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Data_Karyawan_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadKaryawanTemplate(): void {
  const sample = [
    {
      'ID Badge': 'KRY-010',
      'Nama Karyawan': 'Rian Permana',
      'Departemen': 'Logistik & Gudang',
      'Jabatan': 'Picker & Packer',
      'Email / Kontak': 'rian.permana@jpkselatan.com',
      'Status': 'Aktif',
    },
    {
      'ID Badge': 'KRY-011',
      'Nama Karyawan': 'Maya Putri',
      'Departemen': 'Operasional',
      'Jabatan': 'Staff Administrasi',
      'Email / Kontak': 'maya.putri@jpkselatan.com',
      'Status': 'Aktif',
    },
    {
      'ID Badge': 'KRY-012',
      'Nama Karyawan': 'Fajar Hidayat',
      'Departemen': 'Keuangan & Akuntansi',
      'Jabatan': 'Finance Officer',
      'Email / Kontak': 'fajar.hidayat@jpkselatan.com',
      'Status': 'Aktif',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sample);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Karyawan');
  XLSX.writeFile(wb, 'Template_Impor_Data_Karyawan.xlsx');
}

export function exportMutasiToExcelFile(mutasi: TransaksiMutasi[]): void {
  const data = mutasi.map((t, idx) => ({
    'No': idx + 1,
    'Tanggal & Waktu': t.tanggal,
    'Tipe': t.tipe === 'IN' ? 'Barang Masuk (IN)' : 'Barang Keluar (OUT)',
    'Kode Barang': t.kode,
    'Nama Barang': t.nama,
    'Jumlah Mutasi': t.qty,
    'Stok Awal': t.stokAwal,
    'Stok Akhir': t.stokAkhir,
    'PIC Penanggung Jawab': t.pic,
    'Keterangan': t.keterangan,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Mutasi IN-OUT');
  XLSX.writeFile(wb, `Riwayat_Mutasi_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportPersediaanKritisToExcelFile(criticalItems: Barang[]): void {
  const data = criticalItems.map((b, idx) => {
    const deficit = Math.max(0, b.minStok - b.stok);
    return {
      'No': idx + 1,
      'Kode Barang': b.kode,
      'Nama Barang': b.nama,
      'Kategori': b.kategori,
      'Stok Saat Ini': b.stok,
      'Batas Minimum Stok': b.minStok,
      'Defisit / Kekurangan': deficit,
      'Satuan': b.satuan,
      'Status': 'KRITIS / RE-ORDER',
      'Lokasi Rak': b.lokasi,
      'Rekomendasi Tindakan': `Segera Pesan Ulang Minimal ${deficit > 0 ? deficit : 1} ${b.satuan}`,
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Stok Kritis Re-Order');
  XLSX.writeFile(wb, `Laporan_Persediaan_Kritis_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// --- Master Excel Workbook Multi-Sheet Export & Sync ---

/**
 * Ekspor seluruh database master ke satu file Excel terpadu (Multi-Sheet Workbook)
 */
export function exportMasterExcelWorkbook(
  barang: Barang[],
  karyawan: Karyawan[],
  mutasi: TransaksiMutasi[]
): void {
  const wb = XLSX.utils.book_new();

  // 1. Sheet Master Barang
  const dataBarang = barang.map((b, idx) => ({
    'No': idx + 1,
    'Kode Barang': b.kode,
    'Nama Barang': b.nama,
    'Kategori': b.kategori,
    'Stok Saat Ini': b.stok,
    'Satuan': b.satuan,
    'Batas Minimum Stok': b.minStok,
    'Status Stok': b.stok > b.minStok ? 'Ready' : 'Re-Order',
    'Lokasi Rak': b.lokasi,
  }));
  const wsBarang = XLSX.utils.json_to_sheet(dataBarang);
  XLSX.utils.book_append_sheet(wb, wsBarang, 'MASTER_BARANG');

  // 2. Sheet Master Karyawan
  const dataKaryawan = karyawan.map((k, idx) => ({
    'No': idx + 1,
    'ID Badge': k.badge,
    'Nama Karyawan': k.nama,
    'Departemen': k.dept,
    'Jabatan': k.jabatan,
    'Email / Kontak': k.email,
    'Status': k.status,
  }));
  const wsKaryawan = XLSX.utils.json_to_sheet(dataKaryawan);
  XLSX.utils.book_append_sheet(wb, wsKaryawan, 'MASTER_KARYAWAN');

  // 3. Sheet Riwayat Mutasi
  const dataMutasi = mutasi.map((m, idx) => ({
    'No': idx + 1,
    'Tanggal & Waktu': m.tanggal,
    'Tipe': m.tipe === 'IN' ? 'Barang Masuk (IN)' : 'Barang Keluar (OUT)',
    'Kode Barang': m.kode,
    'Nama Barang': m.nama,
    'Jumlah Mutasi': m.qty,
    'Stok Awal': m.stokAwal,
    'Stok Akhir': m.stokAkhir,
    'PIC Penanggung Jawab': m.pic,
    'Keterangan': m.keterangan,
  }));
  const wsMutasi = XLSX.utils.json_to_sheet(dataMutasi);
  XLSX.utils.book_append_sheet(wb, wsMutasi, 'RIWAYAT_MUTASI');

  // 4. Sheet Panduan Sinkronisasi
  const panduan = [
    {
      'Petunjuk Sinkronisasi Master Excel': '1. Mengubah Data: Anda dapat mengubah Stok, Lokasi Rak, atau Nama di sheet MASTER_BARANG.',
      'Keterangan': 'Kolom "Kode Barang" dijadikan kunci unik utama untuk pencocokan.',
    },
    {
      'Petunjuk Sinkronisasi Master Excel': '2. Menambah Data Baru: Tambahkan baris baru dengan Kode Barang atau ID Badge yang belum pernah ada.',
      'Keterangan': 'Sistem akan otomatis mendeteksi dan menambahkannya ke inventaris/karyawan.',
    },
    {
      'Petunjuk Sinkronisasi Master Excel': '3. Sinkronisasi Ulang: Unggah kembali file ini di menu "Database & Cadangan" -> Tab "Sinkronisasi Master Excel".',
      'Keterangan': 'Pilih mode "Perbarui & Tambah (Upsert)" agar mutasi transaksi tetap terjaga aman.',
    },
  ];
  const wsPanduan = XLSX.utils.json_to_sheet(panduan);
  XLSX.utils.book_append_sheet(wb, wsPanduan, 'PANDUAN_SINKRON');

  const fileName = `Master_Database_Logistik_JPK_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Unduh Template Kosong Master Excel Multi-Sheet
 */
export function downloadMasterExcelTemplate(): void {
  const wb = XLSX.utils.book_new();

  const contohBarang = [
    {
      'Kode Barang': 'BRG-001',
      'Nama Barang': 'Kardus Box Single Wall 40x30x25 cm',
      'Kategori': 'Consumable',
      'Stok Saat Ini': 150,
      'Satuan': 'Pcs',
      'Batas Minimum Stok': 50,
      'Lokasi Rak': 'Gudang A - Rak 01',
    },
    {
      'Kode Barang': 'BRG-002',
      'Nama Barang': 'Kertas Thermal Struk 80x80mm',
      'Kategori': 'ATK',
      'Stok Saat Ini': 40,
      'Satuan': 'Roll',
      'Batas Minimum Stok': 15,
      'Lokasi Rak': 'Gudang A - Rak 02',
    },
  ];
  const wsBarang = XLSX.utils.json_to_sheet(contohBarang);
  XLSX.utils.book_append_sheet(wb, wsBarang, 'MASTER_BARANG');

  const contohKaryawan = [
    {
      'ID Badge': 'KRY-001',
      'Nama Karyawan': 'Ahmad Fauzi',
      'Departemen': 'Logistik & Gudang',
      'Jabatan': 'Warehouse Supervisor',
      'Email / Kontak': 'ahmad.fauzi@jpkselatan.com',
      'Status': 'Aktif',
    },
    {
      'ID Badge': 'KRY-002',
      'Nama Karyawan': 'Budi Santoso',
      'Departemen': 'Logistik & Gudang',
      'Jabatan': 'Staff Admin Mutasi',
      'Email / Kontak': 'budi.santoso@jpkselatan.com',
      'Status': 'Aktif',
    },
  ];
  const wsKaryawan = XLSX.utils.json_to_sheet(contohKaryawan);
  XLSX.utils.book_append_sheet(wb, wsKaryawan, 'MASTER_KARYAWAN');

  XLSX.writeFile(wb, 'Template_Master_Database_JPK.xlsx');
}

/**
 * Helper pembaca nilai sel dengan pencocokan nama kolom fleksibel
 */
function getFlexValue(row: Record<string, any>, possibleKeys: string[]): string {
  const rowKeys = Object.keys(row);
  for (const pKey of possibleKeys) {
    const targetNorm = pKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    const foundKey = rowKeys.find(
      (k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === targetNorm
    );
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
      return String(row[foundKey]).trim();
    }
  }
  return '';
}

/**
 * Mengurai dan menganalisis berkas Excel Master untuk melihat perubahan (diff)
 */
export async function parseAndAnalyzeMasterExcel(
  file: File,
  currentBarang: Barang[],
  currentKaryawan: Karyawan[]
): Promise<MasterExcelAnalysis> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetNames = wb.SheetNames;

  if (!sheetNames || sheetNames.length === 0) {
    throw new Error('File Excel tidak memiliki lembar kerja (worksheet).');
  }

  // 1. Identifikasi Lembar Kerja (Worksheet Detection)
  let barangSheetName: string | undefined;
  let karyawanSheetName: string | undefined;
  let mutasiSheetName: string | undefined;

  for (const name of sheetNames) {
    const lower = name.toLowerCase();
    if (lower.includes('barang') || lower.includes('item') || lower.includes('stok') || lower.includes('inventory')) {
      if (!barangSheetName) barangSheetName = name;
    } else if (lower.includes('karyawan') || lower.includes('pegawai') || lower.includes('staff') || lower.includes('employee') || lower.includes('personalia')) {
      if (!karyawanSheetName) karyawanSheetName = name;
    } else if (lower.includes('mutasi') || lower.includes('transaksi')) {
      if (!mutasiSheetName) mutasiSheetName = name;
    }
  }

  // Jika belum ditemukan lewat nama sheet, periksa baris header sheet
  if (!barangSheetName && !karyawanSheetName && sheetNames.length > 0) {
    for (const name of sheetNames) {
      const sheet = wb.Sheets[name];
      if (!sheet) continue;
      const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { header: 1, range: 0, defval: '' });
      if (json.length > 0 && Array.isArray(json[0])) {
        const headers = json[0].map((h: any) => String(h).toLowerCase());
        const hasKode = headers.some((h) => h.includes('kode') || h.includes('item'));
        const hasBadge = headers.some((h) => h.includes('badge') || h.includes('nik') || h.includes('karyawan'));
        if (hasKode && !barangSheetName) {
          barangSheetName = name;
        } else if (hasBadge && !karyawanSheetName) {
          karyawanSheetName = name;
        }
      }
    }
  }

  // Default fallback jika hanya ada 1 sheet di file
  if (!barangSheetName && !karyawanSheetName && sheetNames.length === 1) {
    barangSheetName = sheetNames[0];
  }

  // 2. Parse & Analisis Sheet Barang
  const allBarangFromExcel: Barang[] = [];
  const barangToAdd: Barang[] = [];
  const barangToUpdate: { current: Barang; updated: Barang; changes: string[] }[] = [];
  const barangIdentical: Barang[] = [];

  if (barangSheetName && wb.Sheets[barangSheetName]) {
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(wb.Sheets[barangSheetName], { defval: '' });

    rawRows.forEach((row, index) => {
      const kode = getFlexValue(row, ['kode barang', 'kode', 'kode_barang', 'item code', 'sku']);
      const nama = getFlexValue(row, ['nama barang', 'nama', 'item name', 'nama_barang', 'description']);

      if (!kode && !nama) return; // Abaikan baris kosong
      const finalKode = kode || `BRG-${100 + index}`;
      const finalNama = nama || 'Barang Tanpa Nama';
      const rawKategori = getFlexValue(row, ['kategori', 'category', 'kelompok']);
      const kategori = normalizeKategoriBarang(rawKategori);
      const rawStok = getFlexValue(row, ['stok saat ini', 'stok', 'stock', 'qty', 'jumlah']);
      const stok = isNaN(Number(rawStok)) ? 0 : Math.max(0, parseInt(rawStok, 10));
      const rawMin = getFlexValue(row, ['batas minimum stok', 'min stok', 'minimum stok', 'min_stok']);
      const minStok = isNaN(Number(rawMin)) ? 5 : Math.max(0, parseInt(rawMin, 10));
      const satuan = getFlexValue(row, ['satuan', 'unit', 'uom']) || 'Pcs';
      const lokasi = getFlexValue(row, ['lokasi rak', 'lokasi', 'rak', 'location', 'bin']) || 'Gudang Utama';

      const parsedItem: Barang = {
        id: 'brg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        kode: finalKode,
        nama: finalNama,
        kategori,
        stok,
        minStok,
        satuan,
        lokasi,
      };

      allBarangFromExcel.push(parsedItem);

      // Cari di data lokal saat ini
      const existing = currentBarang.find((b) => b.kode.trim().toUpperCase() === finalKode.trim().toUpperCase());
      if (existing) {
        const changes: string[] = [];
        if (existing.nama !== finalNama) changes.push(`Nama: "${existing.nama}" ➔ "${finalNama}"`);
        if (existing.kategori !== kategori) changes.push(`Kategori: "${existing.kategori}" ➔ "${kategori}"`);
        if (existing.stok !== stok) changes.push(`Stok: ${existing.stok} ➔ ${stok}`);
        if (existing.minStok !== minStok) changes.push(`Min Stok: ${existing.minStok} ➔ ${minStok}`);
        if (existing.satuan !== satuan) changes.push(`Satuan: "${existing.satuan}" ➔ "${satuan}"`);
        if (existing.lokasi !== lokasi) changes.push(`Lokasi: "${existing.lokasi}" ➔ "${lokasi}"`);

        const updatedVersion: Barang = {
          ...parsedItem,
          id: existing.id,
        };

        if (changes.length > 0) {
          barangToUpdate.push({
            current: existing,
            updated: updatedVersion,
            changes,
          });
        } else {
          barangIdentical.push(existing);
        }
      } else {
        barangToAdd.push(parsedItem);
      }
    });
  }

  // 3. Parse & Analisis Sheet Karyawan
  const allKaryawanFromExcel: Karyawan[] = [];
  const karyawanToAdd: Karyawan[] = [];
  const karyawanToUpdate: { current: Karyawan; updated: Karyawan; changes: string[] }[] = [];
  const karyawanIdentical: Karyawan[] = [];

  if (karyawanSheetName && wb.Sheets[karyawanSheetName]) {
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(wb.Sheets[karyawanSheetName], { defval: '' });

    rawRows.forEach((row, index) => {
      const badge = getFlexValue(row, ['id badge', 'badge', 'nik', 'id karyawan', 'kode karyawan', 'nomor id']);
      const nama = getFlexValue(row, ['nama karyawan', 'nama', 'employee name', 'nama staf']);

      if (!badge && !nama) return;
      const finalBadge = badge || `KRY-${100 + index}`;
      const finalNama = nama || 'Karyawan Baru';
      const dept = getFlexValue(row, ['departemen', 'department', 'divisi', 'dept', 'bagian']) || 'Operasional';
      const jabatan = getFlexValue(row, ['jabatan', 'position', 'role', 'posisi']) || 'Staff';
      const email = getFlexValue(row, ['email / kontak', 'email', 'kontak', 'no hp', 'telepon']) || '-';
      const rawStatus = getFlexValue(row, ['status']).toLowerCase();
      const status: 'Aktif' | 'Nonaktif' = rawStatus.includes('non') ? 'Nonaktif' : 'Aktif';

      const parsedKaryawan: Karyawan = {
        id: 'kry_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        badge: finalBadge,
        nama: finalNama,
        dept,
        jabatan,
        email,
        status,
      };

      allKaryawanFromExcel.push(parsedKaryawan);

      const existing = currentKaryawan.find((k) => k.badge.trim().toUpperCase() === finalBadge.trim().toUpperCase());
      if (existing) {
        const changes: string[] = [];
        if (existing.nama !== finalNama) changes.push(`Nama: "${existing.nama}" ➔ "${finalNama}"`);
        if (existing.dept !== dept) changes.push(`Dept: "${existing.dept}" ➔ "${dept}"`);
        if (existing.jabatan !== jabatan) changes.push(`Jabatan: "${existing.jabatan}" ➔ "${jabatan}"`);
        if (existing.email !== email) changes.push(`Kontak: "${existing.email}" ➔ "${email}"`);
        if (existing.status !== status) changes.push(`Status: "${existing.status}" ➔ "${status}"`);

        const updatedVersion: Karyawan = {
          ...parsedKaryawan,
          id: existing.id,
        };

        if (changes.length > 0) {
          karyawanToUpdate.push({
            current: existing,
            updated: updatedVersion,
            changes,
          });
        } else {
          karyawanIdentical.push(existing);
        }
      } else {
        karyawanToAdd.push(parsedKaryawan);
      }
    });
  }

  return {
    fileName: file.name,
    sheetNames,
    detectedSheets: {
      barangSheet: barangSheetName,
      karyawanSheet: karyawanSheetName,
      mutasiSheet: mutasiSheetName,
    },
    barangPreview: {
      toAdd: barangToAdd,
      toUpdate: barangToUpdate,
      identical: barangIdentical,
      totalInExcel: allBarangFromExcel.length,
    },
    karyawanPreview: {
      toAdd: karyawanToAdd,
      toUpdate: karyawanToUpdate,
      identical: karyawanIdentical,
      totalInExcel: allKaryawanFromExcel.length,
    },
    allBarangFromExcel,
    allKaryawanFromExcel,
  };
}
