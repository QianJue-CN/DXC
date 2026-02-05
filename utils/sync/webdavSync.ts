import type { CloudSaveSlot, SyncConfig } from '../../types';

const normalizeUrl = (url: string, useHttps?: boolean): string => {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/+$/, '');
  const scheme = useHttps ? 'https' : 'http';
  return `${scheme}://${trimmed.replace(/\/+$/, '')}`;
};

const normalizeBasePath = (path: string): string => {
  const raw = path.trim() || '/';
  const withLeading = raw.startsWith('/') ? raw : `/${raw}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
};

const buildAuthHeader = (username?: string, password?: string): string | null => {
  if (!username && !password) return null;
  const token = btoa(`${username || ''}:${password || ''}`);
  return `Basic ${token}`;
};

const fileNameFromId = (id: string): string => {
  if (id.endsWith('.json')) return id;
  if (id.startsWith('slot_')) return `${id}.json`;
  return `slot_${id}.json`;
};

export const createWebDavProvider = (config: SyncConfig) => {
  const baseUrl = normalizeUrl(config.webdavConfig?.url || '', config.useHttps);
  const basePath = normalizeBasePath(config.webdavConfig?.basePath || '/dxc-saves/');
  const username = config.webdavConfig?.username || '';
  const password = config.webdavConfig?.password || '';
  const authHeader = buildAuthHeader(username, password);

  const buildHeaders = (extra?: Record<string, string>) => {
    const headers: Record<string, string> = { ...extra };
    if (authHeader) headers.Authorization = authHeader;
    return headers;
  };

  const baseCollectionUrl = `${baseUrl}${basePath}`;

  const request = async (url: string, init: RequestInit) => {
    const response = await fetch(url, {
      ...init,
      headers: {
        ...(init.headers || {}),
      },
    });
    return response;
  };

  const ensureCollection = async (): Promise<boolean> => {
    if (!baseUrl) return false;
    const headers = buildHeaders({ Depth: '0' });
    const response = await request(baseCollectionUrl, { method: 'PROPFIND', headers });
    if (response.ok || response.status === 207) return true;
    if (response.status !== 404) return false;
    const mkcol = await request(baseCollectionUrl, { method: 'MKCOL', headers: buildHeaders() });
    if (mkcol.ok || mkcol.status === 201 || mkcol.status === 405) return true;
    const retry = await request(baseCollectionUrl, { method: 'PROPFIND', headers });
    return retry.ok || retry.status === 207;
  };

  const listFiles = async (): Promise<string[]> => {
    const headers = buildHeaders({ Depth: '1' });
    const response = await request(baseCollectionUrl, { method: 'PROPFIND', headers });
    if (!response.ok && response.status !== 207) return [];
    const xmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');
    const responseNodes = Array.from(doc.getElementsByTagNameNS('*', 'response'));
    const hrefs = responseNodes
      .map((node) => node.getElementsByTagNameNS('*', 'href')[0]?.textContent || '')
      .filter(Boolean)
      .map((href) => decodeURIComponent(href));

    const names = hrefs
      .map((href) => href.split('/').filter(Boolean).pop() || '')
      .filter((name) => name.startsWith('slot_') && name.endsWith('.json'));

    return Array.from(new Set(names));
  };

  const getSaveFromFile = async (fileName: string): Promise<CloudSaveSlot | null> => {
    const url = `${baseUrl}${basePath}${fileName}`;
    const response = await request(url, { method: 'GET', headers: buildHeaders() });
    if (!response.ok) return null;
    try {
      return (await response.json()) as CloudSaveSlot;
    } catch {
      return null;
    }
  };

  return {
    connect: async () => {
      return ensureCollection();
    },
    disconnect: async () => {
      return;
    },
    listSaves: async (): Promise<CloudSaveSlot[]> => {
      const files = await listFiles();
      if (files.length === 0) return [];
      const saves = await Promise.all(files.map((file) => getSaveFromFile(file)));
      return saves.filter((save): save is CloudSaveSlot => !!save);
    },
    getSave: async (id: string): Promise<CloudSaveSlot | null> => {
      const fileName = fileNameFromId(id);
      return getSaveFromFile(fileName);
    },
    uploadSave: async (save: CloudSaveSlot): Promise<boolean> => {
      if (!save?.slotIndex) return false;
      const fileName = `slot_${save.slotIndex}.json`;
      const url = `${baseUrl}${basePath}${fileName}`;
      const response = await request(url, {
        method: 'PUT',
        headers: buildHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(save),
      });
      return response.ok;
    },
    deleteSave: async (id: string): Promise<boolean> => {
      const fileName = fileNameFromId(id);
      const url = `${baseUrl}${basePath}${fileName}`;
      const response = await request(url, { method: 'DELETE', headers: buildHeaders() });
      return response.ok || response.status === 404;
    },
  };
};
