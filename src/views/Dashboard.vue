<template>
  <div class="dashboard">
    <div class="page-header">
      <h1>Dashboard</h1>
      <p>Welcome back, {{ authStore.user?.full_name || 'User' }} 
        <span class="role-badge">{{ authStore.user?.role }}</span>
      </p>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon blue">🖥️</div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.isps?.total || 0 }}</span>
          <span class="stat-label">Total ISPs</span>
        </div>
        <div class="stat-badge green">{{ stats.isps?.active || 0 }} Active</div>
      </div>

      <div class="stat-card">
        <div class="stat-icon green">💰</div>
        <div class="stat-info">
          <span class="stat-value">${{ formatNumber(stats.revenue?.total || 0) }}</span>
          <span class="stat-label">Total Revenue</span>
        </div>
        <div class="stat-badge yellow">${{ formatNumber(stats.revenue?.pending || 0) }} Pending</div>
      </div>

      <div class="stat-card">
        <div class="stat-icon purple">🔑</div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.licenses?.active || 0 }}</span>
          <span class="stat-label">Active Licenses</span>
        </div>
        <div class="stat-badge red">{{ stats.licenses?.expiring_soon || 0 }} Expiring</div>
      </div>

      <div class="stat-card">
        <div class="stat-icon orange">📈</div>
        <div class="stat-info">
          <span class="stat-value">{{ formatNumber(stats.cache?.hit_rate || 0) }}%</span>
          <span class="stat-label">Cache Hit Rate</span>
        </div>
        <div class="stat-badge blue">{{ formatBytes(stats.cache?.bandwidth_saved || 0) }} Saved</div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="content-grid">
      <!-- Top 10 Apps Widget -->
      <div class="widget top-apps">
        <h3>🏆 Top 10 Cached Applications</h3>
        <div class="apps-list">
          <div v-for="(app, index) in topApps" :key="index" class="app-item">
            <span class="app-rank">#{{ index + 1 }}</span>
            <span class="app-icon">{{ app.icon }}</span>
            <span class="app-name">{{ app.name }}</span>
            <div class="app-stats">
              <span class="app-hits">{{ formatNumber(app.total_hits) }} hits</span>
              <span class="app-bandwidth">{{ formatBytes(app.total_bandwidth_mb) }}</span>
            </div>
          </div>
          <div v-if="topApps.length === 0" class="empty-apps">
            <p>No cache data yet. Apps will appear here once ISPs start reporting.</p>
          </div>
        </div>
      </div>

      <!-- Cache Performance -->
      <div class="widget cache-performance">
        <h3>📊 Cache Performance (24h)</h3>
        <div class="cache-stats">
          <div class="cache-stat">
            <span class="cache-value green">{{ formatNumber(stats.cache?.hits || 0) }}</span>
            <span class="cache-label">Cache Hits</span>
          </div>
          <div class="cache-stat">
            <span class="cache-value red">{{ formatNumber(stats.cache?.misses || 0) }}</span>
            <span class="cache-label">Cache Misses</span>
          </div>
        </div>
        <div class="hit-rate-bar">
          <div class="hit-rate-fill" :style="{ width: (stats.cache?.hit_rate || 0) + '%' }"></div>
        </div>
        <p class="hit-rate-text">{{ formatNumber(stats.cache?.hit_rate || 0) }}% Hit Rate</p>
      </div>

      <!-- Top Sites -->
      <div class="widget top-sites">
        <h3>🌐 Top Cached Domains</h3>
        <div class="sites-list">
          <div v-for="(site, index) in topSites" :key="index" class="site-item">
            <span class="site-rank">#{{ index + 1 }}</span>
            <span class="site-icon">{{ site.icon }}</span>
            <div class="site-info">
              <span class="site-domain">{{ site.domain }}</span>
              <span class="site-category">{{ site.category }}</span>
            </div>
            <span class="site-hits">{{ formatNumber(site.hits) }}</span>
          </div>
          <div v-if="topSites.length === 0" class="empty-sites">
            <p>No domains cached yet.</p>
          </div>
        </div>
      </div>

      <!-- ISP Status Overview -->
      <div class="widget isp-status">
        <h3>🖥️ ISP Status Overview</h3>
        <div class="status-overview">
          <div class="status-item">
            <div class="status-bar">
              <div class="status-fill green" :style="{ width: getPercentage(stats.isps?.active, stats.isps?.total) + '%' }"></div>
            </div>
            <span class="status-label">Active ({{ stats.isps?.active || 0 }})</span>
          </div>
          <div class="status-item">
            <div class="status-bar">
              <div class="status-fill red" :style="{ width: getPercentage(stats.isps?.suspended, stats.isps?.total) + '%' }"></div>
            </div>
            <span class="status-label">Suspended ({{ stats.isps?.suspended || 0 }})</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <h3>⚡ Quick Actions</h3>
      <div class="actions-grid">
        <router-link to="/isps" class="action-btn">
          <span class="action-icon">➕</span>
          Add New ISP
        </router-link>
        <router-link to="/licenses" class="action-btn">
          <span class="action-icon">🔑</span>
          Create License
        </router-link>
        <router-link to="/invoices" class="action-btn">
          <span class="action-icon">📄</span>
          View Invoices
        </router-link>
        <router-link v-if="authStore.isAdmin" to="/logs" class="action-btn">
          <span class="action-icon">📝</span>
          System Logs
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { dashboardAPI, topSitesAPI } from '../api';

