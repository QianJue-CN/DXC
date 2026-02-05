import type { CloudSaveSlot, SyncConflictResolution } from '../../types';

export const resolveConflict = (
  local: CloudSaveSlot,
  remote: CloudSaveSlot,
  strategy: SyncConflictResolution
): SyncConflictResolution => {
  if (strategy === 'local' || strategy === 'remote' || strategy === 'ask') return strategy;
  if (local.timestamp === remote.timestamp) return 'local';
  return local.timestamp > remote.timestamp ? 'local' : 'remote';
};
