<template>
  <div class="distributor-dashboard">
    <h1>👥 Distributor Dashboard</h1>
    
    <!-- Stats Overview -->
    <div class="stats-grid">
      <div class="card stat-card">
        <div class="stat-icon">🖥️</div>
        <div class="stat-value">{{ myISPs.length }}</div>
        <div class="stat-label">My ISP Clients</div>
      </div>
      
      <div class="card stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-value">${{ formatNumber(totalRevenue) }}</div>
        <div class="stat-label">Monthly Revenue</div>
      </div>
      
      <div class="card stat-card">
        <div class="stat-icon">💵</div>
        <div class="stat-value">${{ formatNumber(myCommission) }}</div>
        <div class="stat-label">My Commission</div>
      </div>
      
      <div class="card stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-value">{{ activeISPs }}</div>
        <div class="stat-label">Active ISPs</div>
      </div>
    </div>

    <!-- Actions -->
    <div class="actions-bar">
      <button class="btn-primary" @click="showAddISP = true">
        ➕ Add New ISP Client
      </button>
    </div>

    <!-- My ISPs List -->
    <div class="card isps-list">
      <h2>📋 My ISP Clients</h2>
      
      <div v-if="loading" class="loading">Loading...</div>
      
      <table v-else-if="myISPs.length > 0">
        <thead>
          <tr>
            <th>ISP Name</th>
            <th>Server IP</th>
            <th>Status</th>
            <th>Monthly Plan</th>
            <th>Cache Performance</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="isp in myISPs" :key="isp.id">
            <td><strong>{{ isp.name }}</strong></td>
            <td><code>{{ isp.server_ip }}</code></td>
            <td>
              <span :class="['badge', isp.status]">
                {{ isp.status }}
              </span>
            </td>
            <td>${{ isp.monthly_fee || 299 }}/mo</td>
            <td>
              <div class="performance-bar">
                <div class="bar" :style="{ width: getHitRate(isp) + '%' }"></div>
                <span>{{ getHitRate(isp) }}%</span>
              </div>
            </td>
            <td>
              <button class="btn-small" @click="viewDetails(isp)">View</button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-else class="empty-state">
        <p>No ISP clients yet. Add your first one!</p>
      </div>
    </div>

    <!-- Add ISP Modal -->
    <div v-if="showAddISP" class="modal-overlay" @click="showAddISP = false">
      <div class="modal" @click.stop>
        <h2>➕ Add New ISP Client</h2>
        <form @submit.prevent="addISP">
          <div class="form-group">
            <label>ISP Name:</label>
            <input v-model="newISP.name" required placeholder="Enter ISP name" />
          </div>
          <div class="form-group">
            <label>Contact Email:</label>
            <input v-model="newISP.email" type="email" required placeholder="email@example.com" />
          </div>
          <div class="form-group">
            <label>Server IP:</label>
            <input v-model="newISP.server_ip" required placeholder="192.168.1.100" />
          </div>
          <div class="form-group">
            <label>Monthly Plan:</label>
            <select v-model="newISP.plan_id">
              <option value="1">Basic - $299/mo</option>
              <option value="2">Professional - $599/mo</option>
              <option value="3">Enterprise - $1299/mo</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="button" @click="showAddISP = false" class="btn-cancel">Cancel</button>
            <button type="submit" class="btn-primary">Create ISP</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { ispsAPI, distributorsAPI } from '../api';
import { useAuthStore } from '../stores/auth';

export default {
  name: 'DistributorDashboard',
  setup() {
    const authStore = useAuthStore();
    const loading = ref(true);
    const myISPs = ref([]);
    const showAddISP = ref(false);
    const newISP = ref({
      name: '',
      email: '',
      server_ip: '',
      plan_id: 1
    });

    const totalRevenue = computed(() => {
      return myISPs.value.reduce((sum, isp) => sum + (isp.monthly_fee || 299), 0);
    });

    const myCommission = computed(() => {
      // Assuming 15% commission
      return totalRevenue.value * 0.15;
    });

    const activeISPs = computed(() => {
      return myISPs.value.filter(isp => isp.status === 'active').length;
    });

    const loadMyISPs = async () => {
      loading.value = true;
      try {
        const distributorId = authStore.user?.distributor_id || 1;
        const response = await distributorsAPI.getISPs(distributorId);
        myISPs.value = response.data.data || [];
      } catch (error) {
        console.error('Failed to load ISPs:', error);
      } finally {
        loading.value = false;
      }
    };

    const addISP = async () => {
      try {
        await ispsAPI.create({
          ...newISP.value,
          distributor_id: authStore.user?.distributor_id || 1
        });
        showAddISP.value = false;
        newISP.value = { name: '', email: '', server_ip: '', plan_id: 1 };
        await loadMyISPs();
        alert('ISP created successfully!');
      } catch (error) {
        console.error('Failed to create ISP:', error);
        alert('Failed to create ISP');
      }
    };

    const getHitRate = (isp) => {
      // Mock data - replace with real telemetry
      return Math.floor(Math.random() * 30) + 70; // 70-100%
    };

    const viewDetails = (isp) => {
      alert(`View details for ${isp.name} - Coming soon!`);
    };

    const formatNumber = (num) => {
      return Number(num || 0).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    };

    onMounted(() => {
      loadMyISPs();
    });

    return {
      loading,
      myISPs,
      showAddISP,
      newISP,
      totalRevenue,
      myCommission,
      activeISPs,
      addISP,
      getHitRate,
      viewDetails,
      formatNumber
    };
  }
};
</script>

<style scoped>
.distributor-dashboard {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 30px;
  color: #333;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.stat-card {
  text-align: center;
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

.actions-bar {
  margin-bottom: 24px;
}

.btn-primary {
  padding: 12px 24px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover {
  background: #45a049;
}

.isps-list h2 {
  margin: 0 0 20px 0;
  font-size: 18px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  text-align: left;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

th {
  font-weight: 600;
  color: #666;
  font-size: 13px;
  text-transform: uppercase;
}

.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.badge.active {
  background: #e8f5e9;
  color: #2e7d32;
}

.badge.suspended {
  background: #ffebee;
  color: #c62828;
}

.performance-bar {
  position: relative;
  width: 100px;
  height: 24px;
  background: #f0f0f0;
  border-radius: 12px;
  overflow: hidden;
}

.performance-bar .bar {
  height: 100%;
  background: #4CAF50;
  transition: width 0.3s;
}

.performance-bar span {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  font-weight: 600;
  color: #333;
}

.btn-small {
  padding: 6px 12px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
}

.loading, .empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
}

.modal h2 {
  margin: 0 0 24px 0;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 14px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn-cancel {
  padding: 10px 20px;
  background: #f5f5f5;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
</style>
