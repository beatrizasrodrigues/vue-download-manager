<script setup lang="ts">
import '../assets/main.css';
import { ref } from 'vue';
import { DownloadItem } from '@/interfaces/download';
import { TableHeaders } from '@/types/table';

const dummyDownloads = ref<DownloadItem[]>([
  {
    id: '1',
    name: 'ProjectReport.pdf',
    size: 5_242_880, // ~5 MB
    version: 'v1.0',
    status: 'pending',
    progress: 0,
    url: 'https://example.com/download/ProjectReport.pdf',
    addedAt: new Date('2026-02-10T10:00:00')
  },
  {
    id: '2',
    name: 'DesignMockup.zip',
    size: 104_857_600, // ~100 MB
    version: 'v2.3',
    status: 'pending',
    progress: 0,
    url: 'https://example.com/download/DesignMockup.zip',
    addedAt: new Date('2026-02-10T10:05:00')
  },
  {
    id: '3',
    name: 'UserGuide.docx',
    size: 2_097_152, // ~2 MB
    version: 'v1.2',
    status: 'pending',
    progress: 0,
    url: 'https://example.com/download/UserGuide.docx',
    addedAt: new Date('2026-02-10T10:10:00')
  },
  {
    id: '4',
    name: 'FinancialData.csv',
    size: 52_428_800, // ~50 MB
    version: 'v3.0',
    status: 'pending',
    progress: 0,
    url: 'https://example.com/download/FinancialData.csv',
    addedAt: new Date('2026-02-10T10:15:00')
  },
  {
    id: '5',
    name: 'Presentation.pptx',
    size: 10_485_760, // ~10 MB
    version: 'v1.1',
    status: 'pending',
    progress: 0,
    url: 'https://example.com/download/Presentation.pptx',
    addedAt: new Date('2026-02-10T10:20:00')
  }
])

const headers: TableHeaders = [
  { title: 'Name', key: 'name' },
  { title: 'Size', key: 'size' },
  { title: 'Version', key: 'version' },
  { title: 'Status', key: 'status' },
  { title: 'Progress', key: 'progress' },
  {title: 'Download'}
]

</script>

<template>
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
                        {{ item.name }}
                    </div>
                </td>
                <td >
                    <div>
                        {{ (item.size / (1024 * 1024)).toFixed(2) }} MB
                    </div>
                </td>
                <td >
                    <div>
                        {{ item.version }}
                    </div>
                </td>
                <td >
                    <div>
                        {{ item.status }}
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
                    >
                    </v-btn>
                </td>
            </tr>

        </template>
    </v-data-table-virtual>
</template>