<script setup lang="ts">
import "../assets/main.css";
import { computed, onMounted, ref } from "vue";
import { DownloadItem } from "@/interfaces/download";
import { TableHeaders } from "@/types/table";
import { downloadFile, fetchDownloadItems } from "@/composables/useDownload";
import { useDownloadStore } from "@/stores/download";
import { useFileSizeFormatter } from "@/composables/useFileSizeFormatter";

const props = defineProps<{
  showDrawer: boolean;
}>();

const emit = defineEmits<{
  (e: "open-multiple-downloads"): void;
}>();

const downloadStore = useDownloadStore();
const items = ref<DownloadItem[]>([]);
const showDrawer = computed(() => props.showDrawer);

const headers: TableHeaders = [
  { title: "Name", key: "filename" },
  { title: "Size", key: "size" },
  { title: "Status", key: "status" },
  { title: "Download" },
];

const handleDirectDownload = async (download: DownloadItem) => {
  await downloadFile({
    id: download.id,
    url: download.url,
    filename: download.filename,
    size: download.size,
    status: "downloading",
    progress: 0,
    metadata: {
      downloadedBytes: 0,
      isDirect: true,
    },
  });
};

onMounted(async () => {
  items.value = await fetchDownloadItems();
});
</script>

<template>
  <v-data-table-virtual
    :headers="headers"
    :items="items"
    item-key="id"
    fixed-header
    class="custom-data-table text-no-wrap bg-transparent w-100 overflow-hidden"
  >
    <template v-slot:item="{ props, item }">
      <tr v-bind="props" :key="item.id">
        <td>
          <div>
            {{ item.filename }}
          </div>
        </td>
        <td>
          <div>{{ useFileSizeFormatter(item.size) }}</div>
        </td>
        <td>
          <div>
            {{
              downloadStore.allDirectDownloads.find((d) => d.id === item.id)
                ? downloadStore.allDirectDownloads.find((d) => d.id === item.id)
                    ?.status
                : "pending"
            }}
          </div>
        </td>

        <td class="d-flex">
          <v-btn
            v-if="!showDrawer"
            variant="text"
            size="medium"
            icon="mdi-download-circle-outline"
            class="cursor-pointer text-grey"
            @click="handleDirectDownload(item)"
          />
          <v-btn
            v-if="showDrawer"
            variant="text"
            size="medium"
            icon="mdi-plus-circle-outline"
            class="cursor-pointer text-grey"
            @click="downloadStore.addToMultipleDownloads(item)"
          />
        </td>
      </tr>
    </template>
  </v-data-table-virtual>

  <div class="d-flex justify-center">
    <v-btn
      :disabled="showDrawer"
      size="small"
      @click="emit('open-multiple-downloads')"
      >Download Multiple</v-btn
    >
  </div>
</template>
