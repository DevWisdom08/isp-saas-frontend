<template>
  <div class="logs-page">
    <div class="page-header">
      <div>
        <h1>System Logs</h1>
        <p>View system events and errors</p>
      </div>
      <div class="header-actions">
        <select v-model="levelFilter" @change="fetchLogs" class="filter-select">
          <option value="">All Levels</option>
          <option value="INFO">INFO</option>
          <option value="WARN">WARN</option>
          <option value="ERROR">ERROR</option>
          <option value="DEBUG">DEBUG</option>
        </select>
        <button @click="cleanupLogs" class="btn-secondary">🗑️ Cleanup Old</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="log-stats">
      <div class="stat-pill info">ℹ️ INFO: {{ stats.INFO || 0 }}</div>
      <div class="stat-pill warn">⚠️ WARN: {{ stats.WARN || 0 }}</div>
      <div class="stat-pill error">❌ ERROR: {{ stats.ERROR || 0 }}</div>
    </div>

    <!-- Logs Table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Level</th>
            <th>Source</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id" :class="['log-row', log.level.toLowerCase()]">
            <td class="time">{{ formatDate(log.created_at) }}</td>
            <td>
              <span :class="['level-badge', log.level.toLowerCase()]">{{ log.level }}</span>
            </td>
            <td>{{ log.source || '-' }}</td>
            <td class="message">{{ log.message }}</td>
          </tr>
          <tr v-if="logs.length === 0">
            <td colspan="4" class="empty">No logs found</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { logsAPI } from '../api';

const logs = ref([]);
const stats = ref({});
const levelFilter = ref('');

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('en-US', { 
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
};

const fetchLogs = async () => {
  try {
    const params = {};
    if (levelFilter.value) params.level = levelFilter.value;
    params.limit = 100;
    
    const [logsRes, statsRes] = await Promise.all([
      logsAPI.getAll(params),
      logsAPI.getStats()
    ]);
    logs.value = logsRes.data.data || [];
    stats.value = statsRes.data.data || {};
  } catch (error) {
    console.error('Failed to fetch:', error);
  }
};

const cleanupLogs = async () => {
  if (confirm('Delete logs older than 30 days?')) {
    try {
      const res = await logsAPI.cleanup();
      alert(`Deleted ${res.data.data?.deleted || 0} old logs`);
      fetchLogs();
    } catch (error) {
      alert('Failed to cleanup');
    }
  }
};

onMounted(fetchLogs);
</script>

<style scoped>
.logs-page { max-width: 1400px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-header h1 { font-size: 28px; margin-bottom: 4px; }
.page-header p { color: #94a3b8; }
.header-actions { display: flex; gap: 12px; }
.filter-select { padding: 10px 16px; background: #1e293b; border: 1px solid #334155; border-radius: 8px; color: #e2e8f0; }
.btn-secondary { padding: 10px 20px; background: #334155; color: white; border: none; border-radius: 8px; cursor: pointer; }

.log-stats { display: flex; gap: 12px; margin-bottom: 24px; }
.stat-pill { padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 500; }
.stat-pill.info { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
.stat-pill.warn { background: rgba(234, 179, 8, 0.2); color: #facc15; }
.stat-pill.error { background: rgba(239, 68, 68, 0.2); color: #f87171; }

.table-container { background: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #334155; }
th { background: #0f172a; font-weight: 600; color: #94a3b8; font-size: 14px; text-transform: uppercase; }
.time { color: #94a3b8; font-size: 13px; white-space: nowrap; }
.message { max-width: 500px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.level-badge { padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
.level-badge.info { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
.level-badge.warn { background: rgba(234, 179, 8, 0.2); color: #facc15; }
.level-badge.error { background: rgba(239, 68, 68, 0.2); color: #f87171; }
.level-badge.debug { background: rgba(139, 92, 246, 0.2); color: #a78bfa; }
.log-row.error { background: rgba(239, 68, 68, 0.05); }
.log-row.warn { background: rgba(234, 179, 8, 0.05); }
.empty { text-align: center; color: #64748b; padding: 40px !important; }
</style>
