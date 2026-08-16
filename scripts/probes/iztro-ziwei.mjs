import assert from 'node:assert/strict'

import { astro } from 'iztro'

const PROVIDER_VERSION = '2.5.8'

const baseOptions = {
  type: 'solar',
  dateStr: '2000-08-16',
  gender: '男',
  fixLeap: true,
  language: 'zh-CN',
}

function scalarConfig(config) {
  return {
    yearDivide: config.yearDivide,
    horoscopeDivide: config.horoscopeDivide,
    ageDivide: config.ageDivide,
    dayDivide: config.dayDivide,
    algorithm: config.algorithm,
  }
}

function chartFingerprint(chart) {
  return JSON.stringify({
    solarDate: chart.solarDate,
    lunarDate: chart.lunarDate,
    chineseDate: chart.chineseDate,
    time: chart.time,
    timeRange: chart.timeRange,
    soulPalace: chart.earthlyBranchOfSoulPalace,
    bodyPalace: chart.earthlyBranchOfBodyPalace,
    soul: chart.soul,
    body: chart.body,
    fiveElementsClass: chart.fiveElementsClass,
    palaces: chart.palaces.map((palace) => ({
      index: palace.index,
      name: palace.name,
      heavenlyStem: palace.heavenlyStem,
      earthlyBranch: palace.earthlyBranch,
      isBodyPalace: palace.isBodyPalace,
      decadal: palace.decadal,
      stars: [...palace.majorStars, ...palace.minorStars, ...palace.adjectiveStars].map((star) => ({
        name: star.name,
        type: star.type,
        scope: star.scope,
        brightness: star.brightness ?? '',
        mutagen: star.mutagen ?? '',
      })),
    })),
  })
}

function createChart({ timeIndex = 2, algorithm = 'default', dayDivide = 'forward' } = {}) {
  return astro.withOptions({
    ...baseOptions,
    timeIndex,
    config: {
      algorithm,
      dayDivide,
      yearDivide: 'normal',
      horoscopeDivide: 'normal',
      ageDivide: 'normal',
    },
  })
}

const originalConfig = astro.getConfig()

try {
  const knownChart = createChart()
  assert.equal(knownChart.palaces.length, 12)
  assert.equal(knownChart.palaces.filter((palace) => palace.name === '命宫').length, 1)
  assert.equal(knownChart.palaces.filter((palace) => palace.isBodyPalace).length, 1)
  assert.ok(knownChart.palaces.every((palace) => palace.decadal.range.length === 2))

  const repeated = Array.from({ length: 20 }, () => chartFingerprint(createChart()))
  assert.equal(new Set(repeated).size, 1)

  const unknownTimeCandidates = Array.from({ length: 13 }, (_, timeIndex) => {
    const chart = createChart({ timeIndex })
    return {
      timeIndex,
      time: chart.time,
      timeRange: chart.timeRange,
      fingerprint: chartFingerprint(chart),
    }
  })
  assert.equal(new Set(unknownTimeCandidates.map(({ fingerprint }) => fingerprint)).size, 13)

  const defaultSchool = createChart({ algorithm: 'default' })
  const zhongzhouSchool = createChart({ algorithm: 'zhongzhou' })
  assert.notEqual(chartFingerprint(defaultSchool), chartFingerprint(zhongzhouSchool))

  const restoredDefaultSchool = createChart({ algorithm: 'default' })
  assert.equal(chartFingerprint(restoredDefaultSchool), chartFingerprint(defaultSchool))

  const leapMonthSplit = astro.withOptions({
    type: 'lunar',
    dateStr: '2023-2-20',
    timeIndex: 2,
    gender: '女',
    isLeapMonth: true,
    fixLeap: true,
    language: 'zh-CN',
    config: { algorithm: 'default', dayDivide: 'forward' },
  })
  const leapMonthWhole = astro.withOptions({
    type: 'lunar',
    dateStr: '2023-2-20',
    timeIndex: 2,
    gender: '女',
    isLeapMonth: true,
    fixLeap: false,
    language: 'zh-CN',
    config: { algorithm: 'default', dayDivide: 'forward' },
  })
  assert.equal(leapMonthSplit.solarDate, leapMonthWhole.solarDate)
  assert.notEqual(chartFingerprint(leapMonthSplit), chartFingerprint(leapMonthWhole))

  process.stdout.write(
    `${JSON.stringify(
      {
        provider: { name: 'iztro', version: PROVIDER_VERSION, license: 'MIT' },
        knownChart: {
          solarDate: knownChart.solarDate,
          lunarDate: knownChart.lunarDate,
          chineseDate: knownChart.chineseDate,
          time: knownChart.time,
          timeRange: knownChart.timeRange,
          soulPalace: knownChart.earthlyBranchOfSoulPalace,
          bodyPalace: knownChart.earthlyBranchOfBodyPalace,
          soul: knownChart.soul,
          body: knownChart.body,
          fiveElementsClass: knownChart.fiveElementsClass,
          palaceCount: knownChart.palaces.length,
          starCount: knownChart.palaces.reduce(
            (count, palace) =>
              count +
              palace.majorStars.length +
              palace.minorStars.length +
              palace.adjectiveStars.length,
            0,
          ),
        },
        determinism: {
          repetitions: repeated.length,
          distinctResults: new Set(repeated).size,
        },
        unknownTime: {
          candidateCount: unknownTimeCandidates.length,
          distinctResults: new Set(unknownTimeCandidates.map(({ fingerprint }) => fingerprint))
            .size,
          candidates: unknownTimeCandidates.map(({ timeIndex, time, timeRange }) => ({
            timeIndex,
            time,
            timeRange,
          })),
        },
        schoolDifference: {
          default: {
            soul: defaultSchool.soul,
            body: defaultSchool.body,
            soulPalace: defaultSchool.earthlyBranchOfSoulPalace,
            fiveElementsClass: defaultSchool.fiveElementsClass,
          },
          zhongzhou: {
            soul: zhongzhouSchool.soul,
            body: zhongzhouSchool.body,
            soulPalace: zhongzhouSchool.earthlyBranchOfSoulPalace,
            fiveElementsClass: zhongzhouSchool.fiveElementsClass,
          },
          restored: chartFingerprint(restoredDefaultSchool) === chartFingerprint(defaultSchool),
        },
        leapMonthDifference: {
          solarDate: leapMonthSplit.solarDate,
          splitAtDay15: {
            soulPalace: leapMonthSplit.earthlyBranchOfSoulPalace,
            fiveElementsClass: leapMonthSplit.fiveElementsClass,
          },
          wholeLeapMonth: {
            soulPalace: leapMonthWhole.earthlyBranchOfSoulPalace,
            fiveElementsClass: leapMonthWhole.fiveElementsClass,
          },
        },
        restoredConfig: scalarConfig(astro.getConfig()),
      },
      null,
      2,
    )}\n`,
  )
} finally {
  astro.config(originalConfig)
}
