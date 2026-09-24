import { getAccessToken } from './googleAuth';
import { Barang, TransaksiMutasi, Karyawan } from './types';

export interface GoogleDriveFile {
  id: string;
  name: string;
  webViewLink?: string;
  modifiedTime?: string;
}

export interface GoogleSheetExportResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

// 1. Create a brand new Spreadsheet in Google Drive with 3 formatted sheets
export const exportInventoryToGoogleSheets = async (params: {
  title: string;
  barangList: Barang[];
  transaksiList: TransaksiMutasi[];
  karyawanList: Karyawan[];
}): Promise<GoogleSheetExportResult> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Sesi Google OAuth belum aktif. Silakan hubungkan akun Google terlebih dahulu.');
  }

  const { title, barangList, transaksiList, karyawanList } = params;

  // Step 1: Create spreadsheet structure with 3 sheets
  const createResp = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title || `Portal Logistik - Inventaris (${new Date().toLocaleDateString('id-ID')})`,
      },
      sheets: [
        { properties: { title: 'Data Barang' } },
        { properties: { title: 'Riwayat Mutasi' } },
        { properties: { title: 'Data Karyawan' } },
      ],
    }),
  });

  if (!createResp.ok) {
    const errJson = await createResp.json().catch(() => ({}));
    throw new Error(
      errJson.error?.message || `Gagal membuat Google Spreadsheet (HTTP ${createResp.status})`
    );
  }

  const spreadsheet = await createResp.json();
  const spreadsheetId = spreadsheet.spreadsheetId;
  const spreadsheetUrl =
    spreadsheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Step 2: Prepare rows for Data Barang
  const barangHeaders = [
    'Kode Barang',
    'Nama Barang',
    'Kategori',
    'Stok',
    'Satuan',
    'Batas Min',
    'Status',
    'Lokasi Rak',
  ];
  const barangValues = [
    barangHeaders,
    ...barangList.map((b) => [
      b.kode,
      b.nama,
      b.kategori,
      Number(b.stok),
      b.satuan,
      Number(b.minStok),
      Number(b.stok) > Number(b.minStok) ? 'Ready' : 'Re-Order',
      b.lokasi,
    ]),
  ];

  // Step 3: Prepare rows for Riwayat Mutasi
  const mutasiHeaders = [
    'Waktu',
    'Tipe',
    'Kode Barang',
    'Nama Barang',
    'Jumlah',
    'PIC',
    'Sisa Stok',
    'Keterangan',
  ];
  const mutasiValues = [
    mutasiHeaders,
    ...transaksiList.map((t) => [
      t.tanggal,
      t.tipe,
      t.kode,
      t.nama,
      t.tipe === 'IN' ? `+${t.qty}` : `-${t.qty}`,
      t.pic,
      t.stokAkhir,
      t.keterangan || '-',
    ]),
  ];

  // Step 4: Prepare rows for Data Karyawan
  const karyawanHeaders = ['No. Badge', 'Nama Karyawan', 'Departemen', 'Jabatan', 'Email', 'Status'];
  const karyawanValues = [
    karyawanHeaders,
    ...karyawanList.map((k) => [k.badge, k.nama, k.dept, k.jabatan, k.email, k.status]),
  ];

  // Step 5: Batch update values into all 3 sheets
  const updateResp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: "'Data Barang'!A1",
            values: barangValues,
          },
          {
            range: "'Riwayat Mutasi'!A1",
            values: mutasiValues,
          },
          {
            range: "'Data Karyawan'!A1",
            values: karyawanValues,
          },
        ],
      }),
    }
  );

  if (!updateResp.ok) {
    const errJson = await updateResp.json().catch(() => ({}));
    throw new Error(
      errJson.error?.message || `Gagal mengisi data Google Spreadsheet (HTTP ${updateResp.status})`
    );
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    title: spreadsheet.properties?.title || title,
  };
};

// 2. List recent spreadsheets from Google Drive
export const listRecentGoogleSpreadsheets = async (): Promise<GoogleDriveFile[]> => {
  const token = await getAccessToken();
  if (!token) return [];

  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const fields = encodeURIComponent('files(id,name,webViewLink,modifiedTime)');
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=modifiedTime%20desc&pageSize=10`;

  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resp.ok) {
    console.warn('Gagal memuat daftar spreadsheet dari Drive:', resp.status);
    return [];
  }

  const data = await resp.json();
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    webViewLink: f.webViewLink || `https://docs.google.com/spreadsheets/d/${f.id}/edit`,
    modifiedTime: f.modifiedTime,
  }));
};

