<template>
  <div class="licenses-page">
    <div class="page-header">
      <div>
        <h1>License Management</h1>
        <p>Manage ISP licenses and activation keys</p>
      </div>
      <button @click="showAddModal = true" class="btn-primary">
        🔑 Create License
      </button>
    </div>

    <!-- Table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>ISP</th>
            <th>License Key</th>
            <th>Status</th>
            <th>Expires</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="license in licenses" :key="license.id">
            <td>#{{ license.id }}</td>
            <td>{{ license.isp_name }}</td>
            <td><code>{{ license.license_key }}</code></td>
            <td>
              <span :class="['status-badge', license.is_active ? 'active' : 'revoked']">
                {{ license.is_active ? 'Active' : 'Revoked' }}
              </span>
            </td>
            <td>{{ formatDate(license.expires_at) }}</td>
            <td>{{ formatDate(license.created_at) }}</td>
            <td>
              <button v-if="license.is_active" @click="revokeLicense(license)" class="btn-sm red">
                Revoke
              </button>
              <button @click="copyKey(license.license_key)" class="btn-sm gray">
                Copy
              </button>
            </td>
          </tr>
          <tr v-if="licenses.length === 0">
            <td colspan="7" class="empty">No licenses created yet</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal">
        <h2>Create New License</h2>
        <form @submit.prevent="createLicense">
          <div class="form-group">
            <label>Select ISP</label>
            <select v-model="newLicense.isp_id" required>
              <option value="">Choose an ISP...</option>
              <option v-for="isp in isps" :key="isp.id" :value="isp.id">
                {{ isp.name }} ({{ isp.server_ip }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Valid for (days)</label>
            <input v-model.number="newLicense.days_valid" type="number" min="1" max="365" />
          </div>
          <div class="form-group">
            <label>Modules</label>
            <div class="checkbox-group">
              <label class="checkbox">
                <input type="checkbox" v-model="newLicense.modules" value="cache" /> Cache
              </label>
              <label class="checkbox">
                <input type="checkbox" v-model="newLicense.modules" value="https" /> HTTPS
              </label>
              <label class="checkbox">
                <input type="checkbox" v-model="newLicense.modules" value="monitoring" /> Monitoring
              </label>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showAddModal = false" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">Create License</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Success Modal -->
    <div v-if="createdLicense" class="modal-overlay" @click.self="createdLicense = null">
      <div class="modal success-modal">
        <h2>✅ License Created!</h2>
        <div class="license-display">
          <label>License Key:</label>
          <div class="license-key">
            <code>{{ createdLicense.license_key }}</code>
            <button @click="copyKey(createdLicense.license_key)" class="copy-btn">📋 Copy</button>
          </div>
        </div>
        <p class="expires-info">Expires: {{ createdLicense.expires_at }}</p>
        <button @click="createdLicense = null" class="btn-primary" style="width: 100%">Done</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { licensesAPI, ispsAPI } from '../api';

const licenses = ref([]);
const isps = ref([]);
const showAddModal = ref(false);
const createdLicense = ref(null);
const newLicense = ref({
  isp_id: '',
  days_valid: 30,
  modules: ['cache', 'https', 'monitoring'],
});

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const copyKey = (key) => {
  navigator.clipboard.writeText(key);
  alert('License key copied to clipboard!');
};

const fetchData = async () => {
  try {
    const [licensesRes, ispsRes] = await Promise.all([
      licensesAPI.getAll(),
      ispsAPI.getAll(),
    ]);
    licenses.value = licensesRes.data.data || [];
    isps.value = ispsRes.data.data || [];
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
};

const createLicense = async () => {
  try {
    const response = await licensesAPI.create({
      isp_id: Number(newLicense.value.isp_id),
      days_valid: newLicense.value.days_valid,
      modules: newLicense.value.modules,
    });
    createdLicense.value = response.data.data;
    showAddModal.value = false;
    newLicense.value = { isp_id: '', days_valid: 30, modules: ['cache', 'https', 'monitoring'] };
    fetchData();
  } catch (error) {
    alert(error.response?.data?.error || 'Failed to create license');
  }
};

const revokeLicense = async (license) => {
  if (confirm('Revoke this license? The ISP will lose access.')) {
    try {
      await licensesAPI.revoke(license.id);
      fetchData();
    } catch (error) {
      alert('Failed to revoke license');
    }
  }
};

onMounted(fetchData);
</script>

<style scoped>
.licenses-page {
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
  font-size: 12px;
  color: #60a5fa;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.active {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.status-badge.revoked {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.btn-sm {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  margin-right: 8px;
}

.btn-sm.red { background: #ef4444; color: white; }
.btn-sm.gray { background: #475569; color: white; }

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

.form-group input, .form-group select {
  width: 100%;
  padding: 12px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 14px;
}

.checkbox-group {
  display: flex;
  gap: 16px;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox input {
  width: auto;
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
  cursor: pointer;
}

/* Success Modal */
.success-modal {
  text-align: center;
}

.license-display {
  margin: 24px 0;
  text-align: left;
}

.license-key {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.license-key code {
  flex: 1;
  padding: 12px;
  font-size: 14px;
}

.copy-btn {
  padding: 12px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.expires-info {
  color: #94a3b8;
  margin-bottom: 24px;
}
</style>
