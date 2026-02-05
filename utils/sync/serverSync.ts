import type { CloudSaveSlot, SyncConfig } from '../../types';

const normalizeEndpoint = (endpoint: string, useHttps?: boolean): string => {
  const trimmed = endpoint.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/+$/, '');
  if (trimmed.startsWith('/')) return trimmed.replace(/\/+$/, '');
  const scheme = useHttps ? 'https' : 'http';
  return `${scheme}://${trimmed.replace(/\/+$/, '')}`;
};

const shouldCompress = (payload: string) => payload.length > 512 * 1024;

const compressPayload = async (payload: string): Promise<{ body: BodyInit; headers: Record<string, string> }> => {
  if (typeof CompressionStream === 'undefined') {
    return { body: payload, headers: {} };
  }
  try {
    const stream = new Blob([payload]).stream().pipeThrough(new CompressionStream('gzip'));
    const arrayBuffer = await new Response(stream).arrayBuffer();
    return {
      body: new Uint8Array(arrayBuffer),
      headers: { 'Content-Encoding': 'gzip' },
    };
  } catch {
    return { body: payload, headers: {} };
  }
};

export const createServerProvider = (config: SyncConfig) => {
  const endpoint = normalizeEndpoint(config.serverConfig?.endpoint || '', config.useHttps);
  const userId = config.serverConfig?.userId || '';

  const request = async (path: string, init?: RequestInit) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const separator = path.includes('?') ? '&' : '?';
    const url = userId ? `${endpoint}${path}${separator}userId=${encodeURIComponent(userId)}` : `${endpoint}${path}`;
    const response = await fetch(url, {
      ...init,
      headers: {
        ...headers,
        ...(init?.headers || {}),
      },
    });
    return response;
  };

  const parseJsonResponse = async <T>(response: Response): Promise<T> => {
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    if (!response.ok) {
      const preview = text.replace(/\s+/g, ' ').slice(0, 200);
      throw new Error(`服务器响应错误 (${response.status})：${preview || '无内容'}`);
    }
    if (!contentType.includes('application/json')) {
      const preview = text.replace(/\s+/g, ' ').slice(0, 200);
      throw new Error(`服务器返回非 JSON 内容，请确认服务器地址指向后端 API。响应片段：${preview}`);
    }
    try {
      return JSON.parse(text) as T;
    } catch (err) {
      throw new Error('服务器返回的 JSON 无法解析');
    }
  };

  return {
    connect: async () => {
      if (!endpoint) return false;
      try {
        const response = await request('/saves?summary=1', { method: 'GET' });
        return response.ok;
      } catch {
        return false;
      }
    },
    disconnect: async () => {
      return;
    },
    listSaves: async (): Promise<CloudSaveSlot[]> => {
      const response = await request('/saves?summary=1', { method: 'GET' });
      const data = await parseJsonResponse<unknown>(response);
      return Array.isArray(data) ? data : [];
    },
    getSave: async (id: string): Promise<CloudSaveSlot | null> => {
      const response = await request(`/saves/${encodeURIComponent(id)}`, { method: 'GET' });
      return await parseJsonResponse<CloudSaveSlot>(response);
    },
    uploadSave: async (save: CloudSaveSlot): Promise<boolean> => {
      if (!save?.id) return false;
      const payload = JSON.stringify(save);
      const compressed = shouldCompress(payload) ? await compressPayload(payload) : { body: payload, headers: {} };
      const response = await request(`/saves/${encodeURIComponent(save.id)}`, {
        method: 'PUT',
        body: compressed.body,
        headers: {
          'Content-Type': 'application/json',
          ...compressed.headers,
        },
      });
      if (!response.ok) {
        await parseJsonResponse<unknown>(response);
      }
      return response.ok;
    },
    deleteSave: async (id: string): Promise<boolean> => {
      const response = await request(`/saves/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!response.ok) {
        await parseJsonResponse<unknown>(response);
      }
      return response.ok;
    },
  };
};
