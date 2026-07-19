import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Aura from '@primeuix/themes/aura'
import 'primeicons/primeicons.css'
import '@/assets/main.css'
import '@/assets/modules-a.css'
import '@/assets/modules-b.css'
import '@/assets/responsive.css'
import '@/assets/auth.css'
import '@/assets/wallet.css'
import App from './App.vue'
import router from './router'
import { pinia } from '@/app/pinia'

createApp(App)
  .use(pinia)
  .use(router)
  .use(PrimeVue, {
    ripple: true,
    theme: {
      preset: Aura,
      options: {
        darkModeSelector: '.app-dark',
        cssLayer: false
      }
    }
  })
  .use(ToastService)
  .use(ConfirmationService)
  .mount('#app')
