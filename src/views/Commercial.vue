<template>
  <div class="commercial-dashboard">
    <h1>💰 Commercial Dashboard - ROI Calculator</h1>
    
    <!-- ISP Selector -->
    <div class="isp-selector">
      <label>Select ISP:</label>
      <select v-model="selectedISPId" @change="loadCommercialData">
        <option value="">-- Select ISP --</option>
        <option v-for="isp in isps" :key="isp.id" :value="isp.id">
          {{ isp.name }}
        </option>
      </select>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">Loading commercial data...</div>

    <!-- Commercial Data Display -->
    <div v-else-if="commercialData" class="commercial-content">
      
      <!-- Configuration Card -->
      <div class="card config-card">
        <h2>⚙️ Configuration</h2>
        <div class="config-form">
          <div class="form-group">
            <label>Cost per Mbps (USD):</label>
            <input 
              type="number" 
              v-model.number="config.cost_per_mbps" 
              step="0.01"
              placeholder="Enter cost per Mbps"
            />
          </div>
          <div class="form-group">
            <label>Peak Traffic Baseline (Mbps):</label>
            <input 
              type="number" 
              v-model.number="config.peak_traffic_mbps"
              placeholder="Enter peak traffic without cache"
            />
          </div>
          <button @click="updateConfig" class="btn-primary">Update Configuration</button>
        </div>
      </div>

      <!-- Savings Summary -->
      <div class="savings-summary">
        <div class="card savings-card">
          <h3>💰 Monthly Savings</h3>
          <div class="amount">${{ formatNumber(commercialData.savings.monthly_usd) }}</div>
          <div class="subtitle">Per month</div>
        </div>
        
        <div class="card savings-card">
          <h3>📅 Annual Savings</h3>
          <div class="amount">${{ formatNumber(commercialData.savings.annual_usd) }}</div>
          <div class="subtitle">Per year</div>
        </div>
        
        <div class="card savings-card">
          <h3>🎯 ROI Period</h3>
          <div class="amount">{{ formatNumber(commercialData.savings.roi_months, 1) }}</div>
          <div class="subtitle">Months to break even</div>
        </div>
        
        <div class="card savings-card">
          <h3>📊 Hit Rate</h3>
          <div class="amount">{{ formatNumber(commercialData.performance.hit_rate_percent, 1) }}%</div>
          <div class="subtitle">Cache effectiveness</div>
        </div>
      </div>

      <!-- Traffic Analysis -->
      <div class="card traffic-card">
        <h2>🚀 Traffic Analysis</h2>
        <div class="traffic-comparison">
          <div class="traffic-item">
            <div class="label">Peak WITHOUT Cache:</div>
            <div class="value">{{ formatNumber(commercialData.traffic.peak_without_cache_mbps, 2) }} Mbps</div>
          </div>
          <div class="traffic-item">
            <div class="label">Peak WITH Cache:</div>
            <div class="value success">{{ formatNumber(commercialData.traffic.peak_with_cache_mbps, 2) }} Mbps</div>
          </div>
          <div class="traffic-item">
            <div class="label">Bandwidth Saved:</div>
            <div class="value highlight">{{ formatNumber(commercialData.traffic.bandwidth_saved_mbps, 2) }} Mbps</div>
          </div>
          <div class="traffic-item">
            <div class="label">Reduction:</div>
            <div class="value highlight">{{ formatNumber(commercialData.traffic.reduction_percent, 1) }}%</div>
          </div>
        </div>
      </div>

      <!-- Performance Metrics -->
      <div class="card performance-card">
        <h2>📈 Performance Metrics</h2>
        <div class="metrics-grid">
          <div class="metric">
            <div class="metric-label">Cache Hits</div>
            <div class="metric-value">{{ formatNumber(commercialData.performance.cache_hits) }}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Cache Misses</div>
            <div class="metric-value">{{ formatNumber(commercialData.performance.cache_misses) }}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Total Requests</div>
            <div class="metric-value">{{ formatNumber(commercialData.performance.total_requests) }}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Data Cached</div>
            <div class="metric-value">{{ formatNumber(commercialData.performance.bandwidth_saved_mb / 1024, 2) }} GB</div>
          </div>
        </div>
      </div>

    </div>

    <!-- No Data State -->
    <div v-else class="no-data">
      <p>Select an ISP to view commercial metrics</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { ispsAPI } from '../api';