// 3. Read spreadsheet data for preview and import
export const readGoogleSheetBarang = async (
  spreadsheetId: string
): Promise<{ sheetTitle: string; items: Omit<Barang, 'id'>[] }> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Sesi Google OAuth belum aktif.');
  }

  // 1. Get spreadsheet metadata to know sheet names
  const metaResp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?includeGridData=false`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!metaResp.ok) {
    const err = await metaResp.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Gagal mengakses spreadsheet tersebut. Pastikan ID valid.');
  }

  const metadata = await metaResp.json();
  const sheets = metadata.sheets || [];
  if (sheets.length === 0) {
    throw new Error('Spreadsheet tidak memiliki lembar sheet data.');
  }

  // Find sheet: prioritize "Data Barang", then "Barang", or the first sheet
  const targetSheet =
    sheets.find((s: any) => s.properties?.title?.toLowerCase().includes('barang')) || sheets[0];
  const sheetTitle = targetSheet.properties?.title || 'Sheet1';

  // 2. Fetch rows
  const valuesResp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      sheetTitle
    )}!A1:Z500`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!valuesResp.ok) {
    throw new Error('Gagal membaca isi sel spreadsheet.');
  }

  const valuesData = await valuesResp.json();
  const rows: any[][] = valuesData.values || [];
  if (rows.length < 2) {
    throw new Error('Sheet tidak memiliki cukup baris data (minimal baris header & 1 baris data).');
  }

  const headerRow = rows[0].map((h) => String(h || '').trim().toLowerCase());

  // Detect column indexes
  const colKode = headerRow.findIndex((h) => h.includes('kode'));
  const colNama = headerRow.findIndex((h) => h.includes('nama') || h.includes('barang') || h.includes('item'));
  const colKategori = headerRow.findIndex((h) => h.includes('kategori') || h.includes('category'));
  const colStok = headerRow.findIndex((h) => h.includes('stok') || h.includes('stock') || h.includes('qty'));
  const colSatuan = headerRow.findIndex((h) => h.includes('satuan') || h.includes('unit'));
  const colMin = headerRow.findIndex((h) => h.includes('min') || h.includes('reorder') || h.includes('batas'));
  const colLokasi = headerRow.findIndex((h) => h.includes('lokasi') || h.includes('rak') || h.includes('gudang'));

  const parsedItems: Omit<Barang, 'id'>[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const kode = colKode >= 0 && row[colKode] ? String(row[colKode]).trim() : `BRG-IMP-${i}`;
    const nama = colNama >= 0 && row[colNama] ? String(row[colNama]).trim() : '';
    if (!nama) continue; // Skip empty row

    const katRaw = colKategori >= 0 && row[colKategori] ? String(row[colKategori]).trim().toUpperCase() : 'ATK';
    const kategori: 'ATK' | 'Consumable' = katRaw.includes('CONSUMABLE') ? 'Consumable' : 'ATK';

    const stokRaw = colStok >= 0 ? parseInt(String(row[colStok]).replace(/[^0-9]/g, ''), 10) : 0;
    const stok = isNaN(stokRaw) ? 0 : stokRaw;

    const satuan = colSatuan >= 0 && row[colSatuan] ? String(row[colSatuan]).trim() : 'Pcs';

    const minRaw = colMin >= 0 ? parseInt(String(row[colMin]).replace(/[^0-9]/g, ''), 10) : 5;
    const minStok = isNaN(minRaw) ? 5 : minRaw;

    const lokasi = colLokasi >= 0 && row[colLokasi] ? String(row[colLokasi]).trim() : 'Gudang Utama';

    parsedItems.push({
      kode,
      nama,
      kategori,
      stok,
      satuan,
      minStok,
      lokasi,
    });
  }

  return {
    sheetTitle,
    items: parsedItems,
  };
};

// 4. Update existing spreadsheet with fresh inventory
export const updateExistingGoogleSheet = async (
  spreadsheetId: string,
  barangList: Barang[],
  transaksiList: TransaksiMutasi[]
): Promise<void> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Sesi Google OAuth belum aktif.');
  }

  const barangHeaders = [
    'Kode Barang',
    'Nama Barang',
    'Kategori',
    'Stok',
    'Satuan',
    'Batas Min',
    'Status',
    'Lokasi Rak',
  ];
  const barangValues = [
    barangHeaders,
    ...barangList.map((b) => [
      b.kode,
      b.nama,
      b.kategori,
      Number(b.stok),
      b.satuan,
      Number(b.minStok),
      Number(b.stok) > Number(b.minStok) ? 'Ready' : 'Re-Order',
      b.lokasi,
    ]),
  ];

  const mutasiHeaders = [
    'Waktu',
    'Tipe',
    'Kode Barang',
    'Nama Barang',
    'Jumlah',
    'PIC',
    'Sisa Stok',
    'Keterangan',
  ];
  const mutasiValues = [
    mutasiHeaders,
    ...transaksiList.map((t) => [
      t.tanggal,
      t.tipe,
      t.kode,
      t.nama,
      t.tipe === 'IN' ? `+${t.qty}` : `-${t.qty}`,
      t.pic,
      t.stokAkhir,
      t.keterangan || '-',
    ]),
  ];

  const updateResp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: "'Data Barang'!A1",
            values: barangValues,
          },
          {
            range: "'Riwayat Mutasi'!A1",
            values: mutasiValues,
          },
        ],
      }),
    }
  );

  if (!updateResp.ok) {
    const errJson = await updateResp.json().catch(() => ({}));
    throw new Error(
      errJson.error?.message || `Gagal memperbarui Google Spreadsheet (HTTP ${updateResp.status})`
    );
  }
};
