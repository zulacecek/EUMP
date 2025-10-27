import './assets/main.css'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import  './scripts/extensionFunctions/arrayExtensions';

import App from './App.vue'
import router from './router'
import tooltipDirective from './scripts/uiControllers/tooltipDirective'
import contextMenuDirective from './scripts/uiControllers/contextMenuDirective'
import { startWebsocketConnection } from './scripts/layerCommunication/fileCommunication'

library.add(fas)

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.directive("tooltip", tooltipDirective);
app.directive('context-menu', contextMenuDirective);

app.mount('#app')

startWebsocketConnection();