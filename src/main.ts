import { app, BrowserWindow, ipcMain, screen, Menu, Tray, nativeImage } from 'electron';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import packageJson from '../package.json';

const execAsync = promisify(exec);

// Set app name before app is ready (important for macOS)
// Use productName from package.json if available, otherwise use name
const appName = packageJson.build?.productName || packageJson.name || 'CCUsage Widget';
app.setName(appName);

// Helper function to extract session name from sessionId
function extractSessionNameFromId(sessionId: string): string {
  if (!sessionId) return 'session';
  
  // Match pattern: -Users-${whoami}-workspace-${sessionType}-${sessionName}
  // Extract the session name (the part after the second dash after workspace)
  const match = sessionId.match(/-workspace-[^-]+-([^-]+)/);
  if (match && match[1]) {
    return match[1];
  }
  
  // If that doesn't work, try to get anything after the last dash
  const parts = sessionId.split('-');
  if (parts.length > 0) {
    const lastPart = parts[parts.length - 1];
    if (lastPart && lastPart !== 'workspace') {
      return lastPart;
    }
  }
  
  // Fallback to 'session' if pattern doesn't match
  return 'session';
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let trayUpdateInterval: NodeJS.Timeout | null = null;

const isDev = process.argv.includes('--dev');

interface WidgetConfig {
  alwaysOnTop: boolean;
  opacity: number;
  refreshInterval: number;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const config: WidgetConfig = {
  alwaysOnTop: true,
  opacity: 0.95,
  refreshInterval: 60000, // 1 minute
  position: 'top-right'
};

function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  
  const windowWidth = 400;
  const windowHeight = 300;
  const minHeight = 200;
  const maxHeight = 600;
  
  let x = 0, y = 0;
  
  switch (config.position) {
    case 'top-right':
      x = screenWidth - windowWidth - 20;
      y = 20;
      break;
    case 'top-left':
      x = 20;
      y = 20;
      break;
    case 'bottom-right':
      x = screenWidth - windowWidth - 20;
      y = screenHeight - windowHeight - 20;
      break;
    case 'bottom-left':
      x = 20;
      y = screenHeight - windowHeight - 20;
      break;
  }

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    minWidth: windowWidth,
    maxWidth: windowWidth,
    minHeight: minHeight,
    maxHeight: maxHeight,
    x,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop: config.alwaysOnTop,
    resizable: true,
    movable: true,
    show: false, // Don't show window by default - only open when user clicks menu bar
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: 'customButtonsOnHover',
    vibrancy: 'under-window',
    visualEffectState: 'active'
  });

  mainWindow.setOpacity(config.opacity);

  const indexPath = isDev 
    ? path.join(__dirname, '..', 'src', 'index.html')
    : path.join(__dirname, 'index.html');
  
  
  mainWindow.loadFile(indexPath);

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Auto-hide window when it loses focus (menu bar app behavior)
  mainWindow.on('blur', () => {
    // Don't hide if DevTools are open (for debugging)
    if (!mainWindow?.webContents.isDevToolsOpened()) {
      mainWindow?.hide();
    }
  });
}

// Function to show window near the tray icon
function showWindowNearTray() {
  if (!mainWindow || !tray) return;

  const trayBounds = tray.getBounds();
  const windowBounds = mainWindow.getBounds();

  // Calculate position: below tray icon, horizontally centered
  const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));
  const y = Math.round(trayBounds.y + trayBounds.height + 8); // 8px padding below menu bar

  mainWindow.setPosition(x, y, false);
  mainWindow.show();
  mainWindow.focus();
}

// Function to fetch usage data and update tray title
async function fetchAndUpdateTrayTitle() {
  if (!tray) return;

  try {
    // Execute ccusage daily command to get today's cost
    let result;

    try {
      // Try with npx first
      result = await execAsync('npx ccusage daily --json');
    } catch (error) {
      try {
        // Try direct command
        result = await execAsync('ccusage daily --json');
      } catch (error2) {
        // Try local node_modules
        const ccusagePath = path.join(__dirname, '..', 'node_modules', '.bin', 'ccusage');
        result = await execAsync(`${ccusagePath} daily --json`);
      }
    }

    const dailyData = JSON.parse(result.stdout || '{}');
    const dailyArray = dailyData.daily || dailyData.data || [];

    // Get today's date in YYYY-MM-DD format
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayDate = `${year}-${month}-${day}`;

    // Find today's data or get the most recent day
    let today = dailyArray.find((d: any) => d.date === todayDate);
    if (!today && dailyArray.length > 0) {
      today = dailyArray[dailyArray.length - 1];
    }

    if (today) {
      const cost = today.totalCost || today.costUSD || today.totalCostUSD || 0;
      tray.setTitle(`Claude Code: $${cost.toFixed(2)}`);
    } else {
      tray.setTitle('Claude Code: $0.00');
    }
  } catch (error) {
    console.error('Error fetching usage data for tray:', error);
    tray.setTitle('Error');
  }
}

