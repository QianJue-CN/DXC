import type { GameState } from './gamestate';

export type SyncProviderType = 'server' | 'webdav' | 'none';
export type SyncConflictResolution = 'local' | 'remote' | 'newest' | 'ask';

export interface CloudSaveSlot {
  id: string;
  userId: string;
  slotIndex: number;
  type: 'MANUAL' | 'AUTO' | 'CLOUD';
  timestamp: number;
  checksum: string;
  summary: string;
  data: GameState;
  version: string;
  deviceId?: string;
}

export interface SyncConfig {
  enabled: boolean;
  provider: SyncProviderType;
  useHttps?: boolean;
  serverConfig?: {
    endpoint: string;
    userId: string;
  };
  webdavConfig?: {
    url: string;
    username: string;
    password: string;
    basePath: string;
  };
  autoSync: boolean;
  syncInterval: number;
  conflictResolution: SyncConflictResolution;
}

export interface SyncConflict {
  slotIndex: number;
  local?: CloudSaveSlot;
  remote?: CloudSaveSlot;
  resolution?: SyncConflictResolution;
}

export interface SyncResult {
  status: 'success' | 'error' | 'no-op';
  message?: string;
  pushed: number;
  pulled: number;
  deleted: number;
  conflicts: SyncConflict[];
}
