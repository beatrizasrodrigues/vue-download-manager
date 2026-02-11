<script setup lang="ts">
import '../assets/main.css';
import { ref } from 'vue';
import { DownloadItem } from '@/interfaces/download';
import { TableHeaders } from '@/types/table';
import { downloadFile } from '@/composables/useDownload';

const dummyDownloads = ref<DownloadItem[]>([
  {
    id: '1',
    url: 'public/test.pdf',
    filename: 'ProjectReport.pdf',
    size: 5_242_880, 
    metadata: {
      timelineId: 'TL001',
      isDirect: true,
      downloadedBytes: 0,
      progress: 0,
      abortController: new AbortController()
    }
  },
  {
    id: '2',
    url: 'public/test.pdf',
    filename: 'DesignMockup.zip',
    size: 104_857_600, // ~100 MB
    metadata: {
      timelineId: 'TL002',
      isDirect: false,
      downloadedBytes: 0,
      progress: 0,
      abortController: new AbortController()
    }
  },
  {
    id: '3',
    url: 'public/test.pdf',
    filename: 'UserGuide.docx',
    size: 2_097_152, // ~2 MB
    metadata: {
      timelineId: 'TL003',
      isDirect: true,
      downloadedBytes: 0,
      progress: 0,
      abortController: new AbortController()
    }
  },
  {
    id: '4',
    url: 'public/test.pdf',
    filename: 'FinancialData.csv',
    size: 52_428_800, // ~50 MB
    metadata: {
      timelineId: 'TL004',
      isDirect: false,
      downloadedBytes: 0,
      progress: 0,
      abortController: new AbortController()
    }
  },
  {
    id: '5',
    url: 'public/test.pdf',
    filename: 'Presentation.pptx',
    size: 10_485_760, // ~10 MB
    metadata: {
      timelineId: 'TL005',
      isDirect: true,
      downloadedBytes: 0,
      progress: 0,
      abortController: new AbortController()
    }
  }
])

const headers: TableHeaders = [
  { title: 'Name', key: 'name' },
  { title: 'Size', key: 'size' },
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
    metadata: {
      progress: 0,
      downloadedBytes: 0,
      isDirect: true
    }
  })
}
</script>

<template>
    <v-btn @click="emit('multiple-downloads')">Multiple Downloads</v-btn>
    <v-data-table-virtual 
        :headers="headers"
        :items="dummyDownloads"
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
                        {{ `${item.metadata.progress} %`}}
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