function createTray() {
  const iconPath = path.join(__dirname, '..', 'assets', 'icon-template.png');
  const icon = nativeImage.createFromPath(iconPath);

  tray = new Tray(icon.resize({ width: 16, height: 16 }));

  // Set initial title to "Claude Code: Loading..."
  tray.setTitle('Claude Code: Loading...');

  // Simplified context menu for menu bar app
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Widget',
      click: () => {
        showWindowNearTray();
      }
    },
    { type: 'separator' },
    {
      label: 'Quit CCUsage Widget',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('CCUsage Widget');
  tray.setContextMenu(contextMenu);

  // Click handler to show menu or open widget directly
  tray.on('click', () => {
    showWindowNearTray();
  });

  // Start fetching and updating tray title immediately
  fetchAndUpdateTrayTitle();

  // Set up interval to update every 60 seconds
  trayUpdateInterval = setInterval(fetchAndUpdateTrayTitle, 60000);
}

function updatePosition(position: WidgetConfig['position']) {
  config.position = position;
  if (mainWindow) {
    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
    const [width, height] = mainWindow.getSize();
    
    let x = 0, y = 0;
    
    switch (position) {
      case 'top-right':
        x = screenWidth - width - 20;
        y = 20;
        break;
      case 'top-left':
        x = 20;
        y = 20;
        break;
      case 'bottom-right':
        x = screenWidth - width - 20;
        y = screenHeight - height - 20;
        break;
      case 'bottom-left':
        x = 20;
        y = screenHeight - height - 20;
        break;
    }
    
    mainWindow.setPosition(x, y);
  }
}

app.whenReady().then(() => {
  // Hide dock icon to make this a menu bar-only app
  if (process.platform === 'darwin') {
    app.dock.hide();
  }

  // Set About panel options for macOS
  app.setAboutPanelOptions({
    applicationName: appName,
    applicationVersion: packageJson.version,
    version: packageJson.version,
    copyright: 'Copyright © 2025 JeongJaeSoon',
    authors: packageJson.author ? 
      [typeof packageJson.author === 'string' ? packageJson.author : packageJson.author.name || 'JeongJaeSoon'] : 
      ['JeongJaeSoon'],
    website: packageJson.homepage || 'https://github.com/JeongJaeSoon/ccusage-widget'
  });

  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  // Clean up tray update interval
  if (trayUpdateInterval) {
    clearInterval(trayUpdateInterval);
    trayUpdateInterval = null;
  }
});

