<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { UFormField } from '#components'

const schema = z.object({
  address: z.string().min(5),
  grade: z.enum(['Birth to 3', 'PreK', 'Kindergarten', '1st grade', '2nd grade', '3rd grade', '4th grade', '5th grade', '6th grade', '7th grade', '8th grade', '9th grade', '10th grade', '11th grade', '12th grade', 'Post-Secondary']),
  program: z.enum([
    'Autism Spectrum Disorder',
    'Day Treatment',
    'Deaf and Hard of Hearing',
    'Dual Diagnosed (Emotionally Impaired)',
    'Early Childhood Special Education',
    'Early Intervention',
    'Emotionally Impaired',
    'Mild Cognitive Impaired',
    'Moderate Cognitive Impaired',
    'Physically/Other Health Impaired',
    'Resource Room',
    'Severe Cognitive Impaired',
    'Severe Multiple Impaired',
    'Visually Impaired'
  ]),
  setting: z.enum(['Center-Based', 'Comprehensive', 'Not Sure'])
})

type Schema = z.output<typeof schema>

const state = reactive({
  address: '',
  grade: undefined as "Birth to 3" | "PreK" | "Kindergarten" | "1st grade" | "2nd grade" | "3rd grade" | "4th grade" | "5th grade" | "6th grade" | "7th grade" | "8th grade" | "9th grade" | "10th grade" | "11th grade" | "12th grade" | "Post-Secondary" | undefined,
  program: undefined as 'Autism Spectrum Disorder' |
    'Day Treatment' |
    'Deaf and Hard of Hearing' |
    'Dual Diagnosed (Emotionally Impaired)' |
    'Early Childhood Special Education' |
    'Early Intervention' |
    'Emotionally Impaired' |
    'Mild Cognitive Impaired' |
    'Moderate Cognitive Impaired' |
    'Physically/Other Health Impaired' |
    'Resource Room' |
    'Severe Cognitive Impaired' |
    'Severe Multiple Impaired' |
    'Visually Impaired' | undefined,
  setting: undefined as 'Center-Based' | 'Comprehensive' | 'Not Sure' | undefined
})

const mapCenter = ref<[number, number]>([42.3797, -83.0925])

const geocode_address = async (address: string) => {
  const apiKey = 'ASdsFNRsscEi5HXC9n3z20er_XG6Vd1ukglGLV5TCi0'
  const url = `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(address)}&apiKey=${apiKey}&qq=state=Michigan`

  try {
    const response = await $fetch(url) as any
    return response.items[0]
  }
  catch (error) {
    console.error('Error fetching geocode:', error)
    return [1, 1]
  }
}

// Some reactive variables for the map and the results
const userAddressPin = ref<number[] | null>(null)

interface Program {
  location: {
    coordinates: [number, number];
  };
  [key: string]: any; // Add other properties as needed
}

const referenceText = ref<string | null>(null)

const showPostSecondary = ref<boolean>(false)
const showResourceRoom = ref<boolean>(false)
const showCenterBased = ref<boolean>(false)
const showDualDiagnosed = ref<boolean>(false)
const showGeneralSupport = ref<boolean>(false)
const loading = ref<boolean>(false)

const assignedProgram = ref<Program | null>(null)
const eligiblePrograms = ref<Program[] | null>(null)
const activeSchoolId = ref<string | null>(null)
const assignmentMethod = ref<string | null>(null)

function setMapCenter(program: Program) {
  if (program.location && program.location.coordinates && Array.isArray(program.location.coordinates)) {
    mapCenter.value = [program.location.coordinates[1], program.location.coordinates[0]]
  }
  activeSchoolId.value = program['SchoolID'] ?? null
}
function setActiveSchool(program: Program) {
  activeSchoolId.value = program['SchoolID'] ?? null
}

function setPinUrl(available: number) {
  if (available > 0) {
    return '/school-green.png'
  } else if (available == 0) {
    return '/school-grey.png'
  } else {
    return '/school-red.png'
  }
}

