<script setup lang="ts">
import '../assets/main.css';
import { onMounted, ref } from 'vue';
import { DownloadItem } from '@/interfaces/download';
import { TableHeaders } from '@/types/table';
import { downloadFile, fetchDownloadItems } from '@/composables/useDownload';

const downloads = ref<DownloadItem[]>([])

const headers: TableHeaders = [
  { title: 'Name', key: 'filename' },
  { title: 'Size', key: 'size' },
  { title: 'Status', key: 'status' },
  { title: 'Progress', key: 'progress' },
  {title: 'Download'}
]

const emit = defineEmits<{
    (e: 'multiple-downloads'):void
}>()

const handleDirectDownload = async (download: DownloadItem) => {
  await downloadFile({
    id: download.id,
    url: download.url,
    filename: download.filename,
    size: download.size,
    status: 'downloading',
    progress: 0,
    metadata: {  
      downloadedBytes: 0,
      isDirect: true
    }
  })
}

onMounted(async () => {
  downloads.value = await fetchDownloadItems()
})
</script>

<template>
    <v-btn @click="emit('multiple-downloads')">Multiple Downloads</v-btn>
    <v-data-table-virtual 
        :headers="headers"
        :items="downloads"
        item-key="id"
        fixed-header    
        class="custom-data-table px-6 text-no-wrap bg-transparent w-100 overflow-hidden"
    >
        <template v-slot:item="{ props, item }">
            <tr 
                v-bind="props"
                :key="item.id"
            >
                <td >
                    <div>
                        {{ item.filename }}
                    </div>
                </td>
                <td >
                    <div>
                        {{ (item.size / (1024 * 1024)).toFixed(2) }} MB
                    </div>
                </td>
                <td >
                    <div>
                        {{ `${item.status}`}}
                    </div>
                </td>
                <td >
                    <div>
                        {{ `${item.progress} %`}}
                    </div>
                </td>
                <td class="d-flex">
                    <v-btn 
                        variant="text"
                        size="medium"
                        icon="mdi-download-circle-outline"
                        class="cursor-pointer text-grey"
                        @click="handleDirectDownload(item)"
                    >
                    </v-btn>
                </td>
            </tr>

        </template>
    </v-data-table-virtual>
</template>