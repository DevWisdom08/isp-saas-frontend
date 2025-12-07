<template>
  <div class="distributors-page">
    <div class="page-header">
      <div>
        <h1>Distributors</h1>
        <p>Manage distributor partners</p>
      </div>
      <button @click="showAddModal = true" class="btn-primary">👥 Add Distributor</button>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Company</th>
            <th>Commission</th>
            <th>ISPs</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="dist in distributors" :key="dist.id">
            <td>#{{ dist.id }}</td>
            <td>{{ dist.full_name }}</td>
            <td>{{ dist.email }}</td>
            <td>{{ dist.company_name || '-' }}</td>
            <td>{{ dist.commission_percent }}%</td>
            <td>{{ dist.total_isps }}</td>
            <td>
              <span :class="['status-badge', dist.is_active ? 'active' : 'inactive']">
                {{ dist.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
          </tr>
          <tr v-if="distributors.length === 0">
            <td colspan="7" class="empty">No distributors yet</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal">
        <h2>Add Distributor</h2>
        <form @submit.prevent="createDistributor">
          <div class="form-group">
            <label>Full Name</label>
            <input v-model="newDist.full_name" type="text" required />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input v-model="newDist.email" type="email" required />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input v-model="newDist.password" type="password" required />
          </div>
          <div class="form-group">
            <label>Company Name</label>
            <input v-model="newDist.company_name" type="text" />
          </div>
          <div class="form-group">
            <label>Commission (%)</label>
            <input v-model.number="newDist.commission_percent" type="number" min="0" max="100" />
          </div>
          <div class="modal-actions">
            <button type="button" @click="showAddModal = false" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">Create</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { distributorsAPI } from '../api';

const distributors = ref([]);
const showAddModal = ref(false);
const newDist = ref({ full_name: '', email: '', password: '', company_name: '', commission_percent: 10 });

const fetchData = async () => {
  try {
    const res = await distributorsAPI.getAll();
    distributors.value = res.data.data || [];
  } catch (error) {
    console.error('Failed to fetch:', error);
  }
};

const createDistributor = async () => {
  try {
    await distributorsAPI.create(newDist.value);
    showAddModal.value = false;
    newDist.value = { full_name: '', email: '', password: '', company_name: '', commission_percent: 10 };
    fetchData();
  } catch (error) {
    alert(error.response?.data?.error || 'Failed to create');
  }
};

onMounted(fetchData);
</script>

<style scoped>
.distributors-page { max-width: 1400px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-header h1 { font-size: 28px; margin-bottom: 4px; }
.page-header p { color: #94a3b8; }
.btn-primary { padding: 12px 24px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
.table-container { background: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 16px; text-align: left; border-bottom: 1px solid #334155; }
th { background: #0f172a; font-weight: 600; color: #94a3b8; font-size: 14px; text-transform: uppercase; }
.status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.status-badge.active { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
.status-badge.inactive { background: rgba(239, 68, 68, 0.2); color: #f87171; }
.empty { text-align: center; color: #64748b; padding: 40px !important; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: #1e293b; padding: 32px; border-radius: 16px; width: 100%; max-width: 500px; border: 1px solid #334155; }
.modal h2 { margin-bottom: 24px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; margin-bottom: 8px; color: #e2e8f0; font-weight: 500; }
.form-group input { width: 100%; padding: 12px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #e2e8f0; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
.btn-secondary { padding: 12px 24px; background: #334155; color: white; border: none; border-radius: 8px; cursor: pointer; }
</style>
