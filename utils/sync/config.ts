export const getSyncEnvConfig = () => {
  const isDev = import.meta.env.DEV === true;
  const serverEnabledEnv = import.meta.env.VITE_SYNC_SERVER_ENABLED;
  const webdavEnabledEnv = import.meta.env.VITE_SYNC_WEBDAV_ENABLED;

  return {
    serverEnabled: serverEnabledEnv === 'false' ? false : true,
    webdavEnabled: webdavEnabledEnv === 'true',
    useHttps: import.meta.env.VITE_SYNC_USE_HTTPS === 'true',
    serverEndpoint: import.meta.env.VITE_SYNC_SERVER_ENDPOINT || '/api',
    serverUserId: import.meta.env.VITE_SYNC_SERVER_USER_ID || (isDev ? 'local-dev' : ''),
    webdavUrl: import.meta.env.VITE_WEBDAV_URL || '',
    webdavUsername: import.meta.env.VITE_WEBDAV_USERNAME || '',
    webdavPassword: import.meta.env.VITE_WEBDAV_PASSWORD || '',
    webdavBasePath: import.meta.env.VITE_WEBDAV_BASE_PATH || '/dxc-saves/',
  };
};
