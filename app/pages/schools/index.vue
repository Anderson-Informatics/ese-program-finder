<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { UCard, USelect, ULink } from "#components";
import { useRouter, useRoute } from "vue-router";
import {
  ALLOWED_PROGRAMS,
  PROGRAM_NAMES,
  PROGRAM_GRADE_BANDS,
} from "~/utils/programs";

const allowed = ALLOWED_PROGRAMS as readonly string[];
const names = PROGRAM_NAMES as Record<string, string>;

const selected = ref<string>(allowed[0] as string);
const rows = ref<Array<any>>([]);
const loading = ref(false);

// simple client-side auth state
const isAuthenticated = ref(false);
const loginPassword = ref("");
const loginLoading = ref(false);
const loginError = ref<string | null>(null);

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
    fetchForProgram();
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
}

const selectItems = computed(() =>
  allowed
    .slice()
    .map((k) => ({ label: String(names[k] ?? k), value: k }))
    .sort((a, b) => String(a.label).localeCompare(String(b.label))),
);

const route = useRoute();

const bands = computed(() => PROGRAM_GRADE_BANDS[selected.value] || []);

const sortKey = ref<string>("_total");
const sortDir = ref<number>(-1); // -1 = desc, 1 = asc

function setSort(key: string) {
  if (sortKey.value === key) sortDir.value = -sortDir.value;
  else {
    sortKey.value = key;
    sortDir.value = -1;
  }
}

const sortedRows = computed(() => {
  // compute total per row
  const withTotals = rows.value.map((r) => {
    const total = (bands.value || []).reduce((acc, b) => {
      const v = r.counts?.[b];
      const n = typeof v === "number" ? v : Number(v ?? 0);
      return acc + (Number.isNaN(n) ? 0 : n);
    }, 0);
    return { ...r, _total: total };
  });

  // sorting
  const key = sortKey.value;
  const dir = sortDir.value;
  return withTotals.slice().sort((a: any, b: any) => {
    if (key === "School") {
      const an = (a.School || "").toString().toLowerCase();
      const bn = (b.School || "").toString().toLowerCase();
      if (an < bn) return -1 * dir;
      if (an > bn) return 1 * dir;
      return 0;
    }
    const aval =
      key === "_total" ? a._total || 0 : Number(a.counts?.[key] ?? 0);
    const bval =
      key === "_total" ? b._total || 0 : Number(b.counts?.[key] ?? 0);
    return (aval - bval) * dir;
  });
});

function formatCount(val: any) {
  if (val === undefined || val === null) return 0;
  if (typeof val === "number") return val;
  // If stored as string, try parse
  const n = Number(val);
  return Number.isNaN(n) ? 0 : n;
}

async function fetchForProgram() {
  loading.value = true;
  try {
    const res = await $fetch(
      `/api/programs/byProgram?program=${encodeURIComponent(selected.value)}`,
    );
    // If the server returned a non-empty array, use it. If it returned
    // an empty array, don't overwrite any existing rows that may have
    // been rendered on the server to avoid a flicker where the list
    // briefly appears then disappears due to a client-side empty fetch.
    if (Array.isArray(res) && res.length > 0) {
      rows.value = res;
    } else if (!Array.isArray(res) && rows.value.length === 0) {
      rows.value = [];
    }
  } catch (err) {
    console.error("Error fetching program list", err);
    rows.value = [];
  } finally {
    loading.value = false;
  }
}

const router = useRouter();

function goToSchool(schoolId: number | string) {
  if (!schoolId) return;
  router.push(`/schools/${schoolId}/programs`);
}

watch(selected, () => fetchForProgram());
onMounted(fetchForProgram);
</script>

