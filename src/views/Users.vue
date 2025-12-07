<template>
  <div class="users-page">
    <div class="page-header">
      <div>
        <h1>User Management</h1>
        <p>Manage system users</p>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Email</th>
            <th>Name</th>
            <th>Role</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>#{{ user.id }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.full_name || '-' }}</td>
            <td>
              <span :class="['role-badge', user.role]">{{ user.role }}</span>
            </td>
            <td>
              <span :class="['status-badge', user.is_active ? 'active' : 'inactive']">
                {{ user.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>{{ formatDate(user.created_at) }}</td>
            <td>
              <button @click="deleteUser(user)" class="btn-sm red" :disabled="user.id === 1">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { usersAPI } from '../api';

const users = ref([]);

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const fetchUsers = async () => {
  try {
    const res = await usersAPI.getAll();
    users.value = res.data.data || [];
  } catch (error) {
    console.error('Failed to fetch:', error);
  }
};

const deleteUser = async (user) => {
  if (confirm(`Delete ${user.email}?`)) {
    try {
      await usersAPI.delete(user.id);
      fetchUsers();
    } catch (error) {
      alert('Failed to delete user');
    }
  }
};

onMounted(fetchUsers);
</script>

<style scoped>
.users-page { max-width: 1400px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-header h1 { font-size: 28px; margin-bottom: 4px; }
.page-header p { color: #94a3b8; }
.table-container { background: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 16px; text-align: left; border-bottom: 1px solid #334155; }
th { background: #0f172a; font-weight: 600; color: #94a3b8; font-size: 14px; text-transform: uppercase; }
.role-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: capitalize; }
.role-badge.admin { background: rgba(139, 92, 246, 0.2); color: #a78bfa; }
.role-badge.distributor { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
.role-badge.isp { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
.status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.status-badge.active { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
.status-badge.inactive { background: rgba(239, 68, 68, 0.2); color: #f87171; }
.btn-sm { padding: 6px 12px; border: none; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; }
.btn-sm.red { background: #ef4444; color: white; }
.btn-sm:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