export default {
  name: 'Commercial',
  setup() {
    const isps = ref([]);
    const selectedISPId = ref('');
    const commercialData = ref(null);
    const loading = ref(false);
    const config = ref({
      cost_per_mbps: 0,
      peak_traffic_mbps: 0
    });

    const loadISPs = async () => {
      try {
        const response = await ispsAPI.getAll();
        isps.value = response.data.data || [];
      } catch (error) {
        console.error('Failed to load ISPs:', error);
      }
    };

    const loadCommercialData = async () => {
      if (!selectedISPId.value) return;
      
      loading.value = true;
      try {
        const response = await ispsAPI.getCommercial(selectedISPId.value);
        commercialData.value = response.data.data;
        
        // Populate config form
        config.value = {
          cost_per_mbps: commercialData.value.config.cost_per_mbps,
          peak_traffic_mbps: commercialData.value.config.peak_traffic_baseline
        };
      } catch (error) {
        console.error('Failed to load commercial data:', error);
        alert('Failed to load commercial data');
      } finally {
        loading.value = false;
      }
    };

    const updateConfig = async () => {
      if (!selectedISPId.value) return;
      
      try {
        await ispsAPI.updateCommercialConfig(selectedISPId.value, config.value);
        alert('Configuration updated successfully!');
        await loadCommercialData(); // Reload data
      } catch (error) {
        console.error('Failed to update config:', error);
        alert('Failed to update configuration');
      }
    };

    const formatNumber = (num, decimals = 0) => {
      if (!num && num !== 0) return '0';
      return Number(num).toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
    };

    onMounted(() => {
      loadISPs();
    });

    return {
      isps,
      selectedISPId,
      commercialData,
      loading,
      config,
      loadCommercialData,
      updateConfig,
      formatNumber
    };
  }
};
</script>

<style scoped>
.commercial-dashboard {
  padding: 20px;
}

h1 {
  color: #e2e8f0;
  margin-bottom: 30px;
}

.isp-selector {
  margin-bottom: 30px;
  padding: 20px;
  background: #1e293b;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
}

.isp-selector label {
  font-weight: 600;
  margin-right: 10px;
  color: #e2e8f0;
  font-size: 15px;
}

.isp-selector select {
  padding: 10px 15px;
  border: 2px solid #475569;
  border-radius: 8px;
  font-size: 15px;
  min-width: 250px;
  background: #0f172a;
  color: #e2e8f0;
  cursor: pointer;
}

.loading, .no-data {
  text-align: center;
  padding: 40px;
  color: #94a3b8;
  font-size: 16px;
}

.card {
  background: #1e293b;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
  border: 1px solid #334155;
}

.card h2 {
  color: #e2e8f0;
  margin: 0 0 20px 0;
  font-size: 20px;
}

.card h3 {
  color: #94a3b8;
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.config-card .config-form {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 20px;
  align-items: end;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 14px;
  color: #cbd5e1;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 2px solid #475569;
  border-radius: 8px;
  font-size: 15px;
  background: #0f172a;
  color: #e2e8f0;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
}

.btn-primary {
  padding: 12px 24px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 15px;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.savings-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.savings-card {
  text-align: center;
  padding: 30px 20px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
}

.savings-card .amount {
  font-size: 40px;
  font-weight: bold;
  color: #10b981;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
}

.savings-card .subtitle {
  font-size: 14px;
  color: #94a3b8;
}

.traffic-comparison {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}

.traffic-item {
  padding: 20px;
  background: #0f172a;
  border-radius: 10px;
  border: 1px solid #334155;
}

.traffic-item .label {
  font-size: 14px;
  color: #94a3b8;
  margin-bottom: 10px;
  font-weight: 600;
}

.traffic-item .value {
  font-size: 24px;
  font-weight: bold;
  color: #e2e8f0;
}

.traffic-item .value.success {
  color: #10b981;
}

.traffic-item .value.highlight {
  color: #f59e0b;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
}

.metric {
  text-align: center;
  padding: 20px;
  background: #0f172a;
  border-radius: 10px;
  border: 1px solid #334155;
}

.metric-label {
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  font-size: 28px;
  font-weight: bold;
  color: #e2e8f0;
}
</style>
