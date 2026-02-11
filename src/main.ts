import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

import { createVuetify } from 'vuetify'
import 'vuetify/styles'

import '@mdi/font/css/materialdesignicons.css'

const app = createApp(App)

const pinia = createPinia()
const vuetify = createVuetify()

app.use(pinia)
app.use(vuetify)

app.mount('#app')

