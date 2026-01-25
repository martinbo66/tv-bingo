<script setup lang="ts">
</script>

<template>
  <div class="app-container">
    <header class="header">
      <router-link to="/" class="logo-link">
        <div class="logo-container">
          <img src="./assets/tv-bingo-round.jpg" alt="TV Show Bingo" 
          class="header-image" />
          <div class="logo-overlay"></div>
        </div>
      </router-link>
    </header>
    <main class="main-content">
      <router-view></router-view>
    </main>
  </div>
</template>

<style scoped>
.app-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
  padding: 1rem;
  flex-shrink: 0;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.logo-link {
  display: inline-block;
  text-decoration: none;
  transition: transform 0.3s ease;
}

.logo-link:hover {
  transform: scale(1.05);
}

.logo-container {
  position: relative;
  display: inline-block;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 
    0 8px 32px rgba(160, 132, 202, 0.3),
    0 4px 16px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #2d183a 0%, #1a1024 100%);
  padding: 8px;
}

.logo-container:hover {
  box-shadow: 
    0 12px 40px rgba(160, 132, 202, 0.4),
    0 6px 20px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.header-image {
  width: 180px;
  height: 180px;
  object-fit: cover;
  border-radius: 16px;
  display: block;
  transition: all 0.3s ease;
  filter: brightness(1.05) contrast(1.1);
}

.logo-container:hover .header-image {
  filter: brightness(1.1) contrast(1.15);
}

.logo-overlay {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  bottom: 8px;
  border-radius: 16px;
  background: linear-gradient(
    135deg, 
    rgba(160, 132, 202, 0.1) 0%, 
    rgba(160, 132, 202, 0.05) 50%, 
    transparent 100%
  );
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.logo-container:hover .logo-overlay {
  opacity: 0.8;
}

/* Responsive design */
@media (max-width: 768px) {
  .header-image {
    width: 140px;
    height: 140px;
  }
  
  .logo-container {
    padding: 6px;
  }
  
  .logo-overlay {
    top: 6px;
    left: 6px;
    right: 6px;
    bottom: 6px;
  }
}

@media (max-width: 480px) {
  .header-image {
    width: 120px;
    height: 120px;
  }
  
  .logo-container {
    padding: 4px;
  }
  
  .logo-overlay {
    top: 4px;
    left: 4px;
    right: 4px;
    bottom: 4px;
  }
}
</style>