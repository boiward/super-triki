<template>
  <div class="app">
    <header class="app__header">
      <h1 class="app__title">Super Triki</h1>
      <p class="app__subtitle">Tic Tac Toe Avanzado</p>
    </header>

    <main class="app__main">
      <PlayerPanel :player="1" />
      <Board />
      <PlayerPanel :player="2" />
    </main>

    <GameStatus />
  </div>
</template>

<script setup lang="ts">
import Board from '@/components/Board.vue'
import PlayerPanel from '@/components/PlayerPanel.vue'
import GameStatus from '@/components/GameStatus.vue'
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

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px;
  gap: 24px;
}

.app__header {
  width: 100%;
  text-align: center;
}

.app__title {
  font-size: 36px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--player-1-color), var(--player-2-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}

.app__subtitle {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}

.app__main {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: center;
}

@media (max-width: 600px) {
  .app__main {
    flex-direction: column;
    align-items: center;
  }

  .app__title {
    font-size: 28px;
  }
}
</style>
