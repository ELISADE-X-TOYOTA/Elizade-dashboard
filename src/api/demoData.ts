/**
 * Sample board data, for seeing the layout before real prices exist.
 *
 * WHY THIS IS OPT-IN AND LOUD
 *
 * This file fabricates naira prices. On a screen whose entire job is telling
 * customers what a service costs, that is dangerous data. So demo mode is
 * never a fallback — a failing API shows an error, exactly as it does today,
 * and never quietly substitutes these numbers. It turns on only when someone
 * asks for it by name (`?demo` in the URL, or VITE_DEMO_DATA at build time),
 * and while it is on the board wears a badge saying so.
 *
 * The shape mirrors `types.ts` exactly, so swapping the real API back in is a
 * matter of dropping the flag — no component changes.
 */

import type { PriceBookBoard, PriceBookEntry, ServiceItem } from './types'

/** Same nine models and bands the backend validates imports against. */
const MODELS = [
  'Corolla',
  'Avensis',
  'Camry',
  'Prado',
  'Coaster',
  'Hilux',
  'Hiace',
  'Yaris',
  'RAV-4',
] as const

const BANDS = [1_000, 5_000, 10_000, 15_000, 25_000, 40_000, 60_000, 80_000, 100_000]

/**
 * Representative Toyota service menu — NOT a transcription of Elizade's wall
 * board. The count and the three sections match; the individual rows and every
 * price are invented.
 */
const CATALOGUE: Array<{
  code: string
  name: string
  group: 'periodic' | 'chassis' | 'engine'
  sortOrder: number
  base: number
}> = [
  { code: 'engine-oil-filter', name: 'Engine oil and filter', group: 'periodic', sortOrder: 1, base: 28_000 },
  { code: 'air-filter', name: 'Air filter', group: 'periodic', sortOrder: 2, base: 12_000 },
  { code: 'fuel-filter', name: 'Fuel filter', group: 'periodic', sortOrder: 3, base: 15_000 },
  { code: 'spark-plugs', name: 'Spark plugs', group: 'periodic', sortOrder: 4, base: 35_000 },
  { code: 'cabin-filter', name: 'Cabin air filter', group: 'periodic', sortOrder: 5, base: 10_000 },
  { code: 'coolant', name: 'Coolant replacement', group: 'periodic', sortOrder: 6, base: 26_000 },
  { code: 'transmission-fluid', name: 'Automatic transmission fluid', group: 'periodic', sortOrder: 7, base: 58_000 },
  { code: 'brake-pads-front', name: 'Brake pads (front)', group: 'chassis', sortOrder: 10, base: 48_000 },
  { code: 'brake-pads-rear', name: 'Brake pads (rear)', group: 'chassis', sortOrder: 11, base: 44_000 },
  { code: 'brake-fluid', name: 'Brake fluid replacement', group: 'chassis', sortOrder: 12, base: 18_000 },
  { code: 'wheel-alignment', name: 'Wheel alignment', group: 'chassis', sortOrder: 13, base: 22_000 },
  { code: 'shock-absorbers', name: 'Shock absorber replacement', group: 'chassis', sortOrder: 14, base: 96_000 },
  { code: 'timing-belt', name: 'Timing belt kit', group: 'engine', sortOrder: 20, base: 125_000 },
  { code: 'drive-belt', name: 'Drive belt', group: 'engine', sortOrder: 21, base: 32_000 },
  { code: 'radiator', name: 'Radiator replacement', group: 'engine', sortOrder: 22, base: 148_000 },
  { code: 'clutch-kit', name: 'Clutch kit replacement', group: 'engine', sortOrder: 23, base: 210_000 },
]

const DEMO_DISCLAIMER =
  'Displayed prices are working estimates inclusive of labour, parts and tax and may vary according to the work actually performed.'

/** Larger vehicles cost more; longer services cost more. Illustrative only. */
function demoPrice(base: number, modelIndex: number, bandKm: number): string {
  const modelFactor = 1 + modelIndex * 0.04
  const bandFactor = bandKm === 0 ? 1 : 0.85 + (bandKm / 100_000) * 0.35
  return String(Math.round(base * modelFactor * bandFactor))
}

export function demoServiceItems(): ServiceItem[] {
  return CATALOGUE.map((item, index) => ({
    id: `demo-item-${index + 1}`,
    code: item.code,
    name: item.name,
    group: item.group,
    description: null,
    sortOrder: item.sortOrder,
    isActive: true,
  }))
}

export function demoPriceBook(): PriceBookBoard {
  const entries: PriceBookEntry[] = []

  MODELS.forEach((model, modelIndex) => {
    CATALOGUE.forEach((item) => {
      // Periodic work is priced per mileage band; chassis and engine jobs are a
      // single figure, which the board stores against band 0.
      const bands = item.group === 'periodic' ? BANDS : [0]
      bands.forEach((band) => {
        entries.push({
          id: `demo-${model}-${item.code}-${band}`,
          serviceItemCode: item.code,
          serviceItemName: item.name,
          serviceItemGroup: item.group,
          vehicleModel: model,
          mileageBandKm: band,
          price: demoPrice(item.base, modelIndex, band),
        })
      })
    })
  })

  return {
    version: {
      id: 'demo-version',
      versionNumber: 1,
      status: 'published',
      currency: 'NGN',
      priceInclusive: true,
      effectiveFrom: new Date().toISOString(),
      disclaimer: DEMO_DISCLAIMER,
      publishedAt: new Date().toISOString(),
      entryCount: entries.length,
    },
    mileageBandsKm: BANDS,
    vehicleModels: [...MODELS],
    entries,
  }
}
