<script setup lang="ts">
import { DownloadItem, DownloadState } from "@/interfaces/download";
import DownloadCard from "./DownloadCard.vue";
import {
  downloadMultiple,
  pauseDownload,
  resumeDownload,
} from "@/composables/useDownload";
import { useDownloadStore } from "@/stores/download";
import { computed } from "vue";

const props = defineProps<{
  showDrawer: boolean;
  downloads: DownloadState[];
}>();

const emit = defineEmits<{
  (e: "close-drawer"): void;
}>();

const downloadStore = useDownloadStore();
const downloadList = computed(() => downloadStore.allMultipleDownloads);

const toDownloadItem = (state: DownloadState): DownloadItem => ({
  id: state.id,
  url: state.url,
  filename: state.filename,
  size: state.total,
  metadata: state.metadata,
});

const handleMultipleDownload = async () => {
  const downloads = downloadList.value
    .filter((download) => download.status !== "completed")
    .map(toDownloadItem);

  await downloadMultiple(downloads);
};

const handleRemoveDownload = (downloadId: string) => {
  downloadStore.removeMultipleDownloadFromList(downloadId);
};

const handlePauseDownload = (download: DownloadState) => {
  pauseDownload(download);
};

const handleResumeDownload = (download: DownloadState) => {
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
        @click="handleMultipleDownload"
        :disabled="downloadStore.activeDownloads.length > 0"
        >Download All</v-btn
      >
      <v-btn size="x-small" @click="handleDrawerClose">Close</v-btn>
    </div>
  </v-navigation-drawer>
</template>
