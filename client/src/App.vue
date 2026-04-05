<template>
  <header class="app-header">
    <RouterLink to="/" class="app-logo">
      <img src="/favicon.svg" alt="Super Triki" class="app-logo__img" />
      <span class="app-logo__name">Super Triki</span>
    </RouterLink>
  </header>

  <RouterView />
</template>

<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router'
</script>

<style>
@import '@/assets/variables.css';

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: #0d0d1a;
  color: var(--text-primary);
  font-family: 'Segoe UI', system-ui, sans-serif;
  min-height: 100vh;
}
</style>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  padding: 12px 24px;
  background: rgba(13, 13, 26, 0.85);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.app-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.app-logo__img {
  width: 28px;
  height: 28px;
}

.app-logo__name {
  font-size: 16px;
  font-weight: 800;
  background: linear-gradient(135deg, #e63946, #457b9d);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.5px;
}
</style>
