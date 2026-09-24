import { Barang, Karyawan, TransaksiMutasi, AkunPengguna } from './types';

export const DEFAULT_BARANG: Barang[] = [
  { id: "b1", kode: "BRG-001", nama: "Barcode Scanner Handheld 2D", kategori: "Consumable", stok: 18, minStok: 5, satuan: "Unit", lokasi: "Gudang A - Rak 01" },
  { id: "b2", kode: "BRG-002", nama: "Pallet Handjack Hydraulic 3 Ton", kategori: "Consumable", stok: 3, minStok: 2, satuan: "Unit", lokasi: "Area Bongkar B" },
  { id: "b3", kode: "BRG-003", nama: "Lakban Fragile 2 Inch Merah", kategori: "Consumable", stok: 120, minStok: 25, satuan: "Roll", lokasi: "Gudang B - Rak 04" },
  { id: "b4", kode: "BRG-004", nama: "Kertas Thermal Struk 80x80", kategori: "ATK", stok: 4, minStok: 10, satuan: "Roll", lokasi: "Gudang A - Rak 02" },
  { id: "b5", kode: "BRG-005", nama: "Sepatu Safety Steel Toe Size 42", kategori: "Consumable", stok: 2, minStok: 6, satuan: "Pasang", lokasi: "Loker APD - Rak 01" },
  { id: "b6", kode: "BRG-006", nama: "Stretch Film Roll 50cm x 300m", kategori: "Consumable", stok: 15, minStok: 10, satuan: "Roll", lokasi: "Gudang B - Rak 02" },
  { id: "b7", kode: "BRG-007", nama: "Helm Safety Proyek Kuning", kategori: "Consumable", stok: 8, minStok: 10, satuan: "Pcs", lokasi: "Loker APD - Rak 02" },
  { id: "b8", kode: "BRG-008", nama: "Printer Label Barcode USB/LAN", kategori: "ATK", stok: 6, minStok: 2, satuan: "Unit", lokasi: "Gudang A - Meja QC" },
  { id: "b9", kode: "BRG-009", nama: "Sarung Tangan Karet Nitrile Heavy Duty", kategori: "Consumable", stok: 45, minStok: 15, satuan: "Pasang", lokasi: "Loker APD - Rak 03" },
  { id: "b10", kode: "BRG-010", nama: "Kabel Ties Nylon 250mm x 4.8mm", kategori: "Consumable", stok: 350, minStok: 100, satuan: "Pcs", lokasi: "Gudang B - Rak 01" }
];

export const DEFAULT_KARYAWAN: Karyawan[] = [
  { id: "k1", badge: "KRY-001", nama: "Budi Santoso", dept: "Logistik & Gudang", jabatan: "Supervisor Logistik", email: "budi.santoso@jpkselatan.com", status: "Aktif" },
  { id: "k2", badge: "KRY-002", nama: "Siti Rahmawati", dept: "Logistik & Gudang", jabatan: "Admin Inventory", email: "siti.rahma@jpkselatan.com", status: "Aktif" },
  { id: "k3", badge: "KRY-003", nama: "Ahmad Fauzi", dept: "Operasional", jabatan: "Koordinator Lapangan", email: "ahmad.fauzi@jpkselatan.com", status: "Aktif" },
  { id: "k4", badge: "KRY-004", nama: "Dewi Lestari", dept: "Teknologi Informasi (IT)", jabatan: "Staff IT Support", email: "dewi.lestari@jpkselatan.com", status: "Aktif" },
  { id: "k5", badge: "KRY-005", nama: "Hendra Wijaya", dept: "Keuangan & Akuntansi", jabatan: "Staff Pembukuan", email: "hendra.w@jpkselatan.com", status: "Aktif" },
  { id: "k6", badge: "KRY-006", nama: "Maya Puspita", dept: "Human Resources (HR)", jabatan: "HR Specialist", email: "maya.hr@jpkselatan.com", status: "Aktif" },
  { id: "k7", badge: "KRY-007", nama: "Rian Permana", dept: "Logistik & Gudang", jabatan: "Petugas Gudang & Picker", email: "rian.p@jpkselatan.com", status: "Aktif" }
];

export const DEFAULT_TRANSAKSI: TransaksiMutasi[] = [
  { id: "t1", tanggal: "2026-09-20 09:15", tipe: "IN", barangId: "b1", kode: "BRG-001", nama: "Barcode Scanner Handheld 2D", qty: 5, stokAwal: 13, stokAkhir: 18, pic: "Budi Santoso", keterangan: "Penerimaan rutin dari Vendor" },
  { id: "t2", tanggal: "2026-09-21 11:30", tipe: "OUT", barangId: "b4", kode: "BRG-004", nama: "Kertas Thermal Struk 80x80", qty: 6, stokAwal: 10, stokAkhir: 4, pic: "Siti Rahmawati", keterangan: "Permintaan Divisi Kasir & Admin" },
  { id: "t3", tanggal: "2026-09-22 14:00", tipe: "OUT", barangId: "b5", kode: "BRG-005", nama: "Sepatu Safety Steel Toe Size 42", qty: 4, stokAwal: 6, stokAkhir: 2, pic: "Ahmad Fauzi", keterangan: "Alokasi pekerja baru operasional" },
  { id: "t4", tanggal: "2026-09-23 10:45", tipe: "IN", barangId: "b3", kode: "BRG-003", nama: "Lakban Fragile 2 Inch Merah", qty: 50, stokAwal: 70, stokAkhir: 120, pic: "Budi Santoso", keterangan: "Restok rutin perlengkapan packing" },
  { id: "t5", tanggal: "2026-09-23 15:20", tipe: "OUT", barangId: "b7", kode: "BRG-007", nama: "Helm Safety Proyek Kuning", qty: 2, stokAwal: 10, stokAkhir: 8, pic: "Ahmad Fauzi", keterangan: "Penggantian APD pekerja lapangan" }
];

export const DEFAULT_AKUN: AkunPengguna[] = [
  { id: "u1", username: "admin", nama: "Administrator", role: "Super Admin", status: "Aktif", lastLogin: "2026-09-24 07:05" },
  { id: "u2", username: "staff", nama: "Staff Logistik 1", role: "Staff Logistik", status: "Aktif", lastLogin: "2026-09-23 16:10" },
  { id: "u3", username: "supervisor", nama: "Pak Rudi", role: "Supervisor Gudang", status: "Aktif", lastLogin: "2026-09-22 11:45" },
  { id: "u4", username: "hr_admin", nama: "Admin Personalia", role: "HR Admin", status: "Aktif", lastLogin: "2026-09-20 08:30" }
];

export const KATEGORI_BARANG_OPTIONS = [
  "ATK",
  "Consumable"
];

export const DEPARTEMEN_OPTIONS = [
  "Logistik & Gudang",
  "Operasional",
  "Teknologi Informasi (IT)",
  "Keuangan & Akuntansi",
  "Human Resources (HR)"
];

export const ROLE_OPTIONS: AkunPengguna['role'][] = [
  "Super Admin",
  "Staff Logistik",
  "Supervisor Gudang",
  "HR Admin"
];
