export interface Barang {
  id: string;
  kode: string;
  nama: string;
  kategori: string;
  stok: number;
  minStok: number;
  satuan: string;
  lokasi: string;
}

export interface Karyawan {
  id: string;
  badge: string;
  nama: string;
  dept: string;
  jabatan: string;
  email: string;
  status: 'Aktif' | 'Nonaktif';
}

export interface TransaksiMutasi {
  id: string;
  tanggal: string;
  tipe: 'IN' | 'OUT';
  barangId: string;
  kode: string;
  nama: string;
  qty: number;
  stokAwal: number;
  stokAkhir: number;
  pic: string;
  keterangan: string;
}

export interface AkunPengguna {
  id: string;
  username: string;
  nama: string;
  role: 'Super Admin' | 'Staff Logistik' | 'Supervisor Gudang' | 'HR Admin';
  status: 'Aktif' | 'Nonaktif';
  lastLogin: string;
}

export interface MutasiFormRow {
  uid: string;
  barangId: string;
  qty: number;
}

export interface BackupData {
  version: string;
  exportedAt: string;
  app: string;
  barang: Barang[];
  karyawan: Karyawan[];
  transaksi: TransaksiMutasi[];
  akun: AkunPengguna[];
}

export interface MasterExcelSyncResult {
  fileName: string;
  timestamp: string;
  mode: 'upsert' | 'replace';
  barangAdded: number;
  barangUpdated: number;
  barangIdentical: number;
  karyawanAdded: number;
  karyawanUpdated: number;
  karyawanIdentical: number;
}

export interface MasterExcelAnalysis {
  fileName: string;
  sheetNames: string[];
  detectedSheets: {
    barangSheet?: string;
    karyawanSheet?: string;
    mutasiSheet?: string;
  };
  barangPreview: {
    toAdd: Barang[];
    toUpdate: { current: Barang; updated: Barang; changes: string[] }[];
    identical: Barang[];
    totalInExcel: number;
  };
  karyawanPreview: {
    toAdd: Karyawan[];
    toUpdate: { current: Karyawan; updated: Karyawan; changes: string[] }[];
    identical: Karyawan[];
    totalInExcel: number;
  };
  allBarangFromExcel: Barang[];
  allKaryawanFromExcel: Karyawan[];
}
