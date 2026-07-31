<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { parseCsv } from "~~/server/utils/parseCsv";

useHead({
  title: "Bulk Geocode Addresses",
});

const isAuthenticated = ref(false);
const loginPassword = ref("");
const loginLoading = ref(false);
const loginError = ref<string | null>(null);

const file = ref<File | null>(null);
const geocoding = ref(false);
const geocodeError = ref<string | null>(null);
const geocodedRows = ref<any[] | null>(null);
const geocodedProgress = ref(0);
const geocodedTotal = ref(0);
const geocodeEta = ref<string | null>(null);
const geocodeStartTime = ref<number | null>(null);

const job = ref<any>(null);
const processing = ref(false);
const processingError = ref<string | null>(null);
const assignmentStartTime = ref<number | null>(null);

const assignmentProgress = computed(() => {
  if (!job.value || !job.value.total) return 0;
  return Math.round((job.value.processed / job.value.total) * 100);
});

const geocodeProgressPercent = computed(() => {
  if (!geocodedTotal.value) return 0;
  return Math.round((geocodedProgress.value / geocodedTotal.value) * 100);
});

function getPassword(): string | null {
  try {
    return localStorage.getItem("admin_password");
  } catch (e) {
    return null;
  }
}

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
  geocodedRows.value = null;
  job.value = null;
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  file.value = target.files?.[0] ?? null;
}

function toCsvValue(value: any): string {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

function toCsv(rows: any[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.map(toCsvValue).join(",")];
  for (const row of rows) {
    const cells = headers.map((h) => toCsvValue(row[h]));
    lines.push(cells.join(","));
  }
  return lines.join("\n");
}

function geocodeEtaText(): string {
  if (!geocodeStartTime.value || geocodedProgress.value === 0) return "Estimating…";
  const elapsed = Date.now() - geocodeStartTime.value;
  const rate = geocodedProgress.value / (elapsed / 1000);
  const remaining = geocodedTotal.value - geocodedProgress.value;
  const seconds = rate > 0 ? Math.ceil(remaining / rate) : 0;
  const minutes = Math.ceil(seconds / 60);
  if (seconds < 60) return `${seconds}s remaining`;
  return `${minutes} minute${minutes === 1 ? "" : "s"} remaining`;
}

function assignmentEtaText(): string {
  if (!assignmentStartTime.value || !job.value || job.value.processed === 0)
    return "Estimating…";
  const elapsed = Date.now() - assignmentStartTime.value;
  const rate = job.value.processed / (elapsed / 1000);
  const remaining = job.value.total - job.value.processed;
  const seconds = rate > 0 ? Math.ceil(remaining / rate) : 0;
  const minutes = Math.ceil(seconds / 60);
  if (seconds < 60) return `${seconds}s remaining`;
  return `${minutes} minute${minutes === 1 ? "" : "s"} remaining`;
}

async function geocodeAll() {
  if (!file.value) return;
  const password = getPassword();
  if (!password) {
    isAuthenticated.value = false;
    return;
  }

  geocoding.value = true;
  geocodeError.value = null;
  geocodedRows.value = null;
  geocodedProgress.value = 0;
  geocodeStartTime.value = Date.now();
  job.value = null;
  processingError.value = null;

  try {
    const text = await file.value.text();
    const { rows } = parseCsv(text);
    geocodedTotal.value = rows.length;

    const batchSize = 100;
    const all: any[] = [];

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const result = await $fetch(`/api/geocode`, {
        method: "POST",
        body: batch,
        headers: { "x-admin-password": password },
      });
      all.push(...(result as any[]));
      geocodedProgress.value = all.length;
      geocodeEta.value = geocodeEtaText();
    }

    geocodedRows.value = all;
    geocodeEta.value = null;
  } catch (err: any) {
    geocodeError.value =
      err?.data?.statusMessage || err?.message || "Geocoding failed";
  } finally {
    geocoding.value = false;
  }
}

function downloadGeocodedCsv() {
  if (!geocodedRows.value) return;
  const csv = toCsv(geocodedRows.value);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "geocoded.csv";
  a.click();
  URL.revokeObjectURL(url);
}

