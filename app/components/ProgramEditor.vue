<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { PropType } from "vue";
import { UCard, UButton, UFormField, UInputNumber } from "#components";

type Props = {
  programKey: string;
  name: string;
  bands: string[];
  counts?: Record<string, number>;
  summaries?: Record<string, Record<string, any>>;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "save", payload: Record<string, Record<string, number>>): void;
  (e: "saved", payload: { programKey: string }): void;
  (e: "error", payload: { programKey: string; error: any }): void;
}>();

const localCounts = ref<Record<string, number>>({});
const saving = ref(false);

const currentTotal = computed(() => {
  if (!props.counts) return null;
  return Object.values(props.counts).reduce(
    (s, v) => s + (typeof v === "number" ? v : 0),
    0,
  );
});

const editedTotal = computed(() => {
  return Object.values(localCounts.value).reduce(
    (s, v) => s + (typeof v === "number" ? v : 0),
    0,
  );
});

const changes = computed(() => {
  const out: Array<{ band: string; before: number; after: number }> = [];
  for (const b of props.bands) {
    const before =
      props.counts && typeof props.counts[b] === "number" ? props.counts[b] : 0;
    const after =
      typeof localCounts.value[b] === "number" ? localCounts.value[b] : 0;
    if (before !== after) out.push({ band: b, before, after });
  }
  return out;
});

const programSummaries = computed(() => {
  if (!props.summaries) return {} as Record<string, any>;
  return (props.summaries as Record<string, any>)[props.programKey] || {};
});

const capacityTotal = computed(() => {
  let s = 0;
  for (const band of props.bands) {
    const entry = programSummaries.value[band];
    if (entry && typeof entry.Capacity === "number") s += entry.Capacity;
  }
  return s;
});

const enrolledTotal = computed(() => {
  let s = 0;
  for (const band of props.bands) {
    const entry = programSummaries.value[band];
    if (entry && typeof entry.Enrolled === "number") s += entry.Enrolled;
  }
  return s;
});

const progressPct = computed(() => {
  if (capacityTotal.value <= 0) return 0;
  return Math.round((enrolledTotal.value / capacityTotal.value) * 100);
});

const progressColor = computed(() => {
  const p = progressPct.value;
  if (p >= 100) return "#dc2626"; // red
  if (p >= 90) return "#f97316"; // orange
  if (p >= 75) return "#f59e0b"; // yellow/orange
  return "#16a34a"; // green
});

function progressColorBand(entry: any) {
  const cap = entry?.Capacity ?? 0;
  const en = entry?.Enrolled ?? 0;
  if (cap <= 0) return "#16a34a";
  const p = Math.round((en / cap) * 100);
  if (p >= 100) return "#dc2626";
  if (p >= 90) return "#f97316";
  if (p >= 75) return "#f59e0b";
  return "#16a34a";
}

function initCounts() {
  const obj: Record<string, number> = {};
  for (const b of props.bands) {
    obj[b] =
      props.counts && typeof props.counts[b] === "number" ? props.counts[b] : 0;
  }
  localCounts.value = obj;
}

initCounts();

watch(() => props.counts, initCounts, { deep: true });

const dirty = computed(() => {
  if (!props.counts)
    return Object.values(localCounts.value).some((v) => v !== 0);
  return props.bands.some(
    (b) => (props.counts?.[b] || 0) !== (localCounts.value[b] || 0),
  );
});

function reset() {
  initCounts();
}

