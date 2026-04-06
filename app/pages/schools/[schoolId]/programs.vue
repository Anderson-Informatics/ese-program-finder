<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import ProgramEditor from "~~/app/components/ProgramEditor.vue";
import { UCard, UAlert, USelect, ULink, UButton } from "#components";
import {
  ALLOWED_PROGRAMS,
  PROGRAM_NAMES,
  PROGRAM_GRADE_BANDS,
} from "~~/app/utils/programs";

const route = useRoute();
const router = useRouter();
const schoolId = (route.params.schoolId || "").toString();

const allowedPrograms = ALLOWED_PROGRAMS as unknown as string[];
const programNames = PROGRAM_NAMES as Record<string, string>;
const programBands = PROGRAM_GRADE_BANDS as Record<string, string[]>;

const programDoc = ref<any | null>(null);
const school = ref<any | null>(null);
const loading = ref(true);
const message = ref<string | null>(null);
const messageColor = ref<"success" | "warning" | "info">("success");

// schools selector state
const schools = ref<Array<any>>([]);
const selectedSchool = ref<string>("");
const schoolItems = computed(() =>
  schools.value
    .slice()
    .sort((a: any, b: any) => {
      const an = (a.School || a["School Name"] || a.SchoolName || "")
        .toString()
        .toLowerCase();
      const bn = (b.School || b["School Name"] || b.SchoolName || "")
        .toString()
        .toLowerCase();
      return an.localeCompare(bn);
    })
    .map((s: any) => ({
      label: s.School || s["School Name"] || s.SchoolName || String(s.SchoolID),
      value: String(s.SchoolID),
    })),
);

async function fetchSchools() {
  try {
    // Fetch only schools that have Program documents (server returns names)
    const res: any = await $fetch(`/api/programs/schools`);
    if (Array.isArray(res)) schools.value = res;
    else schools.value = [];
    // once items loaded, set selectedSchool to current school if present
    try {
      const cur = String(schoolId || "");
      if (cur) {
        const found = schools.value.find(
          (s: any) => String(s.SchoolID) === cur,
        );
        if (found) selectedSchool.value = cur;
      }
    } catch (e) {
      /* ignore */
    }
  } catch (e) {
    console.error("Error fetching schools list from programs", e);
    schools.value = [];
  }
}

// client-side auth
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
  // fetch schools list for selector
  fetchSchools();
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
    fetchData();
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

async function fetchData() {
  loading.value = true;
  try {
    // Fetch program doc
    try {
      programDoc.value = await $fetch(`/api/programs/${schoolId}`);
    } catch (err) {
      programDoc.value = null;
    }

    // Fetch school info
    try {
      const schools = await $fetch(`/api/schools?SchoolID=${schoolId}`);
      if (Array.isArray(schools) && schools.length > 0)
        school.value = schools[0];
    } catch (err) {
      school.value = null;
    }
  } finally {
    loading.value = false;
  }
}

fetchData();

watch(selectedSchool, (val) => {
  if (!val) return;
  const id = String(val);
  if (id !== String(schoolId)) {
    router.push(`/schools/${encodeURIComponent(id)}/programs`);
  }
});

async function onSave(payload: Record<string, any>) {
  // payload is { PROGRAMKEY: { band: count } }
  try {
    const pwd =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("admin_password")
        : null;
    const opts: any = { method: "PUT", body: payload };
    if (pwd) opts.headers = { "x-admin-password": pwd };
    const updated = await $fetch(`/api/programs/${schoolId}`, opts);
    programDoc.value = updated;
    message.value = "Saved successfully";
    messageColor.value = "success";
    setTimeout(() => (message.value = null), 3000);
  } catch (err) {
    console.error("Save error", err);
    message.value = "Save failed";
    messageColor.value = "warning";
    setTimeout(() => (message.value = null), 5000);
  }
}

function onSaved(payload: any) {
  message.value = `Saved ${payload.programKey}`;
  messageColor.value = "success";
  setTimeout(() => (message.value = null), 3000);
}

function onError(payload: any) {
  message.value = `Error saving ${payload.programKey}`;
  messageColor.value = "warning";
  setTimeout(() => (message.value = null), 5000);
}
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
    <!-- Sidebar will be inserted here -->
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
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 mb-2"
            >Select School</label
          >
          <USelect
            class="w-full"
            v-model="selectedSchool"
            :items="schoolItems"
            clearable
          />
        </div>

        <div class="text-sm text-slate-600 px-0">
          Use the selector above to switch to a different school's program
          editor.
        </div>
      </div>
    </div>
    <main class="p-4 md:col-span-2 col-span-3">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h1 class="mb-0 text-2xl font-bold text-blue-800">
                Program Availability
              </h1>
              <div class="text-sm text-slate-600">
                {{
                  school?.["School Name"] ||
                  school?.SchoolName ||
                  "School " + schoolId
                }}
              </div>
            </div>
            <div class="text-sm text-slate-600">SchoolID: {{ schoolId }}</div>
          </div>
        </template>

        <template #default>
          <div v-if="loading">Loading...</div>
          <div v-else>
            <UAlert
              v-if="message"
              :color="messageColor"
              closable
              @close="message = null"
              >{{ message }}</UAlert
            >

            <div v-if="!programDoc" class="mb-4">
              <UAlert color="info"
                >No program document found for this school. Create one by saving
                values below.</UAlert
              >
            </div>

            <div class="program-list">
              <ProgramEditor
                v-for="key in allowedPrograms"
                :key="key"
                :programKey="key"
                :name="String(programNames[key] ?? key)"
                :bands="programBands[key] || []"
                :counts="(programDoc && programDoc[key]) || {}"
                :summaries="(programDoc && programDoc._summaries) || {}"
                @save="onSave"
                @saved="onSaved"
                @error="onError"
              />
            </div>
          </div>
        </template>
      </UCard>
    </main>
  </div>
</template>

<style scoped>
.page-container {
  max-width: 1100px;
  margin: 20px auto;
  padding: 12px;
}
.program-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 16px;
}

.muted {
  color: #64748b;
}

.u-alert {
  margin-bottom: 12px;
}

@media (max-width: 420px) {
  .program-list {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
