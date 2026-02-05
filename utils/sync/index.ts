import type { CloudSaveSlot, SyncConfig, SyncConflict, SyncResult } from '../../types';
import type { SaveSlot } from '../../types';
import { getSyncEnvConfig } from './config';
import { getSaveByKey, setSaveByKey } from '../saveStore';
import { resolveConflict } from './conflictResolver';
import { createWebDavProvider } from './webdavSync';
import { createServerProvider } from './serverSync';

interface LocalSlotMeta {
  slotIndex: number;
  type: 'MANUAL' | 'AUTO';
  key: string;
  localId: number | string;
}

const LOCAL_SLOTS: LocalSlotMeta[] = [
  { slotIndex: 1, type: 'MANUAL', key: 'danmachi_save_manual_1', localId: 1 },
  { slotIndex: 2, type: 'MANUAL', key: 'danmachi_save_manual_2', localId: 2 },
  { slotIndex: 3, type: 'MANUAL', key: 'danmachi_save_manual_3', localId: 3 },
  { slotIndex: 4, type: 'AUTO', key: 'danmachi_save_auto_1', localId: 'auto_1' },
  { slotIndex: 5, type: 'AUTO', key: 'danmachi_save_auto_2', localId: 'auto_2' },
  { slotIndex: 6, type: 'AUTO', key: 'danmachi_save_auto_3', localId: 'auto_3' },
];

export interface SyncService {
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  listSaves(): Promise<CloudSaveSlot[]>;
  getSave(id: string): Promise<CloudSaveSlot | null>;
  uploadSave(save: CloudSaveSlot): Promise<boolean>;
  deleteSave(id: string): Promise<boolean>;
  sync(): Promise<SyncResult>;
}

export const getDefaultSyncConfig = (): SyncConfig => {
  const env = getSyncEnvConfig();
  const provider = env.serverEnabled
    ? 'server'
    : env.webdavEnabled
      ? 'webdav'
      : 'none';
  return {
    enabled: env.serverEnabled || env.webdavEnabled,
    provider,
    useHttps: env.useHttps,
    serverConfig: {
      endpoint: env.serverEndpoint,
      userId: env.serverUserId,
    },
    webdavConfig: {
      url: env.webdavUrl,
      username: env.webdavUsername,
      password: env.webdavPassword,
      basePath: env.webdavBasePath,
    },
    autoSync: false,
    syncInterval: 5,
    conflictResolution: 'newest',
  };
};

export const normalizeSyncConfig = (config?: SyncConfig | null): SyncConfig => {
  const defaults = getDefaultSyncConfig();
  if (!config) return defaults;
  const mergedServerConfig = {
    ...defaults.serverConfig,
    ...(config.serverConfig || {}),
  };
  if (!mergedServerConfig.endpoint) mergedServerConfig.endpoint = defaults.serverConfig.endpoint;
  const mergedWebdavConfig = {
    ...defaults.webdavConfig,
    ...(config.webdavConfig || {}),
  };
  if (!mergedWebdavConfig.basePath) mergedWebdavConfig.basePath = defaults.webdavConfig.basePath;
  return {
    ...defaults,
    ...config,
    serverConfig: mergedServerConfig,
    webdavConfig: mergedWebdavConfig,
  };
};

export const validateSyncConfig = (config: SyncConfig): { valid: boolean; message?: string } => {
  if (!config.enabled) return { valid: false, message: '云同步未启用' };
  if (config.provider === 'none') return { valid: false, message: '未选择同步方式' };
  if (config.provider === 'server') {
    if (!config.serverConfig?.endpoint?.trim()) return { valid: false, message: '服务器地址不能为空' };
    if (!config.serverConfig?.userId?.trim()) return { valid: false, message: '用户 ID 不能为空' };
    return { valid: true };
  }
  if (config.provider === 'webdav') {
    if (!config.webdavConfig?.url?.trim()) return { valid: false, message: 'WebDAV 地址不能为空' };
    return { valid: true };
  }
  return { valid: false, message: '未知同步方式' };
};