async function save() {
  saving.value = true;
  try {
    const key = props.programKey;
    const payload: Record<string, Record<string, number>> = { [key]: {} };
    const bandMap = payload[key]!;
    for (const b of props.bands) bandMap[b] = localCounts.value[b] || 0;
    await emit("save", payload);
    emit("saved", { programKey: props.programKey });
  } catch (e) {
    emit("error", { programKey: props.programKey, error: e });
    throw e;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <UCard class="program-editor">
    <template #header>
      <div class="header-row">
        <div>
          <h3 class="title">{{ name }}</h3>
          <div class="key">{{ programKey }}</div>
        </div>
        <div class="totals">
          <div class="total-label">Total</div>
          <div
            :class="['total-value', { changed: editedTotal !== currentTotal }]"
          >
            {{ editedTotal }}
            <small v-if="currentTotal !== null && editedTotal !== currentTotal"
              >(was {{ currentTotal }})</small
            >
          </div>
        </div>
      </div>
      <div class="progress-wrap" v-if="capacityTotal > 0 || enrolledTotal > 0">
        <div class="progress">
          <div
            class="progress-fill"
            :style="{ width: progressPct + '%', background: progressColor }"
          ></div>
        </div>
        <div class="progress-text">
          {{ enrolledTotal }} / {{ capacityTotal }} ({{ progressPct }}%)
        </div>
      </div>
    </template>

    <div class="body">
      <div v-for="band in bands" :key="band" class="row">
        <UFormField :label="band">
          <UInputNumber
            v-model="localCounts[band]"
            :min="0"
            :step="1"
            controls
            class="u-input"
          />
        </UFormField>
        <div
          class="band-summary"
          v-if="programSummaries[band] && programSummaries[band].Capacity > 0"
        >
          <div class="band-progress">
            <div
              class="band-progress-fill"
              :style="{
                width:
                  Math.round(
                    ((programSummaries[band].Enrolled || 0) /
                      (programSummaries[band].Capacity || 1)) *
                      100,
                  ) + '%',
                background: progressColorBand(programSummaries[band]),
              }"
            ></div>
          </div>
          <div class="progress-text-small">
            {{ programSummaries[band].Enrolled || 0 }} /
            {{ programSummaries[band].Capacity || 0 }} ({{
              Math.round(
                ((programSummaries[band].Enrolled || 0) /
                  (programSummaries[band].Capacity || 1)) *
                  100,
              )
            }}%)
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="controls">
        <div class="footer-left">
          <div v-if="changes.length === 0" class="small">No changes</div>
          <ul v-else class="changes-list">
            <li v-for="c in changes" :key="c.band">
              <strong>{{ c.band }}</strong
              >: {{ c.before }} → {{ c.after }}
            </li>
          </ul>
        </div>
        <div>
          <UButton
            class="mr-2"
            :disabled="!dirty || saving"
            color="primary"
            @click="save"
            >{{ saving ? "Saving..." : "Save" }}</UButton
          >
          <UButton :disabled="saving" color="neutral" @click="reset"
            >Reset</UButton
          >
        </div>
      </div>
    </template>
  </UCard>
</template>

<style scoped>
.program-editor {
  margin-bottom: 12px;
}
.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.title {
  margin: 0;
  font-size: 1.05rem;
}
.key {
  color: var(--gray-600);
}
.totals {
  text-align: right;
}
.total-label {
  font-size: 0.75rem;
  color: var(--gray-500);
}
.total-value {
  font-weight: 600;
}
.total-value.changed {
  color: var(--primary);
}
.progress-wrap {
  margin-top: 8px;
}
.progress {
  height: 10px;
  background: #eee;
  border-radius: 6px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--primary);
  width: 0%;
  transition: width 300ms ease;
}
.progress-text {
  font-size: 0.8rem;
  color: var(--gray-600);
  margin-top: 6px;
  text-align: right;
}
.row {
  margin-bottom: 8px;
}
.controls {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.footer-left {
  flex: 1 1 auto;
  text-align: left;
}
.u-input {
  width: 120px;
}

.changes-list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.95rem;
  color: var(--gray-700);
}
.changes-list li {
  margin-bottom: 2px;
}

.body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.row {
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  gap: 12px;
}

@media (max-width: 520px) {
  .row {
    flex-direction: column;
    align-items: stretch;
  }
  .u-input {
    width: 100%;
  }
}

@media (min-width: 900px) {
  .program-editor {
    padding: 12px 16px;
  }
}

.band-summary {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 2px;
  font-size: 0.8rem;
  color: var(--gray-600);
  flex: 1 1 auto;
  margin-left: 8px;
}

.band-progress {
  width: 100%;
  height: 8px;
  background: #eee;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0px;
}
.band-progress-fill {
  height: 100%;
  width: 0%;
  transition: width 300ms ease;
}
.progress-text-small {
  font-size: 0.75rem;
  color: var(--gray-600);
  margin-top: 0px;
  text-align: right;
  width: 100%;
}
</style>