const authStore = useAuthStore();
const stats = ref({});
const topApps = ref([]);
const topSites = ref([]);
const loading = ref(true);

const formatNumber = (num) => {
  return Number(num).toLocaleString('en-US', { maximumFractionDigits: 2 });
};

const formatBytes = (mb) => {
  if (!mb) return '0 MB';
  if (mb >= 1024) {
    return (mb / 1024).toFixed(1) + ' GB';
  }
  return mb + ' MB';
};

const getPercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return ((value || 0) / total * 100).toFixed(0);
};

const fetchData = async () => {
  try {
    const [statsRes, appsRes, sitesRes] = await Promise.all([
      dashboardAPI.getStats(),
      topSitesAPI.getTopApps(),
      topSitesAPI.getTopSites({ limit: 10 })
    ]);
    stats.value = statsRes.data.data || {};
    topApps.value = appsRes.data.data || [];
    topSites.value = sitesRes.data.data || [];
  } catch (error) {
    console.error('Failed to fetch data:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchData);
</script>

<style scoped>
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 32px;
  margin-bottom: 8px;
}

.page-header p {
  color: #94a3b8;
}

.role-badge {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  color: white;
  margin-left: 8px;
  text-transform: capitalize;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: #1e293b;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #334155;
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.blue { background: rgba(59, 130, 246, 0.2); }
.stat-icon.green { background: rgba(34, 197, 94, 0.2); }
.stat-icon.purple { background: rgba(139, 92, 246, 0.2); }
.stat-icon.orange { background: rgba(249, 115, 22, 0.2); }

.stat-info { flex: 1; }
.stat-value { display: block; font-size: 28px; font-weight: 700; color: #f8fafc; }
.stat-label { color: #94a3b8; font-size: 14px; }

.stat-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.stat-badge.green { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
.stat-badge.yellow { background: rgba(234, 179, 8, 0.2); color: #facc15; }
.stat-badge.red { background: rgba(239, 68, 68, 0.2); color: #f87171; }
.stat-badge.blue { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }

.content-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.widget {
  background: #1e293b;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #334155;
}

.widget h3 {
  margin-bottom: 20px;
  font-size: 18px;
  color: #f8fafc;
}

/* Top Apps */
.apps-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.app-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #0f172a;
  border-radius: 8px;
}

.app-rank {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.app-icon { font-size: 24px; }
.app-name { flex: 1; font-weight: 500; }
.app-stats { text-align: right; }
.app-hits { display: block; font-weight: 600; color: #4ade80; }
.app-bandwidth { font-size: 12px; color: #94a3b8; }

.empty-apps, .empty-sites {
  text-align: center;
  padding: 40px;
  color: #64748b;
}

/* Top Sites */
.sites-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.site-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #0f172a;
  border-radius: 8px;
}

.site-rank {
  font-size: 12px;
  color: #64748b;
  width: 24px;
}

.site-icon { font-size: 18px; }

.site-info { flex: 1; }
.site-domain { display: block; font-weight: 500; font-size: 14px; }
.site-category { font-size: 12px; color: #64748b; }
.site-hits { font-weight: 600; color: #60a5fa; }

/* Cache Performance */
.cache-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.cache-stat { text-align: center; }
.cache-value { display: block; font-size: 32px; font-weight: 700; }
.cache-value.green { color: #4ade80; }
.cache-value.red { color: #f87171; }
.cache-label { color: #94a3b8; font-size: 14px; }

.hit-rate-bar {
  height: 12px;
  background: #334155;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
}

.hit-rate-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 6px;
  transition: width 0.5s;
}

.hit-rate-text { text-align: center; color: #94a3b8; }

/* ISP Status */
.status-overview { display: flex; flex-direction: column; gap: 16px; }
.status-item { display: flex; align-items: center; gap: 12px; }
.status-bar { flex: 1; height: 24px; background: #334155; border-radius: 6px; overflow: hidden; }
.status-fill { height: 100%; border-radius: 6px; transition: width 0.5s; }
.status-fill.green { background: #22c55e; }
.status-fill.red { background: #ef4444; }
.status-label { min-width: 140px; color: #94a3b8; font-size: 14px; }

/* Quick Actions */
.quick-actions {
  background: #1e293b;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #334155;
}

.quick-actions h3 { margin-bottom: 20px; }

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  background: #0f172a;
  border-radius: 8px;
  color: #e2e8f0;
  text-decoration: none;
  transition: all 0.2s;
  border: 1px solid #334155;
}

.action-btn:hover {
  background: #334155;
  transform: translateY(-2px);
}

.action-icon { font-size: 20px; }

@media (max-width: 900px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
