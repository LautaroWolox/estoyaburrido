<script setup lang="ts">
defineProps<{
  eyebrow: string
  title: string
  description: string
}>()
</script>

<template>
  <main class="auth-page">
    <section class="auth-showcase" aria-label="Presentación de Vida Organizada">
      <RouterLink to="/login" class="auth-brand">
        <span><i class="pi pi-sparkles" /></span>
        <div><strong>Vida Organizada</strong><small>Tu espacio personal</small></div>
      </RouterLink>

      <div class="auth-showcase__content">
        <span class="auth-kicker">Todo en un solo lugar</span>
        <h1>Organizá lo importante sin perder de vista tu día.</h1>
        <p>Salud, finanzas, tareas, hogar y calendario en una experiencia privada, clara y adaptable a todos tus dispositivos.</p>

        <div class="auth-feature-grid">
          <article><i class="pi pi-mobile" /><div><strong>Siempre a mano</strong><small>Celular, tablet, notebook y PC.</small></div></article>
          <article><i class="pi pi-shield" /><div><strong>Privacidad local</strong><small>Sin enviar datos hasta conectar la nube.</small></div></article>
          <article><i class="pi pi-cloud" /><div><strong>Lista para crecer</strong><small>Preparada para Supabase y Netlify.</small></div></article>
        </div>
      </div>

      <p class="auth-showcase__footer"><i class="pi pi-lock" /> Acceso personal · Información guardada en este dispositivo</p>
    </section>

    <section class="auth-form-side">
      <div class="auth-mobile-brand">
        <span><i class="pi pi-sparkles" /></span>
        <strong>Vida Organizada</strong>
      </div>

      <div class="auth-card">
        <header>
          <span class="auth-eyebrow">{{ eyebrow }}</span>
          <h2>{{ title }}</h2>
          <p>{{ description }}</p>
        </header>
        <slot />
      </div>

      <p class="auth-legal">Uso personal · La autenticación segura en la nube se activará al conectar Supabase.</p>
    </section>
  </main>
</template>
