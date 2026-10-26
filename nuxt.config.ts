// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  ssr: false,
  modules: ["@nuxt/ui", "@nuxtjs/leaflet"],
  css: ["~/assets/css/main.css"],
  future: {
    compatibilityVersion: 4,
  },
  runtimeConfig: {
    MONGO_URI: process.env.MONGO_URI,
    GEOCODE_API_KEY: process.env.GEOCODE_API_KEY,
    programSyncApiKey: process.env.NUXT_PROGRAM_SYNC_API_KEY,
    public: {
      GEOCODE_API_KEY: process.env.GEOCODE_API_KEY,
    },
  },
  nitro: {
    plugins: ["~~/server/plugins/mongodb.ts"],
  },
  ui: {
    colorMode: false,
  },
});