<template>
  <div v-if="!isAuthenticated" class="max-w-md mx-auto p-6">
    <UCard class="p-4">
      <h2 class="text-xl font-bold mb-2">Admin Login</h2>
      <div class="mb-2">
        <UInput
          type="password"
          v-model="loginPassword"
          placeholder="Enter admin password"
          @keyup.enter="doLogin"
        />
      </div>
      <div class="flex items-center gap-2">
        <UButton :loading="loginLoading" @click="doLogin">Log in</UButton>
      </div>
      <div v-if="loginError" class="text-red-600 mt-2">{{ loginError }}</div>
    </UCard>
  </div>

  <div v-else class="grid grid-cols-3 h-screen">
    <!-- Left sidebar -->
    <div
      class="md:col-span-1 col-span-3 md:sticky md:top-0 md:h-screen md:overflow-auto"
    >
      <img src="/Logo.png" alt="Logo" class="h-20 m-2 float-left" />
      <span class="text-2xl font-bold text-blue-800 block m-4"
        >DPSCD ESE Program Finder</span
      >
      <hr class="mr-6 ml-6 clear-both text-blue-800" />
      <div class="px-6 pt-4 pb-2">
        <div class="flex">
          <ULink
            :to="'/admin'"
            :class="[
              'px-3 py-2 text-sm font-medium uppercase w-full text-center',
              route.path.startsWith('/admin')
                ? 'text-blue-800 border-t-2 border-l-2 border-r-2 border-blue-800'
                : 'text-slate-700 bg-slate-100 hover:bg-blue-50 border-b-2 border-blue-800',
            ]"
          >
            Find a Program
          </ULink>
          <ULink
            :to="'/schools'"
            :class="[
              'px-3 py-2 text-sm font-medium uppercase w-full text-center',
              route.path.startsWith('/schools')
                ? 'text-blue-800 border-t-2 border-l-2 border-r-2 border-blue-800'
                : 'text-slate-700 bg-slate-100 hover:bg-blue-50 border-b-2 border-blue-800',
            ]"
          >
            Manage Programs
          </ULink>
          <ULink
            @click="doLogout"
            class="px-3 py-2 text-xs font-medium uppercase text-slate-700 bg-slate-100 hover:bg-blue-100 border-b-2 border-blue-800"
            color="ghost"
          >
            Logout
          </ULink>
        </div>
      </div>
      <div class="px-6">
        <div class="mb-4 w-full">
          <label class="block text-sm font-medium text-slate-700 mb-2"
            >Program Filter</label
          >
          <USelect
            class="w-full"
            v-model="selected"
            :items="selectItems"
            clearable
          />
        </div>

        <div class="text-sm text-slate-600 px-0">
          Select a program to view schools that have reported counts. Click a
          row in the table to open that school's Program Editor page where you
          can review and update counts.
        </div>
      </div>
    </div>

    <!-- Main content -->
    <main class="p-4 md:col-span-2 col-span-3">
      <UCard class="p-4 mb-4">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-bold text-blue-800">
            Schools — Program Matrix
          </h1>
          <div class="text-sm text-slate-600">
            Showing: {{ String(PROGRAM_NAMES[selected] ?? selected) }}
          </div>
        </div>
      </UCard>

      <div v-if="loading" class="loading">Loading…</div>

      <div v-if="!loading">
        <table class="matrix">
          <thead>
            <tr>
              <th
                class="bg-slate-50 text-blue-800 sortable school-header"
                @click="setSort('School')"
              >
                School
                <span v-if="sortKey === 'School'">{{
                  sortDir < 0 ? " ▲" : " ▼"
                }}</span>
              </th>
              <th
                v-for="band in bands"
                :key="band"
                class="bg-slate-50 text-blue-800 sortable"
                @click="setSort(band)"
              >
                {{ band }}
                <span v-if="sortKey === band">{{
                  sortDir < 0 ? " ▲" : " ▼"
                }}</span>
              </th>
              <th
                class="bg-slate-50 text-blue-800 sortable"
                @click="setSort('_total')"
              >
                Total
                <span v-if="sortKey === '_total'">{{
                  sortDir < 0 ? " ▲" : " ▼"
                }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in sortedRows"
              :key="row.SchoolID"
              @click="goToSchool(row.SchoolID)"
              tabindex="0"
              @keydown.enter="goToSchool(row.SchoolID)"
            >
              <td class="school-cell">{{ row.School || row.SchoolID }}</td>
              <td v-for="band in bands" :key="band">
                {{ formatCount(row.counts?.[band]) }}
              </td>
              <td>
                <strong>{{ row._total ?? 0 }}</strong>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="rows.length === 0" class="empty">
          No schools found for this program.
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.controls {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.matrix {
  width: 100%;
  border-collapse: collapse;
}
.matrix th,
.matrix td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
}
.matrix thead th {
  background: #f6f6f6;
}
.sortable {
  cursor: pointer;
  user-select: none;
}
.matrix td.school-cell {
  text-align: left;
  font-weight: 600;
  padding-left: 12px;
}
.matrix thead th.school-header {
  text-align: left;
  padding-left: 12px;
}
.matrix tbody tr {
  cursor: pointer;
}
.matrix tbody tr:hover {
  background: #fafafa;
}
.loading {
  color: #666;
}
.empty {
  margin-top: 8px;
  color: #666;
}
@media (max-width: 700px) {
  .matrix th,
  .matrix td {
    padding: 6px;
    font-size: 13px;
  }
}
</style>
