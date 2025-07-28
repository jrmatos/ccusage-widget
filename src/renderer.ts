interface Window {
  ccusageAPI: {
      getUsageData: () => Promise<{
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
      }>;
      updateOpacity: (opacity: number) => Promise<void>;
      onRefreshData: (callback: () => void) => () => void;
  };
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

const formatCost = (cost: number): string => {
  return '$' + cost.toFixed(2);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 1) {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return diffMins + 'm ago';
  } else if (diffHours < 24) {
    return diffHours + 'h ago';
  } else {
    const diffDays = Math.floor(diffHours / 24);
    return diffDays + 'd ago';
  }
};

const formatModels = (models: string[]): string => {
  return models.map(m => {
    if (m.includes('opus')) return 'Opus';
    if (m.includes('sonnet')) return 'Sonnet';
    if (m.includes('haiku')) return 'Haiku';
    return m;
  }).join(', ');
};

async function loadUsageData() {
  const loadingEl = document.getElementById('loading')!;
  const errorEl = document.getElementById('error')!;
  const statsEl = document.getElementById('usage-stats')!;
  
  try {
    loadingEl.style.display = 'flex';
    errorEl.style.display = 'none';
    statsEl.style.display = 'none';
    
    const data = await window.ccusageAPI.getUsageData();
    
    // Update today's stats
    if (data.today) {
      document.getElementById('today-tokens')!.textContent = formatNumber(data.today.tokens);
      document.getElementById('today-cost')!.textContent = formatCost(data.today.cost);
      document.getElementById('today-models')!.textContent = formatModels(data.today.models);
    } else {
      document.getElementById('today-tokens')!.textContent = '0';
      document.getElementById('today-cost')!.textContent = '$0.00';
      document.getElementById('today-models')!.textContent = 'No usage';
    }
    
    // Update this month's stats
    if (data.thisMonth) {
      document.getElementById('month-tokens')!.textContent = formatNumber(data.thisMonth.tokens);
      document.getElementById('month-cost')!.textContent = formatCost(data.thisMonth.cost);
    } else {
      document.getElementById('month-tokens')!.textContent = '0';
      document.getElementById('month-cost')!.textContent = '$0.00';
    }
    
    // Update total stats
    document.getElementById('total-tokens')!.textContent = formatNumber(data.total.tokens);
    document.getElementById('total-cost')!.textContent = formatCost(data.total.cost);
    
    // Update recent sessions
    const sessionsList = document.getElementById('sessions-list')!;
    sessionsList.innerHTML = '';
    
    if (data.recentSessions.length > 0) {
      data.recentSessions.forEach((session: any) => {
        const sessionEl = document.createElement('div');
        sessionEl.className = 'session-item';
        sessionEl.innerHTML = `
          <span class="session-name" title="${session.name}">${session.name}</span>
          <span class="session-cost">${formatCost(session.cost)}</span>
        `;
        sessionsList.appendChild(sessionEl);
      });
    } else {
      sessionsList.innerHTML = '<div style="text-align: center; color: #666;">No recent sessions</div>';
    }
    
    // Update last updated time
    document.getElementById('last-updated')!.textContent = 'Updated ' + formatDate(data.lastUpdated);
    
    loadingEl.style.display = 'none';
    statsEl.style.display = 'flex';
    
  } catch (error: any) {
    console.error('Error loading usage data:', error);
    loadingEl.style.display = 'none';
    errorEl.style.display = 'flex';
    
    // Check if there's an error message in the data
    if (error && error.error) {
      document.getElementById('error-message')!.textContent = error.error;
    } else {
      document.getElementById('error-message')!.textContent = 
        error instanceof Error ? error.message : 'Failed to load usage data';
    }
  }
}

// Set up event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Initial load
  loadUsageData();
  
  // Refresh button
  document.getElementById('refresh-btn')!.addEventListener('click', loadUsageData);
  
  // Minimize button
  document.getElementById('minimize-btn')!.addEventListener('click', () => {
    window.close();
  });
  
  // Opacity slider
  const opacitySlider = document.getElementById('opacity-slider') as HTMLInputElement;
  opacitySlider.addEventListener('input', (e) => {
    const opacity = parseInt((e.target as HTMLInputElement).value) / 100;
    window.ccusageAPI.updateOpacity(opacity);
  });
  
  // Listen for refresh events from main process
  window.ccusageAPI.onRefreshData(() => {
    loadUsageData();
  });
  
  // Auto-refresh every minute
  setInterval(loadUsageData, 60000);
});