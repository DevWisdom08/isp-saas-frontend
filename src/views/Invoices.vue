<template>
  <div class="invoices-page">
    <div class="page-header">
      <div>
        <h1>Invoices & Billing</h1>
        <p>Manage payment invoices</p>
      </div>
      <div class="header-actions">
        <button @click="checkOverdue" class="btn-secondary">⚠️ Check Overdue</button>
        <button @click="showAddModal = true" class="btn-primary">📄 Create Invoice</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="mini-stats">
      <div class="mini-stat">
        <span class="mini-value">${{ totalPaid.toFixed(2) }}</span>
        <span class="mini-label">Total Paid</span>
      </div>
      <div class="mini-stat">
        <span class="mini-value yellow">${{ totalPending.toFixed(2) }}</span>
        <span class="mini-label">Pending</span>
      </div>
      <div class="mini-stat">
        <span class="mini-value red">${{ totalOverdue.toFixed(2) }}</span>
        <span class="mini-label">Overdue</span>
      </div>
    </div>

    <!-- Table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>ISP</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Due Date</th>
            <th>Paid At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="invoice in invoices" :key="invoice.id">
            <td>#INV-{{ invoice.id }}</td>
            <td>{{ invoice.isp_name }}</td>
            <td class="amount">${{ Number(invoice.amount).toFixed(2) }}</td>
            <td>
              <span :class="['status-badge', invoice.status]">{{ invoice.status }}</span>
            </td>
            <td>{{ formatDate(invoice.due_date) }}</td>
            <td>{{ invoice.paid_at ? formatDate(invoice.paid_at) : '-' }}</td>
            <td>
              <button v-if="invoice.status === 'pending'" @click="markPaid(invoice)" class="btn-sm green">
                Mark Paid
              </button>
            </td>
          </tr>
          <tr v-if="invoices.length === 0">
            <td colspan="7" class="empty">No invoices yet</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal">
        <h2>Create Invoice</h2>
        <form @submit.prevent="createInvoice">
          <div class="form-group">
            <label>Select ISP</label>
            <select v-model="newInvoice.isp_id" required>
              <option value="">Choose an ISP...</option>
              <option v-for="isp in isps" :key="isp.id" :value="isp.id">
                {{ isp.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Amount ($)</label>
            <input v-model.number="newInvoice.amount" type="number" step="0.01" min="0" required />
          </div>
          <div class="form-group">
            <label>Due in (days)</label>
            <input v-model.number="newInvoice.due_days" type="number" min="1" />
          </div>
          <div class="modal-actions">
            <button type="button" @click="showAddModal = false" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">Create Invoice</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { invoicesAPI, ispsAPI } from '../api';

const invoices = ref([]);
const isps = ref([]);
const showAddModal = ref(false);
const newInvoice = ref({ isp_id: '', amount: 0, due_days: 30 });

const totalPaid = computed(() => invoices.value.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0));
const totalPending = computed(() => invoices.value.filter(i => i.status === 'pending').reduce((sum, i) => sum + Number(i.amount), 0));
const totalOverdue = computed(() => invoices.value.filter(i => i.status === 'overdue').reduce((sum, i) => sum + Number(i.amount), 0));

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const fetchData = async () => {
  try {
    const [invRes, ispsRes] = await Promise.all([invoicesAPI.getAll(), ispsAPI.getAll()]);
    invoices.value = invRes.data.data || [];
    isps.value = ispsRes.data.data || [];
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
};

const createInvoice = async () => {
  try {
    await invoicesAPI.create({ isp_id: Number(newInvoice.value.isp_id), amount: newInvoice.value.amount, due_days: newInvoice.value.due_days });
    showAddModal.value = false;
    newInvoice.value = { isp_id: '', amount: 0, due_days: 30 };
    fetchData();
  } catch (error) {
    alert(error.response?.data?.error || 'Failed to create invoice');
  }
};

const markPaid = async (invoice) => {
  try {
    await invoicesAPI.markPaid(invoice.id);
    fetchData();
  } catch (error) {
    alert('Failed to mark as paid');
  }
};

const checkOverdue = async () => {
  try {
    const res = await invoicesAPI.checkOverdue();
    alert(`Checked! ${res.data.data?.invoices_marked_overdue || 0} invoices marked overdue.`);
    fetchData();
  } catch (error) {
    alert('Failed to check overdue');
  }
};

onMounted(fetchData);
</script>

<style scoped>
.invoices-page { max-width: 1400px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-header h1 { font-size: 28px; margin-bottom: 4px; }
.page-header p { color: #94a3b8; }
.header-actions { display: flex; gap: 12px; }
.btn-primary { padding: 12px 24px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
.btn-secondary { padding: 12px 24px; background: #334155; color: white; border: none; border-radius: 8px; cursor: pointer; }
.mini-stats { display: flex; gap: 20px; margin-bottom: 24px; }
.mini-stat { background: #1e293b; padding: 16px 24px; border-radius: 8px; border: 1px solid #334155; }
.mini-value { display: block; font-size: 24px; font-weight: 700; }
.mini-value.yellow { color: #facc15; }
.mini-value.red { color: #f87171; }
.mini-label { color: #94a3b8; font-size: 14px; }
.table-container { background: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 16px; text-align: left; border-bottom: 1px solid #334155; }
th { background: #0f172a; font-weight: 600; color: #94a3b8; font-size: 14px; text-transform: uppercase; }
.amount { font-weight: 600; color: #4ade80; }
.status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: capitalize; }
.status-badge.paid { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
.status-badge.pending { background: rgba(234, 179, 8, 0.2); color: #facc15; }
.status-badge.overdue { background: rgba(239, 68, 68, 0.2); color: #f87171; }
.btn-sm { padding: 6px 12px; border: none; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; }
.btn-sm.green { background: #22c55e; color: white; }
.empty { text-align: center; color: #64748b; padding: 40px !important; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: #1e293b; padding: 32px; border-radius: 16px; width: 100%; max-width: 500px; border: 1px solid #334155; }
.modal h2 { margin-bottom: 24px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; margin-bottom: 8px; color: #e2e8f0; font-weight: 500; }
.form-group input, .form-group select { width: 100%; padding: 12px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #e2e8f0; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
</style>
