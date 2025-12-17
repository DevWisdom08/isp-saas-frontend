<template>
  <div class="isp-dashboard">
    <h1>🖥️ My Cache Server Dashboard</h1>
    
    <!-- Loading State -->
    <div v-if="loading" class="loading">Loading your dashboard...</div>

    <!-- Dashboard Content -->
    <div v-else-if="ispData" class="dashboard-content">
      
      <!-- Server Info Card -->
      <div class="card server-info">
        <h2>🔧 Server Information</h2>
        <div class="info-grid">
          <div class="info-item">
            <label>ISP Name:</label>
            <span>{{ ispData.name }}</span>
          </div>
          <div class="info-item">
            <label>Server IP:</label>
            <span><code>{{ ispData.server_ip }}</code></span>
          </div>
          <div class="info-item">
            <label>Status:</label>
            <span :class="['status-badge', ispData.status]">
              {{ ispData.status === 'active' ? '✅ Active' : '⚠️ Suspended' }}
            </span>
          </div>
          <div class="info-item">
            <label>License Expires:</label>
            <span>{{ formatDate(ispData.license_expires_at) }}</span>
          </div>
        </div>
      </div>

      <!-- Savings Summary -->
      <div class="savings-grid">
        <div class="card stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-value">${{ formatNumber(commercial.savings?.monthly_usd || 0) }}</div>
          <div class="stat-label">Monthly Savings</div>
        </div>
        
        <div class="card stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-value">{{ formatNumber(commercial.performance?.hit_rate_percent || 0, 1) }}%</div>
          <div class="stat-label">Cache Hit Rate</div>
        </div>
        
        <div class="card stat-card">
          <div class="stat-icon">⚡</div>
          <div class="stat-value">{{ formatNumber(commercial.traffic?.bandwidth_saved_mbps || 0, 2) }} Mbps</div>
          <div class="stat-label">Bandwidth Saved</div>
        </div>
        
        <div class="card stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-value">{{ formatNumber(commercial.savings?.roi_months || 0, 1) }}</div>
          <div class="stat-label">ROI (Months)</div>
        </div>
      </div>

      <!-- Performance Metrics -->
      <div class="card performance-card">
        <h2>📈 Cache Performance</h2>
        <div class="metrics-row">
          <div class="metric">
            <label>Cache Hits:</label>
            <span class="value success">{{ formatNumber(commercial.performance?.cache_hits || 0) }}</span>
          </div>
          <div class="metric">
            <label>Cache Misses:</label>
            <span class="value">{{ formatNumber(commercial.performance?.cache_misses || 0) }}</span>
          </div>
          <div class="metric">
            <label>Total Requests:</label>
            <span class="value">{{ formatNumber(commercial.performance?.total_requests || 0) }}</span>
          </div>
          <div class="metric">
            <label>Data Cached:</label>
            <span class="value highlight">{{ formatNumber((commercial.performance?.bandwidth_saved_mb || 0) / 1024, 2) }} GB</span>
          </div>
        </div>
      </div>

      <!-- Traffic Analysis -->
      <div class="card traffic-card">
        <h2>🚀 Traffic Analysis</h2>
        <div class="traffic-bars">
          <div class="traffic-item">
            <label>Peak WITHOUT Cache:</label>
            <div class="bar-container">
              <div class="bar" :style="{ width: '100%', backgroundColor: '#ff5252' }"></div>
              <span class="bar-value">{{ formatNumber(commercial.traffic?.peak_without_cache_mbps || 0, 2) }} Mbps</span>
            </div>
          </div>
          <div class="traffic-item">
            <label>Peak WITH Cache:</label>
            <div class="bar-container">
              <div class="bar" :style="{ width: getPercentage() + '%', backgroundColor: '#4CAF50' }"></div>
              <span class="bar-value">{{ formatNumber(commercial.traffic?.peak_with_cache_mbps || 0, 2) }} Mbps</span>
            </div>
          </div>
          <div class="savings-indicator">
            <span class="icon">💵</span>
            You're saving {{ formatNumber(commercial.traffic?.reduction_percent || 0, 1) }}% on bandwidth costs!
          </div>
        </div>
      </div>

      <!-- Support Section -->
      <div class="card support-card">
        <h2>💬 Need Help?</h2>
        <p>Contact support for technical assistance</p>
        <button class="btn-support" @click="openSupport">Open Support Ticket</button>
      </div>

    </div>

    <!-- Error State -->
    <div v-else class="error-state">
      <p>Unable to load dashboard data</p>
      <button @click="loadData">Retry</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { ispsAPI } from '../api';
import { useAuthStore } from '../stores/auth';

export default {
  name: 'ISPDashboard',
  setup() {
    const authStore = useAuthStore();
    const loading = ref(true);
    const ispData = ref(null);
    const commercial = ref({});

    const loadData = async () => {
      loading.value = true;
      try {
        // Get current user's ISP ID from auth store
        const ispId = authStore.user?.isp_id || 1; // Fallback for testing
        
        // Load ISP data
        const ispResponse = await ispsAPI.get(ispId);
        ispData.value = ispResponse.data.data;
        
        // Load commercial metrics
        const commercialResponse = await ispsAPI.getCommercial(ispId);
        commercial.value = commercialResponse.data.data;
      } catch (error) {
        console.error('Failed to load ISP data:', error);
      } finally {
        loading.value = false;
      }
    };

    const formatNumber = (num, decimals = 0) => {
      if (!num && num !== 0) return '0';
      return Number(num).toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
    };

    const formatDate = (date) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString();
    };

    const getPercentage = () => {
      const without = commercial.value.traffic?.peak_without_cache_mbps || 0;
      const with_ = commercial.value.traffic?.peak_with_cache_mbps || 0;
      if (without === 0) return 0;
      return (with_ / without) * 100;
    };

    const openSupport = () => {
      alert('Support ticket system coming soon!');
    };

    onMounted(() => {
      loadData();
    });

    return {
      loading,
      ispData,
      commercial,
      loadData,
      formatNumber,
      formatDate,
      getPercentage,
      openSupport
    };
  }
};
</script>

<style scoped>
.isp-dashboard {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 30px;
  color: #333;
}

.loading, .error-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.server-info h2 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #333;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item label {
  font-size: 13px;
  color: #666;
  font-weight: 600;
}

.info-item span {
  font-size: 15px;
  color: #333;
}

.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.status-badge.active {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-badge.suspended {
  background: #fff3e0;
  color: #e65100;
}

.savings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
  padding: 30px 20px;
}

.stat-icon {
  font-size: 36px;
  margin-bottom: 12px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #4CAF50;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.metrics-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
}

.metric label {
  font-size: 13px;
  color: #666;
}

.metric .value {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.metric .value.success {
  color: #4CAF50;
}

.metric .value.highlight {
  color: #FF9800;
}

.traffic-bars {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.traffic-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.traffic-item label {
  font-size: 14px;
  font-weight: 600;
  color: #666;
}

.bar-container {
  position: relative;
  height: 40px;
  background: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}

.bar {
  height: 100%;
  transition: width 0.3s ease;
  display: flex;
  align-items: center;
  padding-left: 12px;
}

.bar-value {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.savings-indicator {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
}

.savings-indicator .icon {
  font-size: 24px;
  margin-right: 8px;
}

.support-card {
  text-align: center;
}

.btn-support {
  margin-top: 16px;
  padding: 12px 32px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.btn-support:hover {
  background: #1976D2;
}
</style>
