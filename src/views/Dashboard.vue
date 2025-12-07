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

    <!-- Charts Row -->
    <div class="charts-row">
      <!-- Cache Performance Chart -->
      <div class="chart-card">
        <h3>📊 Cache Performance (24h)</h3>
        <div class="chart-container">
          <Line v-if="chartData.labels.length > 0" :data="chartData" :options="chartOptions" />
          <div v-else class="no-data">
            <p>📈 No telemetry data yet</p>
            <small>Data will appear when ISPs start reporting</small>
          </div>
        </div>
      </div>

      <!-- Top 10 Apps -->
      <div class="chart-card">
        <h3>🏆 Top 10 Cached Applications</h3>
        <div class="apps-list">
          <div v-for="(app, index) in topApps" :key="index" class="app-item">
            <span class="app-rank">#{{ index + 1 }}</span>
            <span class="app-icon">{{ app.icon }}</span>
            <span class="app-name">{{ app.name }}</span>
            <div class="app-stats">
              <span class="app-hits">{{ formatNumber(app.total_hits) }}</span>
              <span class="app-bandwidth">{{ formatBytes(app.total_bandwidth_mb) }}</span>
            </div>
          </div>
          <div v-if="topApps.length === 0" class="no-data">
            <p>🎬 No cache data yet</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Second Row -->
    <div class="charts-row">
      <!-- Hit Rate Chart -->
      <div class="chart-card">
        <h3>🎯 Hit Rate Over Time</h3>
        <div class="chart-container">
          <Line v-if="hitRateChartData.labels.length > 0" :data="hitRateChartData" :options="hitRateChartOptions" />
          <div v-else class="no-data">
            <p>📉 No data available</p>
          </div>
        </div>
      </div>

      <!-- ISP Status -->
      <div class="chart-card">
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
        <div class="cache-summary">
          <div class="summary-item">
            <span class="summary-value green">{{ formatNumber(stats.cache?.hits || 0) }}</span>
            <span class="summary-label">Cache Hits</span>
          </div>
          <div class="summary-item">
            <span class="summary-value red">{{ formatNumber(stats.cache?.misses || 0) }}</span>
            <span class="summary-label">Cache Misses</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <h3>⚡ Quick Actions</h3>
      <div class="actions-grid">
        <router-link to="/isps" class="action-btn"><span class="action-icon">➕</span>Add New ISP</router-link>
        <router-link to="/licenses" class="action-btn"><span class="action-icon">🔑</span>Create License</router-link>
        <router-link to="/invoices" class="action-btn"><span class="action-icon">📄</span>View Invoices</router-link>
        <router-link v-if="authStore.isAdmin" to="/logs" class="action-btn"><span class="action-icon">📝</span>System Logs</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { useAuthStore } from '../stores/auth';
import { dashboardAPI, topSitesAPI } from '../api';
import api from '../api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const authStore = useAuthStore();
const stats = ref({});
const topApps = ref([]);
const telemetryHistory = ref([]);

const formatNumber = (num) => Number(num).toLocaleString('en-US', { maximumFractionDigits: 2 });
const formatBytes = (mb) => {
  if (!mb) return '0 MB';
  if (mb >= 1024) return (mb / 1024).toFixed(1) + ' GB';
  return mb + ' MB';
};
const getPercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return ((value || 0) / total * 100).toFixed(0);
};

const chartData = computed(() => ({
  labels: telemetryHistory.value.map(d => {
    const date = new Date(d.time);
    return date.getHours() + ':00';
  }),
  datasets: [
    {
      label: 'Cache Hits',
      data: telemetryHistory.value.map(d => d.hits),
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      fill: true,
      tension: 0.4,
    },
    {
      label: 'Cache Misses',
      data: telemetryHistory.value.map(d => d.misses),
      borderColor: '#ef4444',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      fill: true,
      tension: 0.4,
    }
  ]
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top', labels: { color: '#94a3b8' } },
  },
  scales: {
    x: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
    y: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }
  }
};

const hitRateChartData = computed(() => ({
  labels: telemetryHistory.value.map(d => {
    const date = new Date(d.time);
    return date.getHours() + ':00';
  }),
  datasets: [{
    label: 'Hit Rate %',
    data: telemetryHistory.value.map(d => d.hit_rate),
    borderColor: '#8b5cf6',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    fill: true,
    tension: 0.4,
  }]
}));

const hitRateChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top', labels: { color: '#94a3b8' } },
  },
  scales: {
    x: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
    y: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' }, min: 0, max: 100 }
  }
};

const fetchData = async () => {
  try {
    const [statsRes, appsRes, historyRes] = await Promise.all([
      dashboardAPI.getStats(),
      topSitesAPI.getTopApps(),
      api.get('/telemetry/history', { params: { hours: 24 } })
    ]);
    stats.value = statsRes.data.data || {};
    topApps.value = appsRes.data.data || [];
    telemetryHistory.value = historyRes.data.data || [];
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
};

onMounted(fetchData);
</script>

<style scoped>
.dashboard { max-width: 1400px; margin: 0 auto; }
.page-header { margin-bottom: 32px; }
.page-header h1 { font-size: 32px; margin-bottom: 8px; }
.page-header p { color: #94a3b8; }
.role-badge { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 4px 12px; border-radius: 20px; font-size: 12px; color: white; margin-left: 8px; text-transform: capitalize; }

.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 32px; }
.stat-card { background: #1e293b; border-radius: 12px; padding: 24px; border: 1px solid #334155; display: flex; align-items: center; gap: 16px; position: relative; }
.stat-icon { width: 56px; height: 56px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
.stat-icon.blue { background: rgba(59, 130, 246, 0.2); }
.stat-icon.green { background: rgba(34, 197, 94, 0.2); }
.stat-icon.purple { background: rgba(139, 92, 246, 0.2); }
.stat-icon.orange { background: rgba(249, 115, 22, 0.2); }
.stat-info { flex: 1; }
.stat-value { display: block; font-size: 28px; font-weight: 700; color: #f8fafc; }
.stat-label { color: #94a3b8; font-size: 14px; }
.stat-badge { position: absolute; top: 12px; right: 12px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
.stat-badge.green { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
.stat-badge.yellow { background: rgba(234, 179, 8, 0.2); color: #facc15; }
.stat-badge.red { background: rgba(239, 68, 68, 0.2); color: #f87171; }
.stat-badge.blue { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }

.charts-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 32px; }
.chart-card { background: #1e293b; border-radius: 12px; padding: 24px; border: 1px solid #334155; }
.chart-card h3 { margin-bottom: 20px; font-size: 18px; color: #f8fafc; }
.chart-container { height: 250px; }
.no-data { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: #64748b; }
.no-data p { font-size: 18px; margin-bottom: 8px; }

.apps-list { display: flex; flex-direction: column; gap: 10px; max-height: 300px; overflow-y: auto; }
.app-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: #0f172a; border-radius: 8px; }
.app-rank { width: 28px; height: 28px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
.app-icon { font-size: 24px; }
.app-name { flex: 1; font-weight: 500; }
.app-stats { text-align: right; }
.app-hits { display: block; font-weight: 600; color: #4ade80; }
.app-bandwidth { font-size: 12px; color: #94a3b8; }

.status-overview { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
.status-item { display: flex; align-items: center; gap: 12px; }
.status-bar { flex: 1; height: 24px; background: #334155; border-radius: 6px; overflow: hidden; }
.status-fill { height: 100%; border-radius: 6px; transition: width 0.5s; }
.status-fill.green { background: #22c55e; }
.status-fill.red { background: #ef4444; }
.status-label { min-width: 140px; color: #94a3b8; font-size: 14px; }

.cache-summary { display: flex; justify-content: space-around; padding-top: 20px; border-top: 1px solid #334155; }
.summary-item { text-align: center; }
.summary-value { display: block; font-size: 28px; font-weight: 700; }
.summary-value.green { color: #4ade80; }
.summary-value.red { color: #f87171; }
.summary-label { color: #94a3b8; font-size: 14px; }

.quick-actions { background: #1e293b; border-radius: 12px; padding: 24px; border: 1px solid #334155; }
.quick-actions h3 { margin-bottom: 20px; }
.actions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
.action-btn { display: flex; align-items: center; gap: 10px; padding: 16px 20px; background: #0f172a; border-radius: 8px; color: #e2e8f0; text-decoration: none; transition: all 0.2s; border: 1px solid #334155; }
.action-btn:hover { background: #334155; transform: translateY(-2px); }
.action-icon { font-size: 20px; }

@media (max-width: 900px) { .charts-row { grid-template-columns: 1fr; } }
</style>
