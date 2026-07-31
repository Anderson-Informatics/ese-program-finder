<script setup lang="ts">
import { onMounted, ref } from 'vue'
import 'swagger-ui-dist/swagger-ui.css'

useHead({
  title: 'DPSCD ESE Program Finder API Docs'
})

const swaggerRef = ref<HTMLDivElement | null>(null)
const error = ref<string | null>(null)

onMounted(async () => {
  if (!swaggerRef.value) return

  try {
    const mod: any = await import('swagger-ui-dist')
    const SwaggerUIBundle = mod.SwaggerUIBundle
    const spec = await $fetch('/openapi.json')

    if (!SwaggerUIBundle) {
      error.value = 'Swagger UI bundle failed to load'
      return
    }

    SwaggerUIBundle({
      dom_id: '#swagger-ui',
      spec,
      deepLinking: true,
      presets: [SwaggerUIBundle.presets.apis]
    })
  } catch (e) {
    error.value = String(e)
    console.error('Swagger UI init error:', e)
  }
})
</script>

<template>
  <div class="min-h-screen p-4 bg-white">
    <h1 class="text-2xl font-bold text-blue-800 mb-4">
      DPSCD ESE Program Finder API
    </h1>
    <p v-if="error" class="text-red-600 mb-4">
      Failed to load Swagger UI: {{ error }}
    </p>
    <div id="swagger-ui" ref="swaggerRef" />
  </div>
</template>
