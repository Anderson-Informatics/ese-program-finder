<script setup lang="ts">
import { ref, computed, onMounted } from "vue";

useHead({
  title: "Bulk Process Neighborhood Assignments",
});

const isAuthenticated = ref(false);
const loginPassword = ref("");
const loginLoading = ref(false);
const loginError = ref<string | null>(null);

const file = ref<File | null>(null);
const uploading = ref(false);
const uploadError = ref<string | null>(null);

const job = ref<any>(null);
const processing = ref(false);
const processingError = ref<string | null>(null);
const startTime = ref<number | null>(null);

const progressPercent = computed(() => {
  if (!job.value || !job.value.total) return 0;
  return Math.round((job.value.processed / job.value.total) * 100);
});

const etaText = computed(() => {
  if (!job.value || !startTime.value || job.value.processed === 0) return "Estimating…";
  const elapsed = Date.now() - startTime.value;
  const rate = job.value.processed / (elapsed / 1000);
  const remaining = job.value.total - job.value.processed;
  const seconds = rate > 0 ? Math.ceil(remaining / rate) : 0;
  const minutes = Math.ceil(seconds / 60);
  if (seconds < 60) return `${seconds}s remaining`;
  return `${minutes} minute${minutes === 1 ? "" : "s"} remaining`;
});

onMounted(() => {
  try {
    isAuthenticated.value = !!localStorage.getItem("admin_password");
  } catch (e) {
    isAuthenticated.value = false;
  }
});

async function doLogin() {
  loginError.value = null;
  loginLoading.value = true;
  try {
    await $fetch(`/api/admin/login`, {
      method: "POST",
      body: { password: loginPassword.value },
    });
    localStorage.setItem("admin_password", loginPassword.value);
    isAuthenticated.value = true;
    loginPassword.value = "";
  } catch (err) {
    loginError.value = "Invalid password";
  } finally {
    loginLoading.value = false;
  }
}

function doLogout() {
  try {
    localStorage.removeItem("admin_password");
  } catch (e) {}
  isAuthenticated.value = false;
  job.value = null;
  processing.value = false;
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  file.value = target.files?.[0] ?? null;
}

function getPassword(): string | null {
  try {
    return localStorage.getItem("admin_password");
  } catch (e) {
    return null;
  }
}

async function uploadFile() {
  if (!file.value) return;
  const password = getPassword();
  if (!password) {
    isAuthenticated.value = false;
    return;
  }

  uploading.value = true;
  uploadError.value = null;
  job.value = null;

  const formData = new FormData();
  formData.append("file", file.value);

  try {
    const result = await $fetch(`/api/boundaries/jobs`, {
      method: "POST",
      body: formData,
      headers: {
        "x-admin-password": password,
      },
    });
    job.value = result;
    startTime.value = Date.now();
    processing.value = true;
    setTimeout(processNextChunk, 300);
  } catch (err: any) {
    uploadError.value =
      err?.data?.statusMessage || err?.message || "Upload failed";
  } finally {
    uploading.value = false;
  }
}

async function processNextChunk() {
  if (!job.value) return;
  const password = getPassword();
  if (!password) {
    isAuthenticated.value = false;
    return;
  }

  try {
    const result = await $fetch(
      `/api/boundaries/jobs/${job.value.jobId}/next`,
      {
        method: "POST",
        headers: {
          "x-admin-password": password,
        },
      }
    );
    job.value = result;

    if (result.hasMore) {
      setTimeout(processNextChunk, 300);
    } else {
      processing.value = false;
    }
  } catch (err: any) {
    processing.value = false;
    processingError.value =
      err?.data?.statusMessage || err?.message || "Processing failed";
  }
}

async function downloadResults(format: "csv" | "json") {
  if (!job.value) return;
  const password = getPassword();
  if (!password) {
    isAuthenticated.value = false;
    return;
  }

  try {
    const content = await $fetch(
      `/api/boundaries/jobs/${job.value.jobId}/results?format=${format}`,
      {
        headers: {
          "x-admin-password": password,
        },
        responseType: format === "csv" ? "text" : "json",
      }
    );

    if (format === "csv") {
      const blob = new Blob([content as string], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bulk-boundaries-${job.value.jobId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const blob = new Blob([JSON.stringify(content, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bulk-boundaries-${job.value.jobId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  } catch (err: any) {
    processingError.value =
      err?.data?.statusMessage || err?.message || "Download failed";
  }
}
</script>

<template>
  <div class="min-h-screen p-4 bg-white">
    <div class="max-w-3xl mx-auto">
      <h1 class="text-2xl font-bold text-blue-800 mb-4">
        Bulk Process Neighborhood Assignments
      </h1>

      <NuxtLink
        to="/admin"
        class="text-blue-600 hover:underline mb-6 inline-block"
      >
        &larr; Back to Admin
      </NuxtLink>

      <div v-if="!isAuthenticated" class="mb-6">
        <p class="mb-4 text-gray-700">
          This page is admin-only. Please enter the admin password to continue.
        </p>
        <form @submit.prevent="doLogin" class="flex flex-col gap-3 max-w-sm">
          <UInput
            v-model="loginPassword"
            type="password"
            placeholder="Admin password"
          />
          <UButton type="submit" :loading="loginLoading"> Log in </UButton>
          <p v-if="loginError" class="text-red-600">{{ loginError }}</p>
        </form>
      </div>

      <div v-else>
        <div class="flex justify-between items-center mb-4">
          <p class="text-gray-700">
            Upload a CSV or JSON file with latitude, longitude, and grade
            columns.
          </p>
          <UButton variant="ghost" @click="doLogout"> Log out </UButton>
        </div>

        <form
          @submit.prevent="uploadFile"
          class="flex flex-col sm:flex-row gap-4 items-start sm:items-end mb-6"
        >
          <div class="flex-1 w-full">
            <label
              for="bulk-file"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              CSV or JSON file (max ~50,000 rows)
            </label>
            <input
              id="bulk-file"
              type="file"
              accept=".csv,.json"
              class="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              @change="onFileChange"
            />
          </div>
          <UButton
            type="submit"
            :loading="uploading"
            :disabled="!file || uploading"
          >
            Upload
          </UButton>
        </form>

        <p v-if="uploadError" class="text-red-600 mb-4">{{ uploadError }}</p>

        <div
          v-if="job"
          class="border rounded p-4 bg-gray-50"
        >
          <div class="flex justify-between mb-2">
            <span class="font-medium">{{ job.status }}</span>
            <span class="text-gray-600">
              {{ job.processed }} / {{ job.total }} students
            </span>
          </div>

          <div class="w-full bg-gray-200 rounded h-4 mb-2">
            <div
              class="bg-blue-600 h-4 rounded transition-all duration-300"
              :style="{ width: `${progressPercent}%` }"
            />
          </div>

          <p class="text-sm text-gray-600 mb-4">
            {{ progressPercent }}% — {{ etaText }}
          </p>

          <p v-if="processingError" class="text-red-600 mb-4">
            {{ processingError }}
          </p>

          <div v-if="job.status === 'completed'" class="flex gap-3">
            <UButton @click="downloadResults('csv')">
              Download CSV
            </UButton>
            <UButton variant="outline" @click="downloadResults('json')">
              Download JSON
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
