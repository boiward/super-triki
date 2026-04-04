<template>
  <RouterView />
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
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