async function startAssignment() {
  if (!geocodedRows.value) return;
  const password = getPassword();
  if (!password) {
    isAuthenticated.value = false;
    return;
  }

  // Validate that a grade column exists
  const keys = Object.keys(geocodedRows.value[0]).map((k) => k.toLowerCase().replace(/[-_]/g, ""));
  if (!keys.includes("grade") && !keys.includes("gradelevel")) {
    processingError.value =
      "A grade column is required to run neighborhood assignment. Add grade, gradelevel, or grade_level.";
    return;
  }

  processing.value = true;
  processingError.value = null;
  job.value = null;
  assignmentStartTime.value = Date.now();

  const csv = toCsv(geocodedRows.value);
  const blob = new Blob([csv], { type: "text/csv" });
  const formData = new FormData();
  formData.append("file", new File([blob], "geocoded.csv", { type: "text/csv" }));

  try {
    const result = await $fetch(`/api/boundaries/jobs`, {
      method: "POST",
      body: formData,
      headers: { "x-admin-password": password },
    });
    job.value = result;
    setTimeout(processNextChunk, 300);
  } catch (err: any) {
    processing.value = false;
    processingError.value =
      err?.data?.statusMessage || err?.message || "Assignment upload failed";
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
        headers: { "x-admin-password": password },
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
      err?.data?.statusMessage || err?.message || "Assignment processing failed";
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
        headers: { "x-admin-password": password },
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
        Bulk Geocode and Assign Neighborhoods
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
            Upload a CSV with address columns (street/address, city, state, zip)
            and a grade column.
          </p>
          <UButton variant="ghost" @click="doLogout"> Log out </UButton>
        </div>

        <p class="text-sm text-amber-700 mb-4">
          For now, keep uploads under ~1,000 addresses to avoid HERE rate limits
          and Netlify function timeouts. Larger files are processed in
          100-row chunks, so a very large file can take several minutes.
        </p>

        <form
          @submit.prevent="geocodeAll"
          class="flex flex-col sm:flex-row gap-4 items-start sm:items-end mb-6"
        >
          <div class="flex-1 w-full">
            <label
              for="geocode-file"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              Address CSV
            </label>
            <input
              id="geocode-file"
              type="file"
              accept=".csv"
              class="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              @change="onFileChange"
            />
          </div>
          <UButton
            type="submit"
            :loading="geocoding"
            :disabled="!file || geocoding"
          >
            Geocode
          </UButton>
        </form>

        <p v-if="geocodeError" class="text-red-600 mb-4">{{ geocodeError }}</p>
        <p v-if="processingError" class="text-red-600 mb-4">{{ processingError }}</p>

        <div v-if="geocoding" class="border rounded p-4 bg-gray-50 mb-6">
          <div class="flex justify-between mb-2">
            <span class="font-medium">Geocoding…</span>
            <span class="text-gray-600">
              {{ geocodedProgress }} / {{ geocodedTotal }} addresses
            </span>
          </div>
          <div class="w-full bg-gray-200 rounded h-4 mb-2">
            <div
              class="bg-blue-600 h-4 rounded transition-all duration-300"
              :style="{ width: `${geocodeProgressPercent}%` }"
            />
          </div>
          <p class="text-sm text-gray-600">
            {{ geocodeProgressPercent }}% — {{ geocodeEta }}
          </p>
        </div>

        <div
          v-else-if="geocodedRows && geocodedRows.length > 0"
          class="border rounded p-4 bg-gray-50 mb-6"
        >
          <p class="font-medium mb-2">
            Geocoding complete: {{ geocodedRows.length }} addresses
          </p>
          <div class="flex flex-wrap gap-3 mb-4">
            <UButton variant="outline" @click="downloadGeocodedCsv">
              Download geocoded CSV
            </UButton>
            <UButton @click="startAssignment">
              Run Neighborhood Assignment
            </UButton>
          </div>
          <p class="text-sm text-gray-600">
            lat/lng have been added. Click “Run Neighborhood Assignment” to
            process the geocoded file through the same bulk boundary tool.
          </p>
        </div>

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
              class="bg-green-600 h-4 rounded transition-all duration-300"
              :style="{ width: `${assignmentProgress}%` }"
            />
          </div>
          <p class="text-sm text-gray-600 mb-4">
            {{ assignmentProgress }}% — {{ assignmentEtaText() }}
          </p>

          <div v-if="job.status === 'completed'" class="flex gap-3">
            <UButton @click="downloadResults('csv')"> Download CSV </UButton>
            <UButton variant="outline" @click="downloadResults('json')">
              Download JSON
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
