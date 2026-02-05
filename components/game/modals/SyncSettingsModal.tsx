import React, { useMemo, useState } from 'react';
import { Cloud, Server, Folder, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { SyncConfig, SyncResult } from '../../../types';
import { createSyncService, normalizeSyncConfig, validateSyncConfig } from '../../../utils/sync';

interface SyncSettingsModalProps {
  syncConfig: SyncConfig;
  onUpdate: (next: SyncConfig) => void;
}

type StatusState = {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
};

export const SyncSettingsModal: React.FC<SyncSettingsModalProps> = ({ syncConfig, onUpdate }) => {
  const config = useMemo(() => normalizeSyncConfig(syncConfig), [syncConfig]);
  const [testStatus, setTestStatus] = useState<StatusState>({ status: 'idle' });
  const [syncStatus, setSyncStatus] = useState<StatusState>({ status: 'idle' });
  const [webdavPasswordDraft, setWebdavPasswordDraft] = useState('');
  const [webdavPasswordDirty, setWebdavPasswordDirty] = useState(false);

  const hasWebdavPassword = !!config.webdavConfig?.password;

  const updateConfig = (patch: Partial<SyncConfig>) => {
    onUpdate({ ...config, ...patch });
  };

  const updateServerConfig = (patch: Partial<NonNullable<SyncConfig['serverConfig']>>) => {
    onUpdate({
      ...config,
      serverConfig: {
        ...config.serverConfig,
        ...patch,
      },
    });
  };

  const updateWebDavConfig = (patch: Partial<NonNullable<SyncConfig['webdavConfig']>>) => {
    onUpdate({
      ...config,
      webdavConfig: {
        ...config.webdavConfig,
        ...patch,
      },
    });
  };

  const summarizeSync = (result: SyncResult) => {
    if (result.status === 'error') return result.message || '同步失败';
    const parts: string[] = [];
    if (result.pushed) parts.push(`上传 ${result.pushed}`);
    if (result.pulled) parts.push(`下载 ${result.pulled}`);
    if (result.conflicts?.length) parts.push(`冲突 ${result.conflicts.length}`);
    return parts.length > 0 ? parts.join(' / ') : '无变更';
  };

  const handleTestConnection = async () => {
    const validation = validateSyncConfig(config);
    if (!validation.valid) {
      setTestStatus({ status: 'error', message: validation.message });
      return;
    }
    const service = createSyncService(config);
    if (!service) {
      setTestStatus({ status: 'error', message: '同步配置不可用' });
      return;
    }
    setTestStatus({ status: 'loading', message: '连接中...' });
    try {
      const ok = await service.connect();
      setTestStatus({ status: ok ? 'success' : 'error', message: ok ? '连接成功' : '连接失败' });
    } catch (err: any) {
      setTestStatus({ status: 'error', message: err?.message || '连接失败' });
    } finally {
      await service.disconnect();
    }
  };

  const handleSyncNow = async () => {
    const validation = validateSyncConfig(config);
    if (!validation.valid) {
      setSyncStatus({ status: 'error', message: validation.message });
      return;
    }
    const service = createSyncService(config);
    if (!service) {
      setSyncStatus({ status: 'error', message: '同步配置不可用' });
      return;
    }
    setSyncStatus({ status: 'loading', message: '同步中...' });
    try {
      const result = await service.sync();
      const message = summarizeSync(result);
      setSyncStatus({ status: result.status === 'error' ? 'error' : 'success', message });
    } catch (err: any) {
      setSyncStatus({ status: 'error', message: err?.message || '同步失败' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-zinc-200 p-4 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-zinc-800">启用云同步</div>
            <div className="text-xs text-zinc-500">启用后可跨设备同步存档</div>
          </div>
          <button
            onClick={() => updateConfig({ enabled: !config.enabled })}
            className={`px-3 py-1 text-xs font-bold uppercase border-2 transition-all ${
              config.enabled ? 'bg-black text-white border-black' : 'bg-white text-zinc-500 border-zinc-300'
            }`}
          >
            {config.enabled ? '已启用' : '未启用'}
          </button>
        </div>
        <div>
          <div className="text-xs font-bold uppercase text-zinc-500 mb-2">同步方式</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateConfig({ provider: 'server' })}
              className={`px-4 py-2 text-xs font-bold uppercase border-2 transition-all flex items-center gap-2 ${
                config.provider === 'server'
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-zinc-500 border-zinc-300 hover:border-black'
              }`}
            >
              <Server size={14} /> 服务器
            </button>
            <button
              onClick={() => updateConfig({ provider: 'webdav' })}
              className={`px-4 py-2 text-xs font-bold uppercase border-2 transition-all flex items-center gap-2 ${
                config.provider === 'webdav'
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-zinc-500 border-zinc-300 hover:border-black'
              }`}
            >
              <Cloud size={14} /> WebDAV
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-zinc-800">使用 HTTPS</div>
            <div className="text-xs text-zinc-500">自动补齐协议头</div>
          </div>
          <button
            onClick={() => updateConfig({ useHttps: !config.useHttps })}
            className={`px-3 py-1 text-xs font-bold uppercase border-2 transition-all ${
              config.useHttps ? 'bg-black text-white border-black' : 'bg-white text-zinc-500 border-zinc-300'
            }`}
          >
            {config.useHttps ? 'HTTPS' : 'HTTP'}
          </button>
        </div>
        <div className="text-[11px] text-zinc-500 flex items-center gap-2">
          <AlertTriangle size={14} className="text-amber-500" />
          WebDAV 可能需要服务端开启 CORS 允许跨域访问。
        </div>
      </div>

      {config.provider === 'server' && (
        <div className="bg-white border border-zinc-200 p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-600">
            <Server size={14} /> 服务器配置
          </div>
          <div className="text-[11px] text-zinc-500">使用项目内置本地存档目录，无需配置服务器地址或 Token。</div>
          <div className="text-xs text-zinc-500">
            存档目录：
            <span className="ml-1 font-mono text-zinc-700">
              local-sync/{config.serverConfig?.userId?.trim() || '<userId>'}/
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <label className="flex flex-col gap-1">
              用户 ID
              <input
                value={config.serverConfig?.userId || ''}
                onChange={(e) => updateServerConfig({ userId: e.target.value })}
                placeholder="user-001"
                className="border border-zinc-300 px-2 py-1 font-mono"
              />
            </label>
          </div>
        </div>
      )}

      {config.provider === 'webdav' && (
        <div className="bg-white border border-zinc-200 p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-600">
            <Folder size={14} /> WebDAV 配置
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <label className="flex flex-col gap-1">
              服务器地址
              <input
                value={config.webdavConfig?.url || ''}
                onChange={(e) => updateWebDavConfig({ url: e.target.value })}
                placeholder="https://dav.example.com"
                className="border border-zinc-300 px-2 py-1 font-mono"
              />
            </label>
            <label className="flex flex-col gap-1">
              用户名
              <input
                value={config.webdavConfig?.username || ''}
                onChange={(e) => updateWebDavConfig({ username: e.target.value })}
                placeholder="username"
                className="border border-zinc-300 px-2 py-1 font-mono"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="flex items-center justify-between">
                密码
                {hasWebdavPassword && !webdavPasswordDirty && (
                  <button
                    type="button"
                    onClick={() => {
                      setWebdavPasswordDirty(true);
                      setWebdavPasswordDraft('');
                      updateWebDavConfig({ password: '' });
                    }}
                    className="text-[10px] text-red-600 hover:underline"
                  >
                    清除
                  </button>
                )}
              </span>
              <input
                value={webdavPasswordDirty ? webdavPasswordDraft : ''}
                onChange={(e) => {
                  setWebdavPasswordDirty(true);
                  setWebdavPasswordDraft(e.target.value);
                  updateWebDavConfig({ password: e.target.value });
                }}
                placeholder={hasWebdavPassword ? '已保存，留空保持' : 'password'}
                type="password"
                autoComplete="new-password"
                className="border border-zinc-300 px-2 py-1 font-mono"
              />
              {hasWebdavPassword && !webdavPasswordDirty && (
                <span className="text-[10px] text-zinc-400">已保存（不显示明文）</span>
              )}
            </label>
            <label className="flex flex-col gap-1">
              存档目录
              <input
                value={config.webdavConfig?.basePath || '/dxc-saves/'}
                onChange={(e) => updateWebDavConfig({ basePath: e.target.value })}
                placeholder="/dxc-saves/"
                className="border border-zinc-300 px-2 py-1 font-mono"
              />
            </label>
          </div>
        </div>
      )}

      <div className="bg-white border border-zinc-200 p-4 shadow-sm space-y-3">
        <div className="text-xs font-bold uppercase text-zinc-600">同步策略</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.autoSync}
              onChange={(e) => updateConfig({ autoSync: e.target.checked })}
            />
            自动同步
          </label>
          <label className="flex flex-col gap-1">
            同步间隔 (分钟)
            <input
              type="number"
              min={1}
              value={config.syncInterval}
              onChange={(e) => updateConfig({ syncInterval: Math.max(1, Number(e.target.value) || 1) })}
              className="border border-zinc-300 px-2 py-1 font-mono"
            />
          </label>
          <label className="flex flex-col gap-1">
            冲突处理
            <select
              value={config.conflictResolution}
              onChange={(e) => updateConfig({ conflictResolution: e.target.value as SyncConfig['conflictResolution'] })}
              className="border border-zinc-300 px-2 py-1"
            >
              <option value="newest">保留最新</option>
              <option value="local">保留本地</option>
              <option value="remote">保留远程</option>
              <option value="ask">每次询问</option>
            </select>
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleTestConnection}
          className="px-4 py-2 border-2 border-black text-xs font-bold uppercase flex items-center gap-2 hover:bg-black hover:text-white transition-all"
        >
          <RefreshCw size={14} /> 测试连接
        </button>
        <button
          onClick={handleSyncNow}
          className="px-4 py-2 border-2 border-red-600 text-xs font-bold uppercase flex items-center gap-2 text-red-600 hover:bg-red-600 hover:text-white transition-all"
        >
          <Cloud size={14} /> 立即同步
        </button>
        {testStatus.status !== 'idle' && (
          <div className="text-xs flex items-center gap-2">
            {testStatus.status === 'success' ? <CheckCircle2 size={14} className="text-green-600" /> : null}
            <span className={testStatus.status === 'error' ? 'text-red-600' : 'text-zinc-600'}>
              {testStatus.message}
            </span>
          </div>
        )}
        {syncStatus.status !== 'idle' && (
          <div className="text-xs flex items-center gap-2">
            {syncStatus.status === 'success' ? <CheckCircle2 size={14} className="text-green-600" /> : null}
            <span className={syncStatus.status === 'error' ? 'text-red-600' : 'text-zinc-600'}>
              {syncStatus.message}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
