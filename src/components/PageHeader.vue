<template>
  <header class="page-heading">
    <div>
      <h1 class="page-title">{{ title }}</h1>
      <p class="page-description">{{ description }}</p>
    </div>
    <div class="toolbar"><slot /></div>
  </header>
</template>

<script setup lang="ts">defineProps<{ title: string; description: string }>()</script>
