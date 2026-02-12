<script setup lang="ts">
import { ref } from "vue";
import FilesList from "@/components/FilesList.vue";
import DownloadDrawer from "./components/DownloadDrawer.vue";
import { useDownloadStore } from "./stores/download";

const downloadStore = useDownloadStore();
const showMultipleDownloadDrawer = ref<boolean>(false);
</script>

<template>
  <v-app>
    <v-main>
      <v-container class="pa-6">
        <FilesList
          :show-drawer="showMultipleDownloadDrawer"
          @open-multiple-downloads="showMultipleDownloadDrawer = true"
        />
      </v-container>

      <v-container class="h-100">
        <DownloadDrawer
          :show-drawer="showMultipleDownloadDrawer"
          :downloads="downloadStore.allMultipleDownloads"
          @close-drawer="showMultipleDownloadDrawer = false"
        />
      </v-container>
    </v-main>
  </v-app>
</template>
