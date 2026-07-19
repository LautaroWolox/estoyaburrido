# Vida Organizada

Aplicación personal responsive para centralizar calendario, medicación, rutinas diarias, gastos y hábitos. Está construida como SPA/PWA para funcionar en teléfono, tablet, notebook y escritorio.

## Funcionalidades

- Panel diario con progreso, tomas, rutinas, gastos y próximos eventos.
- Calendario mensual unificado con eventos, turnos, tareas, medicación y rutinas.
- Medicaciones con dosis, días, múltiples horarios y registro de tomas.
- Rutinas recurrentes con categoría, horario, duración y seguimiento diario.
- Gastos por categoría, método de pago y resumen mensual.
- Hábitos con meta semanal y registro por día.
- Modo claro y oscuro.
- Persistencia local automática.
- Exportación e importación de respaldos JSON.
- Instalación como PWA.

> La sección de medicación sirve para organización personal y no reemplaza indicaciones ni asesoramiento profesional de salud.

## Tecnologías

Vue 3, TypeScript, Vite, Pinia, Vue Router, PrimeVue 5, PrimeIcons, Aura, date-fns y vite-plugin-pwa.

## Arquitectura

```text
src/
├── app/          # navegación y configuración transversal
├── assets/       # estilos globales responsive
├── components/   # componentes reutilizables
├── features/     # módulos funcionales separados
├── router/       # rutas con lazy loading
├── stores/       # estado y persistencia
├── types/        # contratos de dominio
└── utils/        # utilidades
```

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

## Próxima etapa recomendada

La primera versión guarda los datos en `localStorage`. La arquitectura permite conectar Supabase o una API REST para autenticación, sincronización multidispositivo, notificaciones push, presupuestos, lista de compras, documentos personales y calendarios compartidos.
