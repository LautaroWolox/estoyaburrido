<script setup lang="ts">
import { ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import Message from 'primevue/message'
import PageHeader from '@/components/PageHeader.vue'
import { useAppStore } from '@/stores/app'

const store=useAppStore();const toast=useToast();const confirm=useConfirm();const fileInput=ref<HTMLInputElement|null>(null)
const currencies=[{label:'Peso argentino (ARS)',value:'ARS'},{label:'Dólar estadounidense (USD)',value:'USD'},{label:'Euro (EUR)',value:'EUR'}]
const roadmap=[{icon:'pi pi-cloud',title:'Sincronización en la nube',description:'Cuenta personal y respaldo con Supabase o API propia.'},{icon:'pi pi-bell',title:'Recordatorios avanzados',description:'Notificaciones aun con la aplicación cerrada mediante backend.'},{icon:'pi pi-chart-pie',title:'Informes y presupuestos',description:'Límites por categoría, gráficos y proyección mensual.'},{icon:'pi pi-users',title:'Modo compartido',description:'Rutinas del hogar, compras y calendarios familiares.'},{icon:'pi pi-file',title:'Documentos personales',description:'Vencimientos, garantías, recetas y archivos importantes.'},{icon:'pi pi-map-marker',title:'Lugares frecuentes',description:'Turnos y recordatorios asociados a ubicaciones.'}]
async function notifications(enabled:boolean){if(!enabled){store.data.settings.notificationsEnabled=false;return}if(!('Notification'in window)){toast.add({severity:'warn',summary:'No disponible',detail:'Este navegador no soporta notificaciones.',life:3500});return}const permission=await Notification.requestPermission();store.data.settings.notificationsEnabled=permission==='granted';if(permission==='granted')new Notification('Vida Organizada',{body:'Las notificaciones quedaron habilitadas mientras la aplicación esté activa.'})}
async function importFile(event:Event){const file=(event.target as HTMLInputElement).files?.[0];if(!file)return;try{await store.importData(file);toast.add({severity:'success',summary:'Datos importados',detail:'La información fue restaurada.',life:2500})}catch{toast.add({severity:'error',summary:'Archivo inválido',detail:'No se pudo interpretar el respaldo.',life:3500})}finally{if(fileInput.value)fileInput.value.value=''}}
function reset(){confirm.require({message:'Se borrarán todos los datos guardados en este dispositivo.',header:'Restablecer aplicación',icon:'pi pi-exclamation-triangle',rejectProps:{label:'Cancelar',severity:'secondary',outlined:true},acceptProps:{label:'Borrar todo',severity:'danger'},accept:()=>store.resetData()})}
</script>

<template><section class="page-container"><PageHeader eyebrow="Personalización y respaldo" title="Configuración" description="Adaptá la experiencia, protegé tus datos y prepará futuras integraciones."/>
<div class="settings-grid"><Card class="content-card"><template #title>Perfil y apariencia</template><template #content><div class="settings-form"><label class="field"><span>Nombre para mostrar</span><InputText v-model="store.data.settings.displayName"/></label><label class="field"><span>Moneda</span><Select v-model="store.data.settings.currency" :options="currencies" option-label="label" option-value="value"/></label><label class="switch-field"><span><strong>Modo oscuro</strong><small>Cambia todas las superficies y componentes.</small></span><ToggleSwitch v-model="store.data.settings.darkMode"/></label><label class="switch-field"><span><strong>Notificaciones del navegador</strong><small>Funcionan mientras la aplicación está abierta o instalada.</small></span><ToggleSwitch :model-value="store.data.settings.notificationsEnabled" @update:model-value="notifications"/></label></div></template></Card>
<Card class="content-card"><template #title>Datos y privacidad</template><template #content><Message severity="info" :closable="false">Toda la información se guarda únicamente en este navegador y no se envía a servidores externos.</Message><div class="data-actions"><Button label="Exportar respaldo" icon="pi pi-download" severity="secondary" @click="store.exportData"/><Button label="Importar respaldo" icon="pi pi-upload" severity="secondary" outlined @click="fileInput?.click()"/><input ref="fileInput" class="sr-only" type="file" accept="application/json" @change="importFile"/><Button label="Borrar todos los datos" icon="pi pi-trash" severity="danger" text @click="reset"/></div></template></Card></div>
<Card class="content-card"><template #title>Próximas mejoras posibles</template><template #content><div class="roadmap-grid"><article v-for="item in roadmap" :key="item.title"><span><i :class="item.icon"/></span><div><strong>{{item.title}}</strong><p>{{item.description}}</p></div></article></div></template></Card>
</section></template>
