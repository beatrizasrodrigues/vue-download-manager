<script setup lang="ts">
import { DownloadItem } from "@/interfaces/download";
import DownloadCard from "./DownloadCard.vue";
import {
  downloadFile,
  downloadMultiple,
  pauseDownload,
  resumeDownload,
} from "@/composables/useDownload";
import { useDownloadStore } from "@/stores/download";
import { ref } from "vue";

const props = defineProps<{
  showDrawer: boolean;
  downloads: DownloadItem[];
}>();

const emit = defineEmits<{
  (e: "close-drawer"): void;
}>();

const downloadStore = useDownloadStore();
const pendingDownloads = ref<DownloadItem[]>([]);
//const pendingDownloads = props.downloads.filter((d) => d.status === 'pending')

const handleMultipleDownloads = () => {
  pendingDownloads.value = props.downloads.filter(
    (d) => d.status === "pending",
  );

  downloadMultiple(pendingDownloads.value);
};
const handleRemoveDownload = (downloadId: string) => {
  downloadStore.removeMultipleDownloadFromList(downloadId);
};

const handlePauseDownload = (download: DownloadItem) => {
  pauseDownload(download);
};

const handleResumeDownload = (download: DownloadItem) => {
  resumeDownload(download);
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
          @pause-download="handlePauseDownload"
          @resume-download="handleResumeDownload"
        />
      </v-list-item>
    </v-list>
    <div class="d-flex align-end justify-center ga-4">
      <v-btn
        size="x-small"
        @click="handleMultipleDownloads"
        :disabled="downloadStore.activeDownloads.length > 0"
        >Download All</v-btn
      >
      <v-btn size="x-small" @click="handleDrawerClose">Close</v-btn>
    </div>
  </v-navigation-drawer>
</template>
