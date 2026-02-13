<script setup lang="ts">
import { DownloadItem } from "@/interfaces/download";
import DownloadCard from "./DownloadCard.vue";
import { downloadMultiple } from "@/composables/useDownload";
import { useDownloadStore } from "@/stores/download";

const props = defineProps<{
  showDrawer: boolean;
  downloads: DownloadItem[];
}>();

const emit = defineEmits<{
  (e: "close-drawer"): void;
}>();

const downloadStore = useDownloadStore();

const handleRemoveDownload = (downloadId: string) => {
  downloadStore.removeMultipleDownloadFromList(downloadId);
};

const handleDrawerClose = () => {
  emit("close-drawer");
};
</script>

<template>
  <v-navigation-drawer
    v-if="props.showDrawer"
    class="pa-4 h-100"
    :style="{ minWidth: '350px' }"
    location="right"
  >
    <v-list>
      <v-list-item v-for="download in props.downloads" :key="download.id">
        <DownloadCard
          :download="download"
          @remove-download="handleRemoveDownload"
        />
      </v-list-item>
    </v-list>
    <div class="d-flex align-end justify-center ga-4">
      <v-btn size="x-small" @click="downloadMultiple(props.downloads)"
        >Download All</v-btn
      >
      <v-btn size="x-small" @click="handleDrawerClose">Close</v-btn>
    </div>
  </v-navigation-drawer>
</template>
