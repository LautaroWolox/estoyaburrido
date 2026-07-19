# Vida Organizada

Aplicación personal responsive para centralizar finanzas, salud, medicación, tareas, hogar, compras, calendario, rutinas y hábitos. Está construida como SPA/PWA para funcionar en teléfono, tablet, notebook y escritorio.

## Módulos

### Finanzas
- Ingresos y gastos con filtros, categorías y medios de pago.
- Presupuestos mensuales y seguimiento de consumo.
- Gastos e ingresos recurrentes.
- Suscripciones, cuotas de tarjeta, deudas y préstamos.
- Metas de ahorro y panel financiero consolidado.

### Salud
- Medicaciones con tratamiento, stock, alertas e historial de tomas.
- Turnos, profesionales, centros médicos y estudios.
- Registro de síntomas, mediciones y contactos de emergencia.
- Panel de salud con próximos eventos y estado general.

### Tareas
- Bandeja rápida, prioridades, etiquetas y vencimientos.
- Subtareas, recurrencia, vistas de hoy, semana y todas.
- Temporizador de enfoque tipo Pomodoro vinculado a tareas.

### Hogar
- Listas de compras con presupuesto y conversión automática a gasto.
- Inventario, vencimientos y alertas de stock mínimo.
- Tareas domésticas, mantenimientos, garantías y reparaciones.

### Calendario avanzado
- Vistas mensual, semanal, diaria y agenda.
- Eventos recurrentes, duración, recordatorios, ubicación y enlaces.
- Participantes, calendarios por color y movimiento entre fechas.
- Integración visual de medicación, tareas, rutinas y compromisos.

### Organización personal
- Rutinas recurrentes y hábitos semanales.
- Panel diario consolidado.
- Modo claro/oscuro, exportación e importación de respaldos.
- Recordatorios locales mientras la aplicación está abierta.

## Tecnologías

Vue 3, TypeScript, Vite, Pinia, Vue Router, PrimeVue, PrimeIcons, Aura, date-fns y vite-plugin-pwa.

## Desarrollo local

Requiere Node.js 24 o superior.

```bash
npm install
npm run dev
```

Validación y build:

```bash
npm run build
npm run preview
```

## Persistencia actual

La versión visual guarda la información en `localStorage` y permite exportar/importar respaldos JSON. La próxima etapa será conectar autenticación, base de datos, sincronización multidispositivo y notificaciones push mediante Supabase o una API propia.

> El módulo de salud sirve para organización personal y no reemplaza indicaciones ni asesoramiento profesional.
