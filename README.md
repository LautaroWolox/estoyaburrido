# Vida Organizada

Aplicación personal responsive para centralizar finanzas, salud, medicación, tareas, hogar, compras, calendario, rutinas y hábitos. Está construida como SPA/PWA para funcionar en celular, tablet, notebook y escritorio.

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

## Acceso

La aplicación incluye:

- Login responsive.
- Creación inicial de un acceso local.
- Contraseña almacenada como hash en el navegador.
- Sesión temporal o recordada durante 30 días.
- Protección de todas las rutas privadas.
- Recuperación local de la contraseña.
- Cierre de sesión desde escritorio y móvil.

> Esta autenticación es transitoria y protege el acceso únicamente en el dispositivo actual. La etapa de Supabase reemplazará el proveedor local por autenticación segura, recuperación por correo y sincronización entre dispositivos.

## Tecnologías

Vue 3, TypeScript, Vite, Pinia, Vue Router, **PrimeVue 4.5.5 MIT**, PrimeIcons, Aura, date-fns y vite-plugin-pwa.

Las versiones de PrimeVue y del paquete de temas están fijadas sin rangos para evitar que una instalación futura actualice accidentalmente a PrimeVue 5 y vuelva a requerir una licencia PrimeUI.

## Desarrollo local

Requiere Node.js 24.

```bash
npm install
npm run dev
```

Validación y build:

```bash
npm run build
npm run preview
```

## Despliegue en Netlify

El repositorio incluye `netlify.toml` con:

- Comando de build `npm run build`.
- Carpeta de publicación `dist`.
- Node.js 24.
- Reescritura SPA hacia `index.html` para que funcionen rutas como `/login`, `/salud` o `/finanzas` al recargar.
- Encabezados básicos de seguridad y caché para los recursos generados.

En Netlify alcanza con importar el repositorio desde GitHub. La configuración será detectada automáticamente.

## Persistencia actual

La versión visual guarda la información en `localStorage` y permite exportar/importar respaldos JSON. La próxima etapa será conectar autenticación, base de datos, sincronización multidispositivo y notificaciones push mediante Supabase o una API propia.

> El módulo de salud sirve para organización personal y no reemplaza indicaciones ni asesoramiento profesional.