function setMainPinUrl(available: number) {
  if (available > 0) {
    return '/school-main-green.png'
  } else if (available == 0) {
    return '/school-main-grey.png'
  } else {
    return '/school-main-red.png'
  }
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  console.log(event.data)
  // Reset the reference text and assigned program
  loading.value = true
  referenceText.value = null
  assignedProgram.value = null
  eligiblePrograms.value = null
  showGeneralSupport.value = false
  showDualDiagnosed.value = false
  showCenterBased.value = false
  showPostSecondary.value = false
  showResourceRoom.value = false

  // Handle the home address geocoding and map pinning
  const geocodeResult = await geocode_address(event.data.address)
  if (geocodeResult && 'access' in geocodeResult) {
    if (geocodeResult.access && geocodeResult.access[0]) {
      userAddressPin.value = [geocodeResult.access[0].lat, geocodeResult.access[0].lng]
    } else {
      userAddressPin.value = null
    }
  } else {
    userAddressPin.value = null
  }

  // Handle the program assignment
  if (['Day Treatment', 'Visually Impaired'].includes(event.data.program)) {
    showGeneralSupport.value = true
    assignmentMethod.value = 'Direct to General Support'
  } else if (event.data.program === 'Dual Diagnosed (Emotionally Impaired)') {
    showDualDiagnosed.value = true
    assignmentMethod.value = 'Direct to General Support for Dual Diagnosed'
  } else if (event.data.grade === 'Post-Secondary') {
    showPostSecondary.value = true
    const program = userAddressPin.value
      ? await $fetch(`/api/programs?grade=${event.data.grade}&program=${event.data.program}&lat=${userAddressPin.value[0]}&lng=${userAddressPin.value[1]}&setting=${event.data.setting}`)
      : null;
    assignedProgram.value = program && program[0] && program[0][0] ? program[0][0] : null
    assignmentMethod.value = program && typeof program[1] === 'string' ? program[1] : null
  } else if (event.data.program === 'Resource Room') {
    showResourceRoom.value = true
    const program = userAddressPin.value
      ? await $fetch(`/api/programs?grade=${event.data.grade}&program=${event.data.program}&lat=${userAddressPin.value[0]}&lng=${userAddressPin.value[1]}&setting=${event.data.setting}`)
      : null;
    assignedProgram.value = program && program[0] && program[0][0] ? program[0][0] : null
    assignmentMethod.value = program && typeof program[1] === 'string' ? program[1] : null
  } else if (event.data.setting === 'Center-Based') {
    showCenterBased.value = true
    const program = userAddressPin.value
      ? await $fetch(`/api/programs?grade=${event.data.grade}&program=${event.data.program}&lat=${userAddressPin.value[0]}&lng=${userAddressPin.value[1]}&setting=${event.data.setting}`)
      : null;
    assignedProgram.value = program && program[0] && program[0][0] ? program[0][0] : null
    assignmentMethod.value = program && typeof program[1] === 'string' ? program[1] : null
  } else {
    const program = userAddressPin.value
      ? await $fetch(`/api/programs?grade=${event.data.grade}&program=${event.data.program}&lat=${userAddressPin.value[0]}&lng=${userAddressPin.value[1]}&setting=${event.data.setting}`)
      : null;
    assignedProgram.value = program && program[0] && program[0][0] ? program[0][0] : null
    assignmentMethod.value = program && typeof program[1] === 'string' ? program[1] : null
  }

  // Return all eligible programs
  if (['Day Treatment', 'Visually Impaired'].includes(event.data.program)) {
  } else if (event.data.program === 'Dual Diagnosed (Emotionally Impaired)') {
  } else if (event.data.grade === 'Post-Secondary') {
    const available = userAddressPin.value
      ? await $fetch(`/api/programs/list?grade=${event.data.grade}&program=${event.data.program}&lat=${userAddressPin.value[0]}&lng=${userAddressPin.value[1]}&setting=${event.data.setting}`)
      : null;
    eligiblePrograms.value = available ? available : null
  } else if (event.data.program === 'Resource Room') {
    const available = userAddressPin.value
      ? await $fetch(`/api/programs/list?grade=${event.data.grade}&program=${event.data.program}&lat=${userAddressPin.value[0]}&lng=${userAddressPin.value[1]}&setting=${event.data.setting}`)
      : null;
    eligiblePrograms.value = available ? available : null
  } else if (event.data.setting === 'Center-Based') {
    const available = userAddressPin.value
      ? await $fetch(`/api/programs/list?grade=${event.data.grade}&program=${event.data.program}&lat=${userAddressPin.value[0]}&lng=${userAddressPin.value[1]}&setting=${event.data.setting}`)
      : null;
    eligiblePrograms.value = available ? available : null
  } else {
    const available = userAddressPin.value
      ? await $fetch(`/api/programs/list?grade=${event.data.grade}&program=${event.data.program}&lat=${userAddressPin.value[0]}&lng=${userAddressPin.value[1]}&setting=${event.data.setting}`)
      : null;
    eligiblePrograms.value = available ? available : null
  }

  // Make the map center between the user address and the assigned program
  if (userAddressPin.value && assignedProgram.value) {
    mapCenter.value = [
      ((userAddressPin.value?.[0] ?? 0) + (assignedProgram.value?.location.coordinates?.[1] ?? 0)) / 2,
      ((userAddressPin.value?.[1] ?? 0) + (assignedProgram.value?.location.coordinates?.[0] ?? 0)) / 2
    ]
    loading.value = false
  } else if (userAddressPin.value) {
    mapCenter.value = userAddressPin.value?.length === 2 && userAddressPin.value[0] !== undefined && userAddressPin.value[1] !== undefined
      ? [userAddressPin.value[0], userAddressPin.value[1]]
      : [42.3797, -83.0925]
      loading.value = false
  } else {
    mapCenter.value = [42.3797, -83.0925]
    loading.value = false
  }

}

</script>
<template>
  <div class="grid grid-cols-3 h-screen">
    <div class="md:col-span-1 col-span-3 overflow-y-scroll">
      <img src="/Logo.png" alt="Logo" class="h-20 m-2 float-left" />
      <span class="text-2xl font-bold text-blue-800 block m-4">DPSCD ESE Program
        Finder</span>
      <hr class="mr-6 ml-6 clear-both text-blue-800" />
      <div class="">
        <h1 class="px-6 pt-6">Find a Program</h1>
        <UForm class="px-6" :state="state" @submit="onSubmit">
          <UPopover mode="click" :content="{
            align: 'end',
            side: 'bottom',
            sideOffset: 8
          }">
            <UButton class="w-full mt-2 text-left" color="warning">
              Using the IEP to Determine Program (Placement) vs.
              Disability
            </UButton>
            <template #content>
              <div class="m-4 pt-4 pb-4 size-80 text-sm">
                <strong>Student’s Disability:</strong>
                <p>Found near the beginning of the IEP under "Primary Disability". This lists the primary disability
                  (e.g., Autism Spectrum Disorder, Specific Learning Disability, Cognitive Impairment, Emotional
                  Impairment).</p><br />
                <strong>Program Placement:</strong>
                <p>Found toward the end of the IEP under "Programs and Services" section of the IEP.
                  This explains where services will be provided (e.g., general education, special class, specialized
                  program) and how much time the student will spend in each setting.</p>
              </div>
            </template>
          </UPopover>
          <UFormField name="address" placeholder="Enter your address" :validation="schema.shape.address">
            <UInput class="w-full mt-2" v-model="state.address" placeholder="Enter your address" />
          </UFormField>
          <UFormField name="grade" :validation="schema.shape.grade">
            <USelect class="w-full mt-2" v-model="state.grade" :items="schema.shape.grade.options"
              placeholder="Select a grade">
            </USelect>
          </UFormField>
          <UFormField name="program" :validation="schema.shape.program">
            <USelect class="w-full mt-2" v-model="state.program" :items="schema.shape.program.options"
              placeholder="Select a program">
            </USelect>
          </UFormField>


          <UFormField
            v-if="['Autism Spectrum Disorder', 'Moderate Cognitive Impaired'].includes(state.program ?? '')"
            name="setting" :validation="schema.shape.setting">
            <USelect class="w-full mt-2" v-model="state.setting" :items="schema.shape.setting.options"
              placeholder="Select the primary educational setting">
            </USelect>
          </UFormField>
          <UButton class="mt-2 mb-6 float-right bg-blue-800 hover:bg-blue-400 text-white" type="submit">
            Submit
          </UButton>
        </UForm>
        <hr class="mb-6 clear-both text-blue-800" />
        <UPageList class="clear-both">
          <div v-if="!assignedProgram && !userAddressPin && !loading" class="px-6">
            <p>Please enter your address, grade, and program to see your
              suggested school.</p>
          </div>
          <div v-if="loading" class="px-6">
            <UProgress size="xl" />
          </div>
          <div v-if="referenceText" class="px-6 mb-6">
            <h2 class="text-lg font-bold">Helpful Information</h2>
            {{ referenceText }}
          </div>
          <div v-if="showGeneralSupport" class="px-6 mb-6">
            <h2 class="text-lg font-bold">Further Support</h2>
            <p>Please contact the ESE Office of Enrollment by email: <a
                href="mailto: esespecial.programs@detroitk12.org"
                class="text-blue-800">esespecial.programs@detroitk12.org</a>
              or phone: (313) 748-6363.<br /> Coordination and placement support provided.</p>
          </div>
          <div v-if="showDualDiagnosed" class="px-6 mb-6">
            <h2 class="text-lg font-bold">Further Support</h2>
            <p>Please contact the ESE Office of Enrollment by email: <a
                href="mailto: esespecial.programs@detroitk12.org"
                class="text-blue-800">esespecial.programs@detroitk12.org</a>
              or phone: (313) 748-6363 or enroll at your neighborhood school to receive assistance with enrollment.</p>
          </div>
          <div v-if="showCenterBased" class="px-6 mb-6">
            <h2 class="text-lg font-bold">Separate Facility/Center-Based</h2>
            <p>Student attends a separate school for students with disabilities only and receives specially designed
              instruction by a special education teacher and has limited to no access to general education and
              nondisabled peers.</p>
            <h2 class="text-lg font-bold">Center-Based Placement Criteria</h2>
            <p>Eligibility is determined by the IEP Team. If your student may qualify for a separate facility, please
              contact our ESE Office of Enrollment for review by email: <a
                href="mailto: esespecial.programs@detroitk12.org"
                class="text-blue-800">esespecial.programs@detroitk12.org</a>
              or phone: (313) 748-6363.</p>
          </div>
          <div v-if="showPostSecondary" class="px-6 mb-6">
            <h2 class="text-lg font-bold">Grade 14 / Transition Services (Ages 18–26)</h2>
            <p>Grade 14 services are available for students who have not met their transition goals whose course of
              study has been identified as Certificate of Completion on the IEP and fall between the ages of 18-26.
              Placement is based on student’s individual needs and ESE programs and services.</p>
          </div>
          <div v-if="showResourceRoom" class="px-6 mb-6">
            <p>Resource Room programs are available at all DPSCD schools. Your suggested school is the assigned school
              based on the student's home address and grade level.</p>
          </div>

          <div v-if="assignedProgram === null && userAddressPin && !loading">
            <h2 class="px-6 text-lg font-bold">Program not Available for Selected Grade</h2>
          </div>
          <div v-else-if="assignedProgram" class="px-6 my-2 hover:bg-blue-100 transition-colors" @mouseover="setMapCenter(assignedProgram)" @mouseleave="activeSchoolId = null">
            <h2 class="text-lg font-bold">Suggested Program</h2>
            <ULink :to="assignedProgram.url" target="_blank" class="font-bold">{{ assignedProgram['School Name'] }}
            </ULink>
            <br />
            {{ assignedProgram.Address }}<br />
            {{ assignedProgram['Main office number'] }}<br />
            {{ assignedProgram.Distance.toFixed(1) }} miles away<br />
            {{ assignmentMethod }}
            <div v-if="assignedProgram.ProgramSummary">
              {{ assignedProgram.ProgramSummary.Capacity }} capacity, {{ assignedProgram.ProgramSummary.Enrolled }} enrolled, {{ assignedProgram.ProgramSummary.Remaining }} available
            </div>
          </div>
          <div v-if="eligiblePrograms === undefined">
            <h2 class="px-6 text-lg font-bold">No Other Eligible Programs</h2>
          </div>
          <div v-else-if="eligiblePrograms && eligiblePrograms.length > 0" class="mt-6">
            <h2 class="px-6 text-lg font-bold">Other Eligible Programs</h2>
            <div v-for="program in eligiblePrograms" :key="program['SchoolID']" class="px-6 my-2 hover:bg-blue-100 transition-colors" @mouseover="setMapCenter(program)" @mouseleave="activeSchoolId = null">
              <ULink :to="program.url" target="_blank" class="font-bold">{{ program['School Name'] }}
              </ULink>
              <br />
              <span class="text-sm">{{ program.Address }}</span><br />
              <span class="text-sm">{{ program['Main office number'] }}</span><br />
              {{ program.Distance.toFixed(1) }} miles away
              <div v-if="assignedProgram.ProgramSummary">
                {{ program.ProgramSummary.Capacity }} capacity, {{ program.ProgramSummary.Enrolled }} enrolled, {{ program.ProgramSummary.Remaining }} available
              </div>
            </div>
          </div>
        </UPageList>
      </div>
    </div>
    <div class="hidden col-span-2 fixed md:block relative">
      <div v-if="!assignedProgram && !userAddressPin"
        class="m-auto p-6 w-3/5 h-3/5 bg-white opacity-75 rounded-lg absolute z-10 inset-20">
        <p class="opacity-100 p-6 text-2xl text-gray-950 justify-center text-center"><em>Please enter the student's
            information on the
            left to
            see your
            suggested ESE program on the map.</em></p>
      </div>
      <LMap class="h-full z-0" :zoom="12" :center="mapCenter" :use-global-leaflet="false">
        <LTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&amp;copy; <a href=&quot;https://www.openstreetmap.org/&quot;>OpenStreetMap</a> contributors"
          layer-type="base" name="OpenStreetMap" />
        <LMarker v-if='userAddressPin && userAddressPin.length === 2'
          :lat-lng="[userAddressPin[0] ?? 0, userAddressPin[1] ?? 0]">
          <l-icon icon-url="/home.png" :icon-size="[60, 60]" :icon-anchor="[24, 60]" />
        </LMarker>
        <LMarker v-if='assignedProgram'
          :lat-lng="[assignedProgram.location.coordinates[1], assignedProgram.location.coordinates[0]]" @mouseover="setActiveSchool(assignedProgram)" @mouseout="activeSchoolId = null">
          <l-icon :icon-url="setMainPinUrl(assignedProgram.ProgramSummary.Remaining)" :icon-size="[60, 60]" :icon-anchor="[24, 60]" />
          <LTooltip v-if="activeSchoolId == assignedProgram['SchoolID']" :options="{ permanent: true, direction: 'bottom' }">
            <div v-if="assignedProgram">
            <ULink :to="assignedProgram.url" target="_blank" class="font-bold">{{ assignedProgram['School Name'] }}
            </ULink>
            <br />
            {{ assignedProgram.Address }}<br />
            {{ assignedProgram['Main office number'] }}
          </div>
          </LTooltip>
        </LMarker>
        <div v-if="eligiblePrograms === undefined"></div>
        <div v-else-if="eligiblePrograms && eligiblePrograms.length > 0">
          <LMarker v-for="program in eligiblePrograms" :key="program['SchoolID']"
            :lat-lng="[program.location.coordinates[1], program.location.coordinates[0]]" @mouseover="setActiveSchool(program)" @mouseout="activeSchoolId = null">
            <l-icon :icon-url="setPinUrl(program.ProgramSummary.Remaining)" :icon-size="[40, 40]" :icon-anchor="[16, 40]" />
            <LTooltip v-if="activeSchoolId == program['SchoolID']" :options="{ permanent: true, direction: 'bottom' }">
              <div v-if="program">
                <ULink :to="program.url" target="_blank" class="font-bold">{{ program['School Name'] }}
                </ULink>
                <br />
                {{ program.Address }}<br />
                {{ program['Main office number'] }}<br />
              </div>
            </LTooltip>
          </LMarker>
        </div>
      </LMap>
    </div>
  </div>
</template>
