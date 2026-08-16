import type {
  BaziChart,
  BaziPillar,
  BaziPillarRole,
} from '../../src/capabilities/bazi/bazi.model.js'

function pillar(role: BaziPillarRole, ganzhi: string): BaziPillar {
  return {
    role,
    ganzhi,
    stem: ganzhi[0]!,
    branch: ganzhi[1]!,
    stemTenGod: '合成十神',
    hiddenStems: [{ stem: '甲', strength: 'main', tenGod: '合成藏干十神' }],
    nayin: '合成纳音',
    xunkong: ['子', '丑'],
    dayMasterGrowthStage: '长生',
    selfGrowthStage: '帝旺',
  }
}

export const syntheticBaziChart: BaziChart = {
  system: 'bazi',
  timePrecision: 'unknown',
  calendar: {
    input: { calendar: 'gregorian', year: 2000, month: 1, day: 2 },
    solarDate: { year: 2000, month: 1, day: 2 },
    lunarDate: {
      year: 1999,
      month: 11,
      day: 26,
      leapMonth: false,
      display: '合成农历日期',
    },
    timeZone: 'Asia/Shanghai',
  },
  candidates: [
    {
      id: 'candidate-1',
      possibleBirthTimeRanges: [{ start: '00:00', end: '22:59' }],
      dayMaster: '甲',
      pillars: [pillar('year', '己卯'), pillar('month', '丙子'), pillar('day', '甲子')],
      luck: {
        direction: 'forward',
        start: {
          precision: 'range',
          earliest: { year: 2008, month: 1, day: 1, hour: 0, minute: 0, second: 0 },
          latest: { year: 2008, month: 12, day: 31, hour: 23, minute: 59, second: 0 },
        },
        periods: Array.from({ length: 8 }, (_, index) => ({
          index: index + 1,
          ganzhi: `合成大运${index + 1}`,
          tenGod: '合成十神',
          startAge: 10 + index * 10,
          endAge: 19 + index * 10,
          startYear: 2009 + index * 10,
          endYear: 2018 + index * 10,
        })),
      },
    },
  ],
  conventions: {
    dayBoundary: { value: 'zi_hour_next_day', source: 'default' },
    luckStart: { value: 'lunar_sect_1', source: 'default' },
  },
  provenance: { provider: 'tyme4ts', providerVersion: '1.5.2' },
  warnings: ['SYNTHETIC_TEST_FIXTURE'],
}