// IPC handlers for fetching usage data
ipcMain.handle('get-usage-data', async () => {
  try {
    // Execute ccusage commands to get data
    // Try different ways to execute ccusage
    let dailyResult, monthlyResult, sessionResult, blocksResult;
    
    try {
      // First try with npx
      [dailyResult, monthlyResult, sessionResult, blocksResult] = await Promise.all([
        execAsync('npx ccusage daily --json'),
        execAsync('npx ccusage monthly --json'),
        execAsync('npx ccusage session --json'),
        execAsync('npx ccusage blocks --json')
      ]);
    } catch (error) {
      // Try with direct ccusage command
      // Try with direct ccusage command
      try {
        [dailyResult, monthlyResult, sessionResult, blocksResult] = await Promise.all([
          execAsync('ccusage daily --json'),
          execAsync('ccusage monthly --json'),
          execAsync('ccusage session --json'),
          execAsync('ccusage blocks --json')
        ]);
      } catch (error2) {
        // Try with local node_modules
        // Try with local node_modules
        const ccusagePath = path.join(__dirname, '..', 'node_modules', '.bin', 'ccusage');
        [dailyResult, monthlyResult, sessionResult, blocksResult] = await Promise.all([
          execAsync(`${ccusagePath} daily --json`),
          execAsync(`${ccusagePath} monthly --json`),
          execAsync(`${ccusagePath} session --json`),
          execAsync(`${ccusagePath} blocks --json`)
        ]);
      }
    }
    

    let dailyData, monthlyData, sessionData, blocksData;
    
    try {
      const dailyParsed = JSON.parse(dailyResult.stdout || '{}');
      const monthlyParsed = JSON.parse(monthlyResult.stdout || '{}');
      const sessionParsed = JSON.parse(sessionResult.stdout || '{}');
      const blocksParsed = JSON.parse(blocksResult.stdout || '{}');
      
      
      // Adjust to actual ccusage output structure
      dailyData = dailyParsed;
      monthlyData = monthlyParsed;
      sessionData = sessionParsed;
      blocksData = blocksParsed;
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      console.error('Raw outputs:', {
        daily: dailyResult?.stdout,
        monthly: monthlyResult?.stdout,
        session: sessionResult?.stdout,
        blocks: blocksResult?.stdout
      });
      throw new Error('Failed to parse ccusage output');
    }

    // Get today's usage (find today's date in the array)
    // Use local date to match ccusage output
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayDate = `${year}-${month}-${day}`;
    
    const dailyArray = dailyData.daily || dailyData.data || [];
    
    // Find today's data or get the most recent day
    let today = dailyArray.find((d: any) => d.date === todayDate);
    
    // If today's data is not found, get the most recent (last item in array)
    if (!today && dailyArray.length > 0) {
      today = dailyArray[dailyArray.length - 1];
    }
    
    
    // Get this month's usage
    const thisMonthDate = new Date().toISOString().substring(0, 7); // YYYY-MM format
    const monthlyArray = monthlyData.monthly || monthlyData.data || [];
    const thisMonth = monthlyArray.find((m: any) => m.month === thisMonthDate) || monthlyArray[0] || null;
    
    // Get total from summary
    const totalDaily = dailyData.totals || dailyData.summary || {};

    // Get recent sessions
    const sessionsArray = sessionData.sessions || sessionData.data || [];
    
    const recentSessions = sessionsArray.slice(0, 5).map((s: any) => {
      
      // Extract session name from sessionId if available, otherwise use fallback names
      let sessionName = s.sessionName || s.session || s.name || 'Unknown Session';
      
      // If we have a sessionId, try to extract the session name from it
      if (s.sessionId) {
        const extractedName = extractSessionNameFromId(s.sessionId);
        sessionName = extractedName;
      }
      
      return {
        name: sessionName,
        tokens: s.totalTokens || 0,
        cost: s.totalCost || s.costUSD || s.totalCostUSD || 0,
        lastActivity: s.lastActivity || s.lastUpdated || new Date().toISOString()
      };
    });

    // Get blocks data
    const blocksArray = Array.isArray(blocksData.blocks) ? blocksData.blocks : [];
    
    // Find current active block
    const currentBlock = blocksArray.find((block: any) => 
      block && typeof block === 'object' && block.isActive === true
    );
    const result = {
      today: today ? {
        date: today.date,
        tokens: today.totalTokens,
        cost: today.totalCost || today.costUSD || today.totalCostUSD,
        models: today.modelsUsed || today.models || []
      } : null,
      thisMonth: thisMonth ? {
        tokens: thisMonth.totalTokens,
        cost: thisMonth.totalCost || thisMonth.costUSD || thisMonth.totalCostUSD
      } : null,
      total: {
        tokens: totalDaily.totalTokens || 0,
        cost: totalDaily.totalCost || totalDaily.totalCostUSD || 0
      },
      currentBlock: currentBlock ? {
        tokens: (currentBlock.tokenCounts?.inputTokens || 0) + (currentBlock.tokenCounts?.outputTokens || 0),
        cost: currentBlock.costUSD || 0,
        startTime: currentBlock.startTime,
        endTime: currentBlock.endTime,
        isActive: true
      } : null,
      recentSessions,
      lastUpdated: new Date().toISOString()
    };
    
    return result;
  } catch (error) {
    console.error('Error loading usage data:', error);
    // Return empty data instead of throwing
    return {
      today: null,
      thisMonth: null,
      total: {
        tokens: 0,
        cost: 0
      },
      currentBlock: null,
      recentSessions: [],
      lastUpdated: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

ipcMain.handle('update-opacity', async (_, opacity: number) => {
  config.opacity = opacity;
  mainWindow?.setOpacity(opacity);
});