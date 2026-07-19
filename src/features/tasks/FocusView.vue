<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import PageHeader from '@/components/PageHeader.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useAppStore } from '@/stores/app'
import { createId } from '@/utils/id'

const store=useAppStore();const route=useRoute();const selectedTaskId=ref(typeof route.query.task==='string'?route.query.task:'');const duration=ref(25);const remaining=ref(duration.value*60);const running=ref(false);const completed=ref(false);let timer:number|undefined
const taskOptions=computed(()=>store.data.tasks.filter(x=>x.status!=='done').map(x=>({label:x.title,value:x.id})));const selectedTask=computed(()=>store.data.tasks.find(x=>x.id===selectedTaskId.value));const minutes=computed(()=>Math.floor(remaining.value/60));const seconds=computed(()=>remaining.value%60);const progress=computed(()=>Math.round((1-remaining.value/(duration.value*60))*100));const sessionsToday=computed(()=>store.data.focusSessions.filter(x=>x.startedAt.slice(0,10)===store.today&&x.completed));const focusedMinutes=computed(()=>sessionsToday.value.reduce((s,x)=>s+x.durationMinutes,0))
function syncDuration(){if(!running.value){remaining.value=duration.value*60;completed.value=false}}
function start(){if(running.value)return;running.value=true;completed.value=false;timer=window.setInterval(()=>{if(remaining.value<=1){finish();return}remaining.value--},1000)}
function pause(){running.value=false;if(timer!==undefined)window.clearInterval(timer);timer=undefined}
function reset(){pause();remaining.value=duration.value*60;completed.value=false}
function finish(){pause();remaining.value=0;completed.value=true;store.data.focusSessions.push({id:createId('focus'),taskId:selectedTaskId.value||undefined,startedAt:new Date().toISOString(),durationMinutes:duration.value,completed:true});if(selectedTask.value&&selectedTask.value.status==='todo')store.upsert('tasks',{...selectedTask.value,status:'doing'})}
function completeTask(){if(selectedTask.value)store.upsert('tasks',{...selectedTask.value,status:'done',completedAt:new Date().toISOString()})}
onUnmounted(()=>pause())
</script>

<template><section class="page-container focus-page"><PageHeader eyebrow="Trabajo profundo" title="Modo enfoque" description="Elegí una tarea, silenciá distracciones y trabajá en un bloque concreto."><RouterLink to="/tareas"><Button label="Volver a tareas" icon="pi pi-arrow-left" severity="secondary" outlined/></RouterLink></PageHeader>
<div class="focus-layout"><Card class="focus-card"><template #content><div class="focus-settings"><label class="field"><span>Tarea opcional</span><Select v-model="selectedTaskId" :options="taskOptions" option-label="label" option-value="value" placeholder="Enfoque libre" show-clear/></label><label class="field"><span>Duración</span><InputNumber v-model="duration" suffix=" min" :min="5" :max="180" :disabled="running" @update:model-value="syncDuration"/></label></div><div class="focus-timer" :style="{'--progress':`${progress*3.6}deg`}"><div><strong>{{String(minutes).padStart(2,'0')}}:{{String(seconds).padStart(2,'0')}}</strong><span>{{running?'En curso':completed?'Sesión completada':'Listo para empezar'}}</span></div></div><div v-if="selectedTask" class="focus-task"><Tag value="Tarea seleccionada" severity="secondary" rounded/><h2>{{selectedTask.title}}</h2><p>{{selectedTask.description||'Sin descripción'}}</p></div><div class="focus-actions"><Button v-if="!running" :label="remaining===duration*60?'Comenzar':'Continuar'" icon="pi pi-play" size="large" @click="start"/><Button v-else label="Pausar" icon="pi pi-pause" severity="warn" size="large" @click="pause"/><Button label="Reiniciar" icon="pi pi-refresh" severity="secondary" outlined size="large" @click="reset"/><Button v-if="completed&&selectedTask" label="Completar tarea" icon="pi pi-check" severity="success" size="large" @click="completeTask"/></div></template></Card>
<aside><Card class="content-card"><template #title>Hoy</template><template #content><div class="focus-stats"><article><strong>{{sessionsToday.length}}</strong><small>sesiones completas</small></article><article><strong>{{focusedMinutes}}</strong><small>minutos enfocados</small></article></div></template></Card><Card class="content-card focus-tip"><template #title>Prepará el bloque</template><template #content><ol><li>Elegí una sola tarea concreta.</li><li>Cerrá notificaciones y pestañas que no uses.</li><li>Trabajá hasta que termine el tiempo.</li><li>Tomá una pausa breve antes del siguiente bloque.</li></ol></template></Card><Card class="content-card"><template #title>Últimas sesiones</template><template #content><div v-if="store.data.focusSessions.length" class="mini-history"><article v-for="item in [...store.data.focusSessions].reverse().slice(0,5)" :key="item.id"><i class="pi pi-stopwatch"/><div><strong>{{item.durationMinutes}} minutos</strong><small>{{store.data.tasks.find(x=>x.id===item.taskId)?.title||'Enfoque libre'}}</small></div></article></div><EmptyState v-else icon="pi pi-stopwatch" title="Sin sesiones" description="Tu historial aparecerá al completar el primer bloque."/></template></Card></aside></div>
</section></template>
