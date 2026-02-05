import type { SaveSlot } from '../types';

const DB_NAME = 'dxc_storage';
const DB_VERSION = 1;
const SAVE_STORE = 'saves';
const META_STORE = 'meta';
const MIGRATION_KEY = 'migrated_localstorage_v1';

interface SaveRecord {
  key: string;
  save: SaveSlot;
}

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SAVE_STORE)) {
        db.createObjectStore(SAVE_STORE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const withStore = async <T>(
  storeName: string,
  mode: IDBTransactionMode,
  runner: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const request = runner(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getMeta = async (key: string): Promise<unknown> =>
  withStore(META_STORE, 'readonly', (store) => store.get(key));

const setMeta = async (key: string, value: unknown): Promise<void> => {
  await withStore(META_STORE, 'readwrite', (store) => store.put(value, key));
};

export const buildSaveKey = (slotId: number | string): string => {
  const str = String(slotId);
  if (str.startsWith('auto')) return `danmachi_save_${str}`;
  return `danmachi_save_manual_${str}`;
};

export const estimateSaveSize = (save: SaveSlot): number => {
  try {
    return new Blob([JSON.stringify(save)]).size;
  } catch {
    return 0;
  }
};

export const getSaveByKey = async (key: string): Promise<SaveSlot | null> => {
  await migrateLocalStorageSaves();
  const record = await withStore<SaveRecord | undefined>(SAVE_STORE, 'readonly', (store) => store.get(key));
  if (record?.save) return record.save;
  return null;
};

export const setSaveByKey = async (key: string, save: SaveSlot): Promise<void> => {
  await withStore(SAVE_STORE, 'readwrite', (store) => store.put({ key, save }));
};

export const deleteSaveByKey = async (key: string): Promise<void> => {
  await withStore(SAVE_STORE, 'readwrite', (store) => store.delete(key));
};

export const clearAllSaves = async (): Promise<void> => {
  await withStore(SAVE_STORE, 'readwrite', (store) => store.clear());
};

export const listSaveRecords = async (): Promise<SaveRecord[]> => {
  await migrateLocalStorageSaves();
  const records = await withStore<SaveRecord[]>(SAVE_STORE, 'readonly', (store) => store.getAll());
  return Array.isArray(records) ? records : [];
};

export const getSaveBySlotId = async (slotId: number | string): Promise<SaveSlot | null> => {
  const key = buildSaveKey(slotId);
  return getSaveByKey(key);
};

export const migrateLocalStorageSaves = async (): Promise<void> => {
  const migrated = await getMeta(MIGRATION_KEY);
  if (migrated) return;

  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (key.includes('save_auto') || key.includes('save_manual')) keys.push(key);
  }

  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed) continue;
      const save: SaveSlot = parsed.data && parsed.type ? parsed : {
        id: parsed.id || key,
        type: key.includes('save_auto') ? 'AUTO' : 'MANUAL',
        timestamp: parsed.timestamp || Date.now(),
        summary: parsed.summary || 'Migrated Save',
        data: parsed.data || parsed,
        version: parsed.version || '3.0',
      };
      await setSaveByKey(key, save);
      localStorage.removeItem(key);
    } catch {
      continue;
    }
  }

  await setMeta(MIGRATION_KEY, true);
};
