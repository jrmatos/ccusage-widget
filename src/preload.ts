import { contextBridge, ipcRenderer } from 'electron';

interface UsageData {
  today: {
    tokens: number;
    cost: number;
    models: string[];
  } | null;
  thisMonth: {
    tokens: number;
    cost: number;
  } | null;
  total: {
    tokens: number;
    cost: number;
  };
  recentSessions: Array<{
    name: string;
    tokens: number;
    cost: number;
    lastActivity: string;
  }>;
  lastUpdated: string;
}

contextBridge.exposeInMainWorld('ccusageAPI', {
  getUsageData: (): Promise<UsageData> => ipcRenderer.invoke('get-usage-data'),
  updateOpacity: (opacity: number): Promise<void> => ipcRenderer.invoke('update-opacity', opacity),
  onRefreshData: (callback: () => void) => {
    ipcRenderer.on('refresh-data', callback);
    return () => {
      ipcRenderer.removeListener('refresh-data', callback);
    };
  }
});