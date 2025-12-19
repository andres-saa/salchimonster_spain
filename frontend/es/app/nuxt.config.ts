// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
  ],

  css: ['~/assets/base.css'],

  fonts: {
    families: [
      {
        name: 'Roboto',
        provider: 'google',
        weights: [400, 500, 700],
        styles: ['normal'],
        subsets: ['latin'],
      },
    ],
  },

  runtimeConfig: {
    apiSecret: process.env.API_SECRET || 'dev-secret',
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:8000',
      googleMapsKey: process.env.NUXT_PUBLIC_GOOGLE_MAPS_KEY || '',
    },
  },

  // ✅ Importante para i18n-iso-countries (evita líos CJS/ESM en SSR)
  build: {
    transpile: ['i18n-iso-countries'],
  },

  vite: {
    // ✅ Fuerza a Vite/Nuxt a NO dejarlo como dependencia externa en SSR,
    // así lo procesa y evita errores de require/exports
    ssr: {
      noExternal: ['i18n-iso-countries'],
    },
    // ✅ Opcional: pre-optimización en dev
    optimizeDeps: {
      include: ['i18n-iso-countries'],
    },
  },

  image: {
    domains: ['img.restpe.com', 'backend.salchimonster.com', 'gestion.salchimonster.com'],
    format: ['avif', 'webp'],
    quality: 75,
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
    densities: [1, 2],
    presets: {
      default: {
        modifiers: {
          loading: 'lazy',
          fit: 'cover',
        },
      },
    },
  },
})
