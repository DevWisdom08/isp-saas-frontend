<template>
  <div class="settings-page">
    <div class="page-header">
      <div>
        <h1>System Settings</h1>
        <p>Configure platform settings</p>
      </div>
    </div>

    <div class="settings-grid">
      <div v-for="setting in settings" :key="setting.id" class="setting-card">
        <div class="setting-info">
          <h3>{{ formatKey(setting.key) }}</h3>
          <p>{{ setting.description }}</p>
        </div>
        <div class="setting-input">
          <input 
            v-model="setting.value" 
            :type="getInputType(setting.key)"
            @blur="updateSetting(setting)"
          />
        </div>
      </div>
    </div>

    <div class="settings-section">
      <h2>System Information</h2>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">API Version</span>
          <span class="info-value">1.0.0</span>
        </div>
        <div class="info-item">
          <span class="info-label">Server</span>
          <span class="info-value">64.23.151.140</span>
        </div>
        <div class="info-item">
          <span class="info-label">Database</span>
          <span class="info-value">PostgreSQL 14</span>
        </div>
        <div class="info-item">
          <span class="info-label">Platform</span>
          <span class="info-value">Ubuntu 22.04 LTS</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { settingsAPI } from '../api';

const settings = ref([]);

const formatKey = (key) => {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const getInputType = (key) => {
  if (key.includes('days') || key.includes('max')) return 'number';
  if (key === 'maintenance_mode') return 'text';
  return 'text';
};

const fetchSettings = async () => {
  try {
    const res = await settingsAPI.getAll();
    settings.value = res.data.data || [];
  } catch (error) {
    console.error('Failed to fetch:', error);
  }
};

const updateSetting = async (setting) => {
  try {
    await settingsAPI.update(setting.key, setting.value);
  } catch (error) {
    alert('Failed to update setting');
  }
};

onMounted(fetchSettings);
</script>

<style scoped>
.settings-page { max-width: 1000px; margin: 0 auto; }
.page-header { margin-bottom: 32px; }
.page-header h1 { font-size: 28px; margin-bottom: 4px; }
.page-header p { color: #94a3b8; }

.settings-grid { display: flex; flex-direction: column; gap: 12px; margin-bottom: 40px; }
.setting-card { display: flex; justify-content: space-between; align-items: center; background: #1e293b; padding: 20px 24px; border-radius: 12px; border: 1px solid #334155; }
.setting-info h3 { font-size: 16px; margin-bottom: 4px; }
.setting-info p { color: #94a3b8; font-size: 14px; }
.setting-input input { padding: 10px 16px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #e2e8f0; width: 200px; text-align: right; }
.setting-input input:focus { outline: none; border-color: #3b82f6; }

.settings-section { background: #1e293b; padding: 24px; border-radius: 12px; border: 1px solid #334155; }
.settings-section h2 { margin-bottom: 20px; font-size: 20px; }
.info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.info-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #334155; }
.info-label { color: #94a3b8; }
.info-value { font-weight: 600; color: #60a5fa; }
</style>
