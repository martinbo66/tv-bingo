<template>
  <footer class="app-footer">
    <div class="app-info">
      <span class="app-name">TV Bingo</span>
      <span class="separator">·</span>
      <span class="version">Version {{ appVersion }}</span>
      <span class="separator">·</span>
      <span class="updated-date">Updated: {{ buildDate }}</span>
    </div>
  </footer>
</template>

<script setup lang="ts">
/* global __BUILD_DATE__ __APP_VERSION__ */
const buildDate = __BUILD_DATE__
const appVersion = __APP_VERSION__
</script>

<style scoped>
.app-footer {
  text-align: center;
  padding: var(--spacing-md) var(--spacing-xl);
  border-top: 1px solid var(--color-border);
  background-color: var(--color-bg-primary);
}

.app-info {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.app-name {
  font-weight: var(--font-weight-semibold);
  color: var(--color-accent);
}

.separator {
  opacity: 0.5;
}

.updated-date {
  font-style: italic;
  opacity: 0.8;
}
</style>
