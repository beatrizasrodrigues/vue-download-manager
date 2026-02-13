<script setup lang="ts">
import type { DownloadItem } from "@/interfaces/download";
import { computed } from "vue";

const props = defineProps<{
  download: DownloadItem;
}>();

const getProgressByStatus = computed(() =>
  props.download.status !== "completed" ? props.download.progress : 100,
);
</script>

<template>
  <main class="custom-shadow card-hover rounded d-flex-column rounded-sm">
    <div>
      <section
        class="d-flex ga-3 pa-4 w-100 border rounded"
        :class="[props.download.status !== 'error' ? 'default' : 'error']"
        :style="{ minHeight: '80px' }"
        v-if="download"
      >
        <section class="d-flex flex-column ga-2 w-100">
          <section class="d-flex ga-1 justify-space-between w-100">
            <div class="d-flex flex-row align-center ga-3">
              <v-icon class="text-gray-darken-3" size="24"
                >mdi-file-document-check-outline</v-icon
              >
              <p
                class="text-caption font-weight-medium wrap-text text-primary-darken-4"
              >
                {{ download.filename }}
              </p>
              <v-divider
                :thickness="1"
                vertical
                opacity="1"
                class="my-1 text-gray-darken-2"
              ></v-divider>
              <p
                class="text-caption text-medium-emphasis label-medium text-gray-wild-blue"
              >
                {{ (download.size / (1024 * 1024)).toFixed(2) }} MB
              </p>
            </div>
          </section>
          <section class="d-flex align-center ga-2">
            <v-progress-linear
              :model-value="getProgressByStatus"
              :color="download.status !== 'error' ? 'blue' : 'red'"
              height="4"
              rounded
              :indeterminate="
                ['downloading', 'error', 'paused'].includes(download.status) &&
                download.progress === 0
              "
              :buffer-value="download.progress ?? 0"
              :style="{ opacity: '100%' }"
            ></v-progress-linear>
          </section>
        </section>
      </section>
    </div>
  </main>
</template>

<style scoped>
.custom-x-small-btn {
  width: 20px;
  height: 20px;
}

.bottom-rounded {
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
}

.card-hover:hover {
  background-color: lightgray;
  cursor: pointer;
  transition:
    background-color 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out;
}

.wrap-text {
  word-wrap: break-word; /* Ensures long words break and wrap to the next line */
  overflow-wrap: break-word; /* Ensures long words break and wrap to the next line */
}

:deep(.v-progress-linear__buffer) {
  opacity: 100% !important;
}
</style>
