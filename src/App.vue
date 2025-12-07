<template>
  <div class="app-container">
    <!-- Sidebar -->
    <aside v-if="authStore.isAuthenticated" class="sidebar">
      <div class="logo">
        <h1>ISP SaaS</h1>
        <span class="version">v1.0.0</span>
      </div>
      
      <nav class="nav-menu">
        <router-link to="/" class="nav-item">
          <span class="icon">📊</span>
          Dashboard
        </router-link>
        <router-link to="/isps" class="nav-item">
          <span class="icon">🖥️</span>
          ISPs
        </router-link>
        <router-link to="/licenses" class="nav-item">
          <span class="icon">🔑</span>
          Licenses
        </router-link>
        <router-link to="/invoices" class="nav-item">
          <span class="icon">💰</span>
          Invoices
        </router-link>
        <router-link v-if="authStore.isAdmin" to="/distributors" class="nav-item">
          <span class="icon">👥</span>
          Distributors
        </router-link>
        <router-link v-if="authStore.isAdmin" to="/users" class="nav-item">
          <span class="icon">👤</span>
          Users
        </router-link>
        <router-link v-if="authStore.isAdmin" to="/logs" class="nav-item">
          <span class="icon">📝</span>
          Logs
        </router-link>
        <router-link v-if="authStore.isAdmin" to="/settings" class="nav-item">
          <span class="icon">⚙️</span>
          Settings
        </router-link>
      </nav>

      <div class="user-info">
        <div class="user-details">
          <span class="user-name">{{ authStore.user?.full_name || authStore.user?.email }}</span>
          <span class="user-role">{{ authStore.user?.role }}</span>
        </div>
        <button @click="logout" class="logout-btn">Logout</button>
      </div>
    </aside>

    <!-- Main Content -->
    <main :class="{ 'with-sidebar': authStore.isAuthenticated }">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from './stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

// Check auth on load
authStore.checkAuth();

const logout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #0f172a;
  color: #e2e8f0;
  min-height: 100vh;
}

.app-container {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 260px;
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  border-right: 1px solid #334155;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  z-index: 100;
}

.logo {
  padding: 24px;
  border-bottom: 1px solid #334155;
  text-align: center;
}

.logo h1 {
  font-size: 24px;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo .version {
  font-size: 12px;
  color: #64748b;
}

.nav-menu {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: #94a3b8;
  text-decoration: none;
  border-radius: 8px;
  margin-bottom: 4px;
  transition: all 0.2s;
}

.nav-item:hover {
  background: #1e293b;
  color: #e2e8f0;
}

.nav-item.router-link-active {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
}

.nav-item .icon {
  font-size: 18px;
}

.user-info {
  padding: 16px;
  border-top: 1px solid #334155;
}

.user-details {
  margin-bottom: 12px;
}

.user-name {
  display: block;
  font-weight: 600;
  color: #e2e8f0;
}

.user-role {
  font-size: 12px;
  color: #64748b;
  text-transform: capitalize;
}

.logout-btn {
  width: 100%;
  padding: 10px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.logout-btn:hover {
  background: #dc2626;
}

main {
  flex: 1;
  min-height: 100vh;
}

main.with-sidebar {
  margin-left: 260px;
  padding: 24px;
}
</style>
