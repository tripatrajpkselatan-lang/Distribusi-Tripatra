import React, { useState, useEffect, useCallback } from 'react';
import { TabType, Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { MobileBottomNav } from './components/MobileBottomNav';
import { LoginOverlay } from './components/LoginOverlay';
import { DashboardTab } from './components/DashboardTab';
import { BarangTab } from './components/BarangTab';
import { MutasiTab } from './components/MutasiTab';
import { KaryawanTab } from './components/KaryawanTab';
import { AkunTab } from './components/AkunTab';
import { BackupModal } from './components/BackupModal';
import { PersediaanKritisModal } from './components/PersediaanKritisModal';
import { MultiSelectBarangModal } from './components/MultiSelectBarangModal';
import { ImportModal } from './components/ImportModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { ConfirmDialog, ConfirmDialogProps } from './components/ConfirmDialog';
import { ToastNotification, ToastMessage } from './components/ToastNotification';
import {
  Barang,
  Karyawan,
  TransaksiMutasi,
  AkunPengguna,
  MutasiFormRow,
  BackupData,
  MasterExcelSyncResult,
} from './types';
import {
  loadBarang,
  saveBarang,
  loadKaryawan,
  saveKaryawan,
  loadTransaksi,
  saveTransaksi,
  loadAkun,
  saveAkun,
  loadSessionUser,
  saveSessionUser,
  resetAllDataToDefault,
  saveLastExcelSync,
} from './storage';

export default function App() {
  // --- Global Application State ---
  const [barang, setBarang] = useState<Barang[]>(() => loadBarang());
  const [karyawan, setKaryawan] = useState<Karyawan[]>(() => loadKaryawan());
  const [transaksi, setTransaksi] = useState<TransaksiMutasi[]>(() => loadTransaksi());
  const [akun, setAkun] = useState<AkunPengguna[]>(() => loadAkun());
  const [currentUser, setCurrentUser] = useState<AkunPengguna | null>(() => loadSessionUser());

  // Navigation
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modals
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isKritisModalOpen, setIsKritisModalOpen] = useState(false);
  const [isMultiSelectModalOpen, setIsMultiSelectModalOpen] = useState(false);
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState(false);
  const [importModalState, setImportModalState] = useState<{
    isOpen: boolean;
    type: 'barang' | 'karyawan';
  }>({ isOpen: false, type: 'barang' });

  // Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState<
    Omit<ConfirmDialogProps, 'onCancel'> & { isOpen: boolean }
  >({
    isOpen: false,
    title: '',
    message: null,
    onConfirm: () => {},
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Mutasi Form Multi-Item state
  const [mutasiFormRows, setMutasiFormRows] = useState<MutasiFormRow[]>([
    { uid: 'r_init', barangId: '', qty: 1 },
  ]);

  // --- Auto-Save on State Updates ---
  useEffect(() => {
    saveBarang(barang);
  }, [barang]);

  useEffect(() => {
    saveKaryawan(karyawan);
  }, [karyawan]);

  useEffect(() => {
    saveTransaksi(transaksi);
  }, [transaksi]);

  useEffect(() => {
    saveAkun(akun);
  }, [akun]);

  useEffect(() => {
    saveSessionUser(currentUser);
  }, [currentUser]);

  // --- Toast Trigger Helper ---
  const showToast = useCallback(
    (text: string, type: 'success' | 'danger' | 'warning' | 'info' = 'success') => {
      const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      setToasts((prev) => [...prev, { id, text, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // --- Auth Handlers ---
  const handleLoginSuccess = (user: AkunPengguna) => {
    setCurrentUser(user);
    showToast(`Selamat datang kembali, ${user.nama}!`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showToast('Anda telah berhasil keluar (logout).', 'info');
  };

  // --- Barang CRUD ---
  const handleAddBarang = (item: Barang) => {
    setBarang((prev) => [item, ...prev]);
  };

  const handleUpdateBarang = (item: Barang) => {
    setBarang((prev) => prev.map((b) => (b.id === item.id ? item : b)));
  };

  const handleDeleteBarang = (id: string) => {
    const item = barang.find((b) => b.id === id);
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Barang Inventaris',
      subtitle: 'Konfirmasi penghapusan data barang',
      message: (
        <span>
          Apakah Anda yakin ingin menghapus data{' '}
          <strong>{item ? item.nama : 'barang ini'}</strong> ({item ? item.kode : ''})? Riwayat mutasi
          sebelumnya tetap dipertahankan.
        </span>
      ),
      confirmLabel: 'Ya, Hapus Barang',
      confirmVariant: 'danger',
      onConfirm: () => {
        setBarang((prev) => prev.filter((b) => b.id !== id));
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        showToast('Data barang berhasil dihapus dari inventaris.', 'success');
      },
    });
  };

  // --- Karyawan CRUD ---
  const handleAddKaryawan = (k: Karyawan) => {
    setKaryawan((prev) => [...prev, k]);
  };

  const handleDeleteKaryawan = (id: string) => {
    const k = karyawan.find((item) => item.id === id);
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Data Karyawan',
      subtitle: 'Konfirmasi penghapusan personalia',
      message: (
        <span>
          Apakah Anda yakin ingin menghapus data karyawan{' '}
          <strong>{k ? k.nama : 'ini'}</strong> ({k ? k.badge : ''}) dari daftar?
        </span>
      ),
      confirmLabel: 'Ya, Hapus Karyawan',
      confirmVariant: 'danger',
      onConfirm: () => {
        setKaryawan((prev) => prev.filter((item) => item.id !== id));
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        showToast('Data karyawan berhasil dihapus.', 'success');
      },
    });
  };

  // --- Akun CRUD ---
  const handleAddAkun = (newAkun: AkunPengguna) => {
    setAkun((prev) => [...prev, newAkun]);
  };

  const handleDeleteSingleAkun = (id: string) => {
    const target = akun.find((a) => a.id === id);
    if (!target) return;
    const isCurrent = currentUser?.username.toLowerCase() === target.username.toLowerCase();

    setConfirmDialog({
      isOpen: true,
      title: isCurrent ? 'Hapus Akun Anda Sendiri?' : 'Hapus Akun Pengguna',
      subtitle: isCurrent ? 'Sesi login akan langsung berakhir' : 'Akses pengguna akan dicabut',
      message: (
        <div>
          {isCurrent && (
            <div className="p-2.5 mb-2 bg-red-50 border border-red-200 rounded-lg text-red-700 font-semibold text-xs">
              Peringatan: Akun ini adalah akun yang Anda gunakan untuk masuk saat ini. Jika dihapus, Anda akan otomatis logout.
            </div>
          )}
          <span>
            Apakah Anda yakin ingin menghapus akun pengguna{' '}
            <strong>{target.nama}</strong> (@{target.username})?
          </span>
        </div>
      ),
      confirmLabel: 'Ya, Hapus Akun',
      confirmVariant: 'danger',
      onConfirm: () => {
        setAkun((prev) => prev.filter((a) => a.id !== id));
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));

        if (isCurrent) {
          showToast(`Akun @${target.username} dihapus. Anda telah otomatis logout.`, 'warning');
          setTimeout(() => handleLogout(), 800);
        } else {
          showToast(`Akun pengguna @${target.username} berhasil dihapus.`, 'success');
        }
      },
    });
  };

  const handleDeleteBatchAkun = (ids: string[]) => {
    const targets = akun.filter((a) => ids.includes(a.id));
    const includesCurrent = currentUser && targets.some((a) => a.username.toLowerCase() === currentUser.username.toLowerCase());

    setConfirmDialog({
      isOpen: true,
      title: `Hapus ${ids.length} Akun Terpilih`,
      subtitle: 'Konfirmasi hapus massal akun pengguna',
      message: (
        <div>
          {includesCurrent && (
            <div className="p-2.5 mb-2 bg-red-50 border border-red-200 rounded-lg text-red-700 font-semibold text-xs">
              Peringatan: Akun Anda sendiri termasuk dalam daftar yang dipilih. Anda akan otomatis logout setelah ini.
            </div>
          )}
          <p className="mb-2">
            Apakah Anda yakin ingin menghapus <strong>{ids.length} akun pengguna</strong> terpilih?
          </p>
          <ul className="text-xs text-slate-500 list-disc pl-4 max-h-24 overflow-y-auto space-y-0.5">
            {targets.map((a) => (
              <li key={a.id}>
                <strong>{a.nama}</strong> (@{a.username})
              </li>
            ))}
          </ul>
        </div>
      ),
      confirmLabel: `Ya, Hapus ${ids.length} Akun`,
      confirmVariant: 'danger',
      onConfirm: () => {
        setAkun((prev) => prev.filter((a) => !ids.includes(a.id)));
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));

        if (includesCurrent) {
          showToast(`${ids.length} akun dihapus. Anda telah otomatis logout.`, 'warning');
          setTimeout(() => handleLogout(), 800);
        } else {
          showToast(`${ids.length} akun pengguna berhasil dihapus.`, 'success');
        }
      },
    });
  };

  // --- Mutasi Execution ---
  const handleExecuteMutasi = (
    tipe: 'IN' | 'OUT',
    picName: string,
    keteranganStr: string,
    items: { barangId: string; qty: number }[]
  ) => {
    const now = new Date();
    const tglFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const fullKet = keteranganStr.trim() || '-';

    const newTransactions: TransaksiMutasi[] = [];
    const stockUpdates: Record<string, number> = {};

    items.forEach((item, idx) => {
      const b = barang.find((bar) => bar.id === item.barangId);
      if (!b) return;

      const stokAwal = b.stok;
      const stokAkhir = tipe === 'IN' ? stokAwal + item.qty : stokAwal - item.qty;

      stockUpdates[b.id] = stokAkhir;

      newTransactions.push({
        id: 't_' + Date.now() + '_' + idx,
        tanggal: tglFormatted,
        tipe,
        barangId: b.id,
        kode: b.kode,
        nama: b.nama,
        qty: item.qty,
        stokAwal,
        stokAkhir,
        pic: picName,
        keterangan: fullKet,
      });
    });

    // Update in state
    setBarang((prev) =>
      prev.map((b) => (stockUpdates[b.id] !== undefined ? { ...b, stok: stockUpdates[b.id] } : b))
    );
    setTransaksi((prev) => [...newTransactions, ...prev]);

    showToast(
      `Mutasi ${tipe === 'IN' ? 'Barang Masuk' : 'Barang Keluar'} berhasil diproses untuk ${items.length} item!`,
      'success'
    );
  };

  // --- Delete Mutasi Transaksi Handlers ---
  const handleDeleteSingleTransaksi = (id: string, rollbackStock: boolean) => {
    const tx = transaksi.find((t) => t.id === id);
    if (!tx) return;

    if (rollbackStock) {
      setBarang((prev) =>
        prev.map((b) => {
          if (b.id === tx.barangId) {
            const diff = tx.tipe === 'IN' ? -tx.qty : tx.qty;
            const newStok = Math.max(0, b.stok + diff);
            return { ...b, stok: newStok };
          }
          return b;
        })
      );
    }

    setTransaksi((prev) => prev.filter((t) => t.id !== id));
    showToast(
      rollbackStock
        ? `Transaksi ${tx.tipe} (${tx.nama}) dihapus dan stok telah di-rollback.`
        : `Riwayat transaksi ${tx.tipe} (${tx.nama}) berhasil dihapus.`,
      'success'
    );
  };

  const handleDeleteBatchTransaksi = (ids: string[], rollbackStock: boolean) => {
    const txsToDelete = transaksi.filter((t) => ids.includes(t.id));
    if (txsToDelete.length === 0) return;

    if (rollbackStock) {
      const stockDiffMap: Record<string, number> = {};
      txsToDelete.forEach((tx) => {
        const diff = tx.tipe === 'IN' ? -tx.qty : tx.qty;
        stockDiffMap[tx.barangId] = (stockDiffMap[tx.barangId] || 0) + diff;
      });

      setBarang((prev) =>
        prev.map((b) => {
          if (stockDiffMap[b.id] !== undefined) {
            const newStok = Math.max(0, b.stok + stockDiffMap[b.id]);
            return { ...b, stok: newStok };
          }
          return b;
        })
      );
    }

    setTransaksi((prev) => prev.filter((t) => !ids.includes(t.id)));
    showToast(
      rollbackStock
        ? `${txsToDelete.length} transaksi mutasi dihapus dan stok telah di-rollback.`
        : `${txsToDelete.length} riwayat transaksi mutasi berhasil dihapus.`,
      'success'
    );
  };

  const handleClearAllTransaksi = (rollbackStock: boolean) => {
    const count = transaksi.length;
    if (count === 0) return;

    if (rollbackStock) {
      const stockDiffMap: Record<string, number> = {};
      transaksi.forEach((tx) => {
        const diff = tx.tipe === 'IN' ? -tx.qty : tx.qty;
        stockDiffMap[tx.barangId] = (stockDiffMap[tx.barangId] || 0) + diff;
      });

      setBarang((prev) =>
        prev.map((b) => {
          if (stockDiffMap[b.id] !== undefined) {
            const newStok = Math.max(0, b.stok + stockDiffMap[b.id]);
            return { ...b, stok: newStok };
          }
          return b;
        })
      );
    }

    setTransaksi([]);
    showToast(
      rollbackStock
        ? `Seluruh riwayat mutasi (${count} data) berhasil dihapus dan stok telah di-rollback.`
        : `Seluruh riwayat mutasi (${count} data) berhasil dibersihkan.`,
      'success'
    );
  };

  // Quick jump from Critical modal to Mutasi IN
  const handleQuickMutasiIn = (barangId: string) => {
    setCurrentTab('mutasi');
    setMutasiFormRows([{ uid: 'r_quick_' + Date.now(), barangId, qty: 1 }]);
    showToast('Barang dipilih langsung pada form mutasi masuk.', 'info');
  };

  // Multi-select batch add to Mutasi
  const handleApplyMultiSelectBarang = (selectedIds: string[]) => {
    setMutasiFormRows((prev) => {
      const validExisting = prev.filter((r) => r.barangId && r.barangId.trim() !== '');
      const newRows: MutasiFormRow[] = [...validExisting];

      selectedIds.forEach((bId) => {
        if (!newRows.some((r) => r.barangId === bId)) {
          newRows.push({
            uid: 'r_multi_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            barangId: bId,
            qty: 1,
          });
        }
      });

      return newRows.length > 0 ? newRows : [{ uid: 'r_' + Date.now(), barangId: '', qty: 1 }];
    });
    showToast(`${selectedIds.length} barang berhasil ditambahkan ke form mutasi.`, 'info');
  };

  // --- Excel / CSV Imports ---
  const handleImportBarang = (importedItems: Barang[], mode: 'update' | 'skip') => {
    setBarang((prev) => {
      const existingMap = new Map(prev.map((b) => [b.kode.toUpperCase(), b]));
      const next = [...prev];

      importedItems.forEach((item) => {
        const key = item.kode.toUpperCase();
        if (existingMap.has(key)) {
          if (mode === 'update') {
            const idx = next.findIndex((b) => b.kode.toUpperCase() === key);
            if (idx !== -1) {
              next[idx] = { ...next[idx], ...item, id: next[idx].id };
            }
          }
        } else {
          next.push(item);
        }
      });

      return next;
    });
  };

  const handleImportFromGoogleSheets = (
    items: Omit<Barang, 'id'>[],
    mode: 'upsert' | 'replace'
  ) => {
    if (mode === 'replace') {
      const newItems: Barang[] = items.map((it, idx) => ({
        ...it,
        id: `brg-gs-${Date.now()}-${idx}`,
      }));
      setBarang(newItems);
      saveBarang(newItems);
      showToast(
        `Database berhasil diganti dengan ${newItems.length} barang dari Google Sheets.`,
        'success'
      );
    } else {
      setBarang((prev) => {
        const map = new Map(prev.map((b) => [b.kode.trim().toUpperCase(), b]));
        let updated = 0;
        let added = 0;
        items.forEach((it, idx) => {
          const key = it.kode.trim().toUpperCase();
          if (map.has(key)) {
            const existing = map.get(key)!;
            map.set(key, { ...existing, ...it });
            updated++;
          } else {
            map.set(key, { ...it, id: `brg-gs-${Date.now()}-${idx}` });
            added++;
          }
        });
        const combined = Array.from(map.values());
        saveBarang(combined);
        showToast(
          `Sinkronisasi Google Sheets selesai: ${updated} diperbarui, ${added} ditambah.`,
          'success'
        );
        return combined;
      });
    }
  };

  const handleImportKaryawan = (importedItems: Karyawan[], mode: 'update' | 'skip') => {
    setKaryawan((prev) => {
      const existingMap = new Map(prev.map((k) => [k.badge.toUpperCase(), k]));
      const next = [...prev];

      importedItems.forEach((item) => {
        const key = item.badge.toUpperCase();
        if (existingMap.has(key)) {
          if (mode === 'update') {
            const idx = next.findIndex((k) => k.badge.toUpperCase() === key);
            if (idx !== -1) {
              next[idx] = { ...next[idx], ...item, id: next[idx].id };
            }
          }
        } else {
          next.push(item);
        }
      });

      return next;
    });
  };

  // --- Backup / Restore Handlers ---
  const handleRestoreData = (data: BackupData) => {
    setBarang(data.barang);
    setKaryawan(data.karyawan);
    setTransaksi(data.transaksi);
    setAkun(data.akun);
  };

  const handleApplyMasterExcelSync = (
    newBarang: Barang[],
    newKaryawan: Karyawan[],
    syncResult: MasterExcelSyncResult
  ) => {
    setBarang(newBarang);
    setKaryawan(newKaryawan);
    saveLastExcelSync(syncResult);
    showToast(
      `Sinkronisasi Master Excel Berhasil! (${syncResult.barangUpdated + syncResult.barangAdded} barang & ${syncResult.karyawanUpdated + syncResult.karyawanAdded} karyawan diproses)`,
      'success'
    );
  };

  const handleResetToDefault = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reset ke Pengaturan Bawaan Demo',
      subtitle: 'Semua perubahan data lokal akan dikembalikan ke data awal',
      message: (
        <span>
          Apakah Anda yakin ingin mengembalikan seluruh data inventaris barang, personalia karyawan, riwayat transaksi, dan akun ke data bawaan pabrik?
        </span>
      ),
      confirmLabel: 'Ya, Reset Semua Data',
      confirmVariant: 'danger',
      onConfirm: () => {
        resetAllDataToDefault();
        setBarang(loadBarang());
        setKaryawan(loadKaryawan());
        setTransaksi(loadTransaksi());
        setAkun(loadAkun());
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setIsBackupModalOpen(false);
        showToast('Database berhasil direset ke pengaturan awal demo.', 'success');
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* 1. Login Overlay if unauthenticated */}
      {!currentUser && (
        <LoginOverlay akunList={akun} onLoginSuccess={handleLoginSuccess} />
      )}

      {/* 2. Main Desktop Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenGoogleSheetsModal={() => setIsGoogleSheetsModalOpen(true)}
        onLogout={handleLogout}
        currentUser={currentUser}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* 3. Main Workspace Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen flex-1">
        {/* Top Header */}
        <TopHeader
          currentTab={currentTab}
          currentUser={currentUser}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenBackupModal={() => setIsBackupModalOpen(true)}
          onOpenGoogleSheetsModal={() => setIsGoogleSheetsModalOpen(true)}
          onLogout={handleLogout}
        />

        {/* Dynamic Tab Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-20 lg:pb-8">
          {currentTab === 'dashboard' && (
            <DashboardTab
              barangList={barang}
              transaksiList={transaksi}
              onOpenKritisModal={() => setIsKritisModalOpen(true)}
              onNavigateToMutasi={() => setCurrentTab('mutasi')}
              onDeleteTransaksi={handleDeleteSingleTransaksi}
              onClearAllTransaksi={handleClearAllTransaksi}
            />
          )}

          {currentTab === 'barang' && (
            <BarangTab
              barangList={barang}
              onAddBarang={handleAddBarang}
              onUpdateBarang={handleUpdateBarang}
              onDeleteBarang={handleDeleteBarang}
              onOpenImportModal={() => setImportModalState({ isOpen: true, type: 'barang' })}
              onOpenGoogleSheetsModal={() => setIsGoogleSheetsModalOpen(true)}
              onShowToast={showToast}
            />
          )}

          {currentTab === 'mutasi' && (
            <MutasiTab
              barangList={barang}
              karyawanList={karyawan}
              transaksiList={transaksi}
              onExecuteMutasi={handleExecuteMutasi}
              onDeleteTransaksi={handleDeleteSingleTransaksi}
              onDeleteBatchTransaksi={handleDeleteBatchTransaksi}
              onClearAllTransaksi={handleClearAllTransaksi}
              onOpenMultiSelectModal={() => setIsMultiSelectModalOpen(true)}
              formRows={mutasiFormRows}
              setFormRows={setMutasiFormRows}
              onShowToast={showToast}
            />
          )}

          {currentTab === 'karyawan' && (
            <KaryawanTab
              karyawanList={karyawan}
              onAddKaryawan={handleAddKaryawan}
              onDeleteKaryawan={handleDeleteKaryawan}
              onOpenImportModal={() => setImportModalState({ isOpen: true, type: 'karyawan' })}
              onShowToast={showToast}
            />
          )}

          {currentTab === 'akun' && (
            <AkunTab
              akunList={akun}
              currentUser={currentUser}
              onAddAkun={handleAddAkun}
              onDeleteSingleAkun={handleDeleteSingleAkun}
              onDeleteBatchAkun={handleDeleteBatchAkun}
              onShowToast={showToast}
            />
          )}
        </main>
      </div>

      {/* 4. Mobile Bottom Navigation */}
      <MobileBottomNav currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* 5. Modals */}
      {/* Database & Cadangan Lokal Modal (Zero Firebase) */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        barang={barang}
        karyawan={karyawan}
        transaksi={transaksi}
        akun={akun}
        onRestoreData={handleRestoreData}
        onResetDefault={handleResetToDefault}
        onApplyMasterExcelSync={handleApplyMasterExcelSync}
        onShowToast={showToast}
      />

      {/* Persediaan Kritis Modal */}
      <PersediaanKritisModal
        isOpen={isKritisModalOpen}
        onClose={() => setIsKritisModalOpen(false)}
        barangList={barang}
        onQuickMutasiIn={handleQuickMutasiIn}
        onShowToast={showToast}
      />

      {/* Multi-Select Barang Modal */}
      <MultiSelectBarangModal
        isOpen={isMultiSelectModalOpen}
        onClose={() => setIsMultiSelectModalOpen(false)}
        barangList={barang}
        selectedBarangIds={mutasiFormRows.map((r) => r.barangId).filter(Boolean)}
        onApplySelected={handleApplyMultiSelectBarang}
      />

      {/* Excel / CSV Import Modal */}
      <ImportModal
        isOpen={importModalState.isOpen}
        onClose={() => setImportModalState((prev) => ({ ...prev, isOpen: false }))}
        type={importModalState.type}
        existingBarang={barang}
        existingKaryawan={karyawan}
        onImportBarang={handleImportBarang}
        onImportKaryawan={handleImportKaryawan}
        onShowToast={showToast}
      />

      {/* Google Sheets Integration Modal */}
      <GoogleSheetsModal
        isOpen={isGoogleSheetsModalOpen}
        onClose={() => setIsGoogleSheetsModalOpen(false)}
        barangList={barang}
        transaksiList={transaksi}
        karyawanList={karyawan}
        onImportBarang={handleImportFromGoogleSheets}
        onShowToast={showToast}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        subtitle={confirmDialog.subtitle}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        confirmVariant={confirmDialog.confirmVariant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Toast Notifications */}
      <ToastNotification toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