const parseSlotIndex = (id?: string | null): number | null => {
  if (!id) return null;
  const match = id.match(/(\d+)/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
};

const ensureDeviceId = (): string => {
  const key = 'dxc_device_id';
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const generated = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `dxc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  localStorage.setItem(key, generated);
  return generated;
};

const getUserId = (config: SyncConfig): string => {
  if (config.provider === 'server') return config.serverConfig?.userId || 'user';
  if (config.provider === 'webdav') return config.webdavConfig?.username || 'webdav';
  return 'local';
};

const computeChecksum = async (payload: unknown): Promise<string> => {
  try {
    if (!('crypto' in globalThis) || !crypto.subtle) {
      const fallback = JSON.stringify(payload);
      return `sha256-fallback:${fallback.length}`;
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload));
    const digest = await crypto.subtle.digest('SHA-256', data);
    const hash = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return `sha256:${hash}`;
  } catch (err) {
    return 'sha256-error';
  }
};

const readLocalSave = async (meta: LocalSlotMeta): Promise<SaveSlot | null> => {
  const saved = await getSaveByKey(meta.key);
  if (!saved) return null;
  if (saved.data && saved.type) return saved as SaveSlot;
  const state = saved.data || saved;
  return {
    id: meta.localId,
    type: meta.type,
    timestamp: saved.timestamp || Date.now(),
    summary: saved.summary || `${meta.type} SLOT ${meta.slotIndex}`,
    data: state,
    version: saved.version || '3.0',
  };
};

const writeLocalSave = async (meta: LocalSlotMeta, cloudSave: CloudSaveSlot): Promise<boolean> => {
  if (!cloudSave?.data) return false;
  const saveData: SaveSlot = {
    id: meta.localId,
    type: meta.type,
    timestamp: cloudSave.timestamp || Date.now(),
    summary: cloudSave.summary || `${meta.type} SLOT ${meta.slotIndex}`,
    data: cloudSave.data,
    version: cloudSave.version || '3.0',
  };
  try {
    await setSaveByKey(meta.key, saveData);
    return true;
  } catch (err) {
    return false;
  }
};

const toCloudSave = async (
  save: SaveSlot,
  meta: LocalSlotMeta,
  config: SyncConfig
): Promise<CloudSaveSlot> => {
  return {
    id: `slot_${meta.slotIndex}`,
    userId: getUserId(config),
    slotIndex: meta.slotIndex,
    type: save.type,
    timestamp: save.timestamp,
    checksum: await computeChecksum(save.data),
    summary: save.summary || `${save.type} SLOT ${meta.slotIndex}`,
    data: save.data,
    version: save.version || '3.0',
    deviceId: ensureDeviceId(),
  };
};

const createProvider = (config: SyncConfig) => {
  if (config.provider === 'webdav') return createWebDavProvider(config);
  if (config.provider === 'server') return createServerProvider(config);
  return null;
};

const syncWithProvider = async (
  provider: Omit<SyncService, 'sync'>,
  config: SyncConfig
): Promise<SyncResult> => {
  const validation = validateSyncConfig(config);
  if (!validation.valid) {
    return {
      status: 'error',
      message: validation.message,
      pushed: 0,
      pulled: 0,
      deleted: 0,
      conflicts: [],
    };
  }

  let connected = false;
  try {
    connected = await provider.connect();
    if (!connected) {
      return {
        status: 'error',
        message: '连接失败',
        pushed: 0,
        pulled: 0,
        deleted: 0,
        conflicts: [],
      };
    }

    const remoteList = await provider.listSaves();
    const remoteMap = new Map<number, CloudSaveSlot>();
    remoteList.forEach((remote) => {
      const slotIndex = Number.isFinite(remote.slotIndex)
        ? remote.slotIndex
        : parseSlotIndex(remote.id);
      if (!slotIndex) return;
      remoteMap.set(slotIndex, remote);
    });

    const localEntries = await Promise.all(
      LOCAL_SLOTS.map(async (meta) => {
        const save = readLocalSave(meta);
        if (!save) return null;
        const cloud = await toCloudSave(save, meta, config);
        return { meta, cloud };
      })
    );

    const localMap = new Map<number, { meta: LocalSlotMeta; cloud: CloudSaveSlot }>();
    localEntries.forEach((entry) => {
      if (!entry) return;
      localMap.set(entry.meta.slotIndex, entry);
    });

    const indices = new Set<number>([...localMap.keys(), ...remoteMap.keys()]);
    const conflicts: SyncConflict[] = [];
    let pushed = 0;
    let pulled = 0;
    let deleted = 0;

    for (const index of indices) {
      const localEntry = localMap.get(index);
      const remoteEntry = remoteMap.get(index);
      const meta = LOCAL_SLOTS.find((slot) => slot.slotIndex === index);

      if (localEntry && !remoteEntry) {
        const success = await provider.uploadSave(localEntry.cloud);
        if (success) pushed += 1;
        continue;
      }

      if (!localEntry && remoteEntry && meta) {
        const fullRemote = remoteEntry.data ? remoteEntry : await provider.getSave(remoteEntry.id);
        if (fullRemote && await writeLocalSave(meta, fullRemote)) pulled += 1;
        continue;
      }

      if (localEntry && remoteEntry && meta) {
        const sameChecksum =
          localEntry.cloud.checksum &&
          remoteEntry.checksum &&
          localEntry.cloud.checksum === remoteEntry.checksum;
        const sameTimestamp = localEntry.cloud.timestamp === remoteEntry.timestamp;
        if (sameChecksum || sameTimestamp) continue;

        const resolution = resolveConflict(localEntry.cloud, remoteEntry, config.conflictResolution);
        if (resolution === 'ask') {
          conflicts.push({
            slotIndex: index,
            local: localEntry.cloud,
            remote: remoteEntry,
            resolution,
          });
          continue;
        }
        if (resolution === 'local') {
          const success = await provider.uploadSave(localEntry.cloud);
          if (success) pushed += 1;
        } else if (resolution === 'remote') {
          const fullRemote = remoteEntry.data ? remoteEntry : await provider.getSave(remoteEntry.id);
          if (fullRemote && await writeLocalSave(meta, fullRemote)) pulled += 1;
        }
      }
    }

    const totalChanges = pushed + pulled + deleted;
    const status: SyncResult['status'] = totalChanges === 0 && conflicts.length === 0 ? 'no-op' : 'success';

    if (status !== 'error') {
      localStorage.setItem('dxc_last_sync', new Date().toISOString());
    }

    return {
      status,
      message: conflicts.length > 0 ? '存在冲突，需要手动处理' : undefined,
      pushed,
      pulled,
      deleted,
      conflicts,
    };
  } catch (err: any) {
    return {
      status: 'error',
      message: err?.message || '同步失败',
      pushed: 0,
      pulled: 0,
      deleted: 0,
      conflicts: [],
    };
  } finally {
    if (connected) {
      await provider.disconnect();
    }
  }
};

export const createSyncService = (config?: SyncConfig | null): SyncService | null => {
  const normalized = normalizeSyncConfig(config);
  if (!normalized.enabled || normalized.provider === 'none') return null;
  const provider = createProvider(normalized);
  if (!provider) return null;
  return {
    ...provider,
    sync: () => syncWithProvider(provider, normalized),
  };
};

