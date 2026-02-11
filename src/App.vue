<script setup lang="ts">
import { ref } from 'vue';
import FilesList from '@/components/FilesList.vue'

const showMultipleDownloadDrawer = ref<boolean>(false)
</script>

<template>
  <v-app>
    <v-main>
      <v-container fluid>
        <FilesList @multiple-downloads="showMultipleDownloadDrawer = true"/>
      </v-container>
      <v-navigation-drawer v-if="showMultipleDownloadDrawer">
        
      </v-navigation-drawer>
    </v-main>
  </v-app>
</template>