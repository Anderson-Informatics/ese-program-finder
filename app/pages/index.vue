<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { UFormField } from '#components'

const schema = z.object({
  address: z.string().min(5),
  grade: z.enum(['PreK', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']),
  program: z.enum(['ASD', 'MOCI', 'MICI', 'ECSE', 'HI', 'VI', 'DHH']),
})

type Schema = z.output<typeof schema>

const state = reactive({
  address: '',
  grade: undefined as "PreK" | "K" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12" | undefined,
  program: undefined as "ASD" | "MOCI" | "MICI" | "ECSE" | "HI" | "VI" | "DHH" | undefined,
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
interface AssignedProgram {
  location: {
    coordinates: [number, number];
  };
  [key: string]: any; // Add other properties as needed
}

const assignedProgram = ref<AssignedProgram | null>(null)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  console.log(event.data)
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
  const program = userAddressPin.value
    ? await $fetch(`/api/programs?grade=${event.data.grade}&program=${event.data.program}&lat=${userAddressPin.value[0]}&lng=${userAddressPin.value[1]}`)
    : null;
  assignedProgram.value = program && program[0] ? program[0] : null

  // Make the map center between the user address and the assigned program
  if (userAddressPin.value && assignedProgram.value) {
    mapCenter.value = [
      ((userAddressPin.value?.[0] ?? 0) + (assignedProgram.value?.location.coordinates?.[1] ?? 0)) / 2,
      ((userAddressPin.value?.[1] ?? 0) + (assignedProgram.value?.location.coordinates?.[0] ?? 0)) / 2
    ]
  } else if (userAddressPin.value) {
    mapCenter.value = userAddressPin.value?.length === 2 && userAddressPin.value[0] !== undefined && userAddressPin.value[1] !== undefined
      ? [userAddressPin.value[0], userAddressPin.value[1]]
      : [42.3797, -83.0925]
  } else {
    mapCenter.value = [42.3797, -83.0925]
  }
}

</script>
<template>
  <div class="grid grid-cols-3 h-screen">
    <div class="md:col-span-1 col-span-3 bg-white">
      <img src="/Logo.png" alt="Logo" class="h-20 m-2 float-left" />
      <span class="text-2xl font-bold text-blue-800 block m-4">DPSCD ESE Program
        Finder</span>
      <hr class="mr-6 ml-6 clear-both text-blue-800" />
      <div class="p-6 scheme-light">
        <h1>Find a Program</h1>
        <UForm :state="state" @submit="onSubmit">
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
          <UButton class="mt-2 mb-6 float-right bg-blue-800 hover:bg-blue-400 text-white" type="submit">
            Submit
          </UButton>
        </UForm>
        <hr class="mb-6 clear-both text-blue-800" />
        <UPageList divide class="clear-both">
          <p v-if="!assignedProgram">Please enter your address, grade, and program to see your assigned school.</p>
          <div v-if="assignedProgram">
            <h2 class="text-lg font-bold">Assigned Program</h2>
            {{ assignedProgram['School Name'] }}<br />
            {{ assignedProgram.Address }}<br />
            {{ assignedProgram.Type }}
          </div>
        </UPageList>
      </div>

    </div>
    <div class="hidden col-span-2 md:block relative">
      <div v-if="!assignedProgram && !userAddressPin"
        class="m-auto p-6 w-3/5 h-3/5 bg-white opacity-75 rounded-lg absolute z-10 inset-20">
        <p class="opacity-100 p-6 text-2xl text-gray-950 justify-center text-center"><em>Please enter the student's
            information on the
            left to
            see your
            assigned program on the map.</em></p>
      </div>
      <LMap class="h-full z-0" :zoom="12" :center="mapCenter" :use-global-leaflet="false">
        <LTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&amp;copy; <a href=&quot;https://www.openstreetmap.org/&quot;>OpenStreetMap</a> contributors"
          layer-type="base" name="OpenStreetMap" />
        <LMarker v-if='userAddressPin && userAddressPin.length === 2'
          :lat-lng="[userAddressPin[0] ?? 0, userAddressPin[1] ?? 0]">
          <l-icon icon-url="/home.png" :icon-size="[60, 60]" />
        </LMarker>
        <LMarker v-if='assignedProgram'
          :lat-lng="[assignedProgram.location.coordinates[1], assignedProgram.location.coordinates[0]]">
          <l-icon icon-url="/school.png" :icon-size="[60, 60]" />
        </LMarker>
      </LMap>
    </div>

  </div>
</template>
