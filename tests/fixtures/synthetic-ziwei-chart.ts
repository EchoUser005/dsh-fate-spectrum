import type { ZiweiChart, ZiweiPalaceId } from '../../src/capabilities/ziwei/ziwei.model.js'

const palaceIds: ZiweiPalaceId[] = [
  'life',
  'siblings',
  'spouse',
  'children',
  'wealth',
  'health',
  'travel',
  'friends',
  'career',
  'property',
  'spirit',
  'parents',
]

export const syntheticZiweiChart: ZiweiChart = {
  system: 'ziwei',
  timePrecision: 'known',
  calendar: {
    input: { calendar: 'gregorian', year: 2000, month: 1, day: 2 },
    solarDate: { year: 2000, month: 1, day: 2 },
    lunarDate: { year: 1999, month: 11, day: 26, leapMonth: false, display: '合成农历' },
    timeZone: 'Asia/Shanghai',
  },
  candidates: [
    {
      id: 'candidate-7',
      possibleBirthTimeRanges: [{ start: '12:00', end: '12:00' }],
      timeSlot: { index: 6, name: '午时', range: { start: '11:00', end: '13:00' } },
      chineseDate: '合成干支',
      lifePalace: { palaceId: 'life', heavenlyStem: '甲', earthlyBranch: '子' },
      bodyPalace: { palaceId: 'career', heavenlyStem: '甲', earthlyBranch: '子' },
      soul: '合成命主',
      body: '合成身主',
      fiveElementsClass: '合成五行局',
      palaces: palaceIds.map((id, index) => ({
        index,
        id,
        name: id === 'life' ? '命宫' : `合成宫${index}`,
        heavenlyStem: '甲',
        earthlyBranch: '子',
        isLifePalace: id === 'life',
        isBodyPalace: id === 'career',
        isOriginalPalace: false,
        stars: [],
        decadal: { startAge: index * 10 + 1, endAge: index * 10 + 10, ganzhi: '甲子' },
      })),
    },
  ],
  conventions: {
    school: { value: 'standard', source: 'default' },
    leapMonthRule: { value: 'split_at_day_15', source: 'default' },
    dayBoundary: 'zi_hour_next_day',
    yearBoundary: 'lunar_new_year',
    horoscopeBoundary: 'lunar_new_year',
    ageBoundary: 'nominal_year',
  },
  provenance: { provider: 'iztro', providerVersion: '2.5.8' },
  warnings: [],
}
