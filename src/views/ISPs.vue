<template>
  <div class="isps-page">
    <div class="page-header">
      <div>
        <h1>ISP Management</h1>
        <p>Manage all registered ISP servers</p>
      </div>
      <button @click="showAddModal = true" class="btn-primary">
        ➕ Add New ISP
      </button>
    </div>

    <!-- Stats -->
    <div class="mini-stats">
      <div class="mini-stat">
        <span class="mini-value">{{ isps.length }}</span>
        <span class="mini-label">Total</span>
      </div>
      <div class="mini-stat">
        <span class="mini-value green">{{ isps.filter(i => i.status === 'active').length }}</span>
        <span class="mini-label">Active</span>
      </div>
      <div class="mini-stat">
        <span class="mini-value red">{{ isps.filter(i => i.status === 'suspended').length }}</span>
        <span class="mini-label">Suspended</span>
      </div>
    </div>

    <!-- Table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Server IP</th>
            <th>Hardware ID</th>
            <th>Status</th>
            <th>Cache Size</th>
            <th>Bandwidth</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="isp in isps" :key="isp.id">
            <td>#{{ isp.id }}</td>
            <td>{{ isp.name }}</td>
            <td><code>{{ isp.server_ip }}</code></td>
            <td><code class="hw-id">{{ isp.hw_id?.substring(0, 12) }}...</code></td>
            <td>
              <span :class="['status-badge', isp.status]">{{ isp.status }}</span>
            </td>
            <td>{{ isp.cache_size_gb }} GB</td>
            <td>{{ isp.bandwidth_limit_mbps }} Mbps</td>
            <td class="actions">
              <button v-if="isp.status === 'active'" @click="suspendISP(isp)" class="btn-sm red">
                Suspend
              </button>
              <button v-else @click="activateISP(isp)" class="btn-sm green">
                Activate
              </button>
              <button @click="deleteISP(isp)" class="btn-sm gray">
                Delete
              </button>
            </td>
          </tr>
          <tr v-if="isps.length === 0">
            <td colspan="8" class="empty">No ISPs registered yet</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal">
        <h2>Add New ISP</h2>
        <form @submit.prevent="addISP">
          <div class="form-group">
            <label>Name</label>
            <input v-model="newISP.name" type="text" placeholder="ISP Name" required />
          </div>
          <div class="form-group">
            <label>Server IP</label>
            <input v-model="newISP.server_ip" type="text" placeholder="192.168.1.1" required />
          </div>
          <div class="form-group">
            <label>Hardware ID</label>
            <input v-model="newISP.hw_id" type="text" placeholder="Unique hardware identifier" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Cache Size (GB)</label>
              <input v-model.number="newISP.cache_size_gb" type="number" min="1" />
            </div>
            <div class="form-group">
              <label>Bandwidth (Mbps)</label>
              <input v-model.number="newISP.bandwidth_limit_mbps" type="number" min="100" />
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showAddModal = false" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">Add ISP</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ispsAPI } from '../api';

const isps = ref([]);
const showAddModal = ref(false);
const newISP = ref({
  name: '',
  server_ip: '',
  hw_id: '',
  cache_size_gb: 10,
  bandwidth_limit_mbps: 1000,
});

const fetchISPs = async () => {
  try {
    const response = await ispsAPI.getAll();
    isps.value = response.data.data || [];
  } catch (error) {
    console.error('Failed to fetch ISPs:', error);
  }
};

const addISP = async () => {
  try {
    await ispsAPI.create(newISP.value);
    showAddModal.value = false;
    newISP.value = { name: '', server_ip: '', hw_id: '', cache_size_gb: 10, bandwidth_limit_mbps: 1000 };
    fetchISPs();
  } catch (error) {
    alert(error.response?.data?.error || 'Failed to add ISP');
  }
};

const suspendISP = async (isp) => {
  if (confirm(`Suspend ${isp.name}?`)) {
    try {
      await ispsAPI.suspend(isp.id);
      fetchISPs();
    } catch (error) {
      alert('Failed to suspend ISP');
    }
  }
};

const activateISP = async (isp) => {
  try {
    await ispsAPI.activate(isp.id);
    fetchISPs();
  } catch (error) {
    alert('Failed to activate ISP');
  }
};

const deleteISP = async (isp) => {
  if (confirm(`Delete ${isp.name}? This cannot be undone.`)) {
    try {
      await ispsAPI.delete(isp.id);
      fetchISPs();
    } catch (error) {
      alert('Failed to delete ISP');
    }
  }
};

onMounted(fetchISPs);
</script>

<style scoped>
.isps-page {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 28px;
  margin-bottom: 4px;
}

.page-header p {
  color: #94a3b8;
}

.btn-primary {
  padding: 12px 24px;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
}

.mini-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
}

.mini-stat {
  background: #1e293b;
  padding: 16px 24px;
  border-radius: 8px;
  border: 1px solid #334155;
}

.mini-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
}

.mini-value.green { color: #4ade80; }
.mini-value.red { color: #f87171; }

.mini-label {
  color: #94a3b8;
  font-size: 14px;
}

.table-container {
  background: #1e293b;
  border-radius: 12px;
  border: 1px solid #334155;
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #334155;
}

th {
  background: #0f172a;
  font-weight: 600;
  color: #94a3b8;
  font-size: 14px;
  text-transform: uppercase;
}

code {
  background: #0f172a;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
}

.hw-id {
  color: #94a3b8;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
}

.status-badge.active {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.status-badge.suspended {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn-sm {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-sm:hover {
  opacity: 0.8;
}

.btn-sm.green {
  background: #22c55e;
  color: white;
}

.btn-sm.red {
  background: #ef4444;
  color: white;
}

.btn-sm.gray {
  background: #475569;
  color: white;
}

.empty {
  text-align: center;
  color: #64748b;
  padding: 40px !important;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #1e293b;
  padding: 32px;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  border: 1px solid #334155;
}

.modal h2 {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #e2e8f0;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 14px;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn-secondary {
  padding: 12px 24px;
  background: #334155;
  color: #e2e8f0;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}
</style>
