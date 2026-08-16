import assert from 'node:assert/strict'

import {
  ChildLimit,
  DefaultEightCharProvider,
  Gender,
  LunarHour,
  LunarSect1ChildLimitProvider,
  LunarSect2ChildLimitProvider,
  LunarSect2EightCharProvider,
  SolarTerm,
  SolarTime,
} from 'tyme4ts'

const PROVIDER_VERSION = '1.5.2'
const HIDDEN_STEM_TYPES = ['residual', 'middle', 'main']

function localDateTime(value) {
  return {
    year: value.getYear(),
    month: value.getMonth(),
    day: value.getDay(),
    hour: value.getHour(),
    minute: value.getMinute(),
    second: value.getSecond(),
  }
}

function mapPillar(role, pillar, dayMaster) {
  const stem = pillar.getHeavenStem()
  const branch = pillar.getEarthBranch()

  return {
    role,
    name: pillar.getName(),
    stem: stem.getName(),
    branch: branch.getName(),
    stemTenGod: dayMaster.getTenStar(stem).getName(),
    hiddenStems: branch.getHideHeavenStems().map((hiddenStem) => ({
      stem: hiddenStem.getHeavenStem().getName(),
      type: HIDDEN_STEM_TYPES[hiddenStem.getType()],
      tenGod: dayMaster.getTenStar(hiddenStem.getHeavenStem()).getName(),
    })),
    nayin: pillar.getSound().getName(),
    voidBranches: pillar.getExtraEarthBranches().map((item) => item.getName()),
    growthStage: dayMaster.getTerrain(branch).getName(),
    selfGrowthStage: stem.getTerrain(branch).getName(),
  }
}

function mapKnownChart(year, month, day, hour, minute, gender) {
  const solarTime = SolarTime.fromYmdHms(year, month, day, hour, minute, 0)
  const lunarHour = solarTime.getLunarHour()
  const eightChar = lunarHour.getEightChar()
  const dayMaster = eightChar.getDay().getHeavenStem()
  const childLimit = ChildLimit.fromSolarTime(solarTime, gender)
  const roles = ['year', 'month', 'day', 'hour']
  const values = [
    eightChar.getYear(),
    eightChar.getMonth(),
    eightChar.getDay(),
    eightChar.getHour(),
  ]

  const luckPeriods = []
  let decadeFortune = childLimit.getStartDecadeFortune()
  for (let index = 0; index < 8; index += 1) {
    luckPeriods.push({
      index: index + 1,
      ganzhi: decadeFortune.getName(),
      tenGod: dayMaster.getTenStar(decadeFortune.getSixtyCycle().getHeavenStem()).getName(),
      startAge: decadeFortune.getStartAge(),
      endAge: decadeFortune.getEndAge(),
      startYear: decadeFortune.getStartSixtyCycleYear().getYear(),
      endYear: decadeFortune.getEndSixtyCycleYear().getYear(),
    })
    decadeFortune = decadeFortune.next(1)
  }

  return {
    input: localDateTime(solarTime),
    lunar: lunarHour.getLunarDay().toString(),
    dayMaster: dayMaster.getName(),
    pillars: values.map((pillar, index) => mapPillar(roles[index], pillar, dayMaster)),
    luckStart: {
      forward: childLimit.isForward(),
      offset: {
        years: childLimit.getYearCount(),
        months: childLimit.getMonthCount(),
        days: childLimit.getDayCount(),
        hours: childLimit.getHourCount(),
        minutes: childLimit.getMinuteCount(),
      },
      startsAt: localDateTime(childLimit.getEndTime()),
    },
    luckPeriods,
  }
}

function getThreePillars(year, month, day, hour, minute) {
  const eightChar = SolarTime.fromYmdHms(year, month, day, hour, minute, 0)
    .getLunarHour()
    .getEightChar()
  return [eightChar.getYear(), eightChar.getMonth(), eightChar.getDay()].map((pillar) =>
    pillar.getName(),
  )
}

function getLuckBoundary(year, month, day, hour, minute, gender) {
  const childLimit = ChildLimit.fromSolarTime(
    SolarTime.fromYmdHms(year, month, day, hour, minute, 0),
    gender,
  )
  const first = childLimit.getStartDecadeFortune()

  return {
    startsAt: localDateTime(childLimit.getEndTime()),
    firstGanzhi: first.getName(),
    startAge: first.getStartAge(),
    startYear: first.getStartSixtyCycleYear().getYear(),
  }
}

const originalEightCharProvider = LunarHour.provider
const originalChildLimitProvider = ChildLimit.provider

try {
  LunarHour.provider = new DefaultEightCharProvider()
  ChildLimit.provider = new LunarSect1ChildLimitProvider()

  const knownChart = mapKnownChart(1992, 2, 2, 12, 0, Gender.MAN)
  assert.equal(knownChart.pillars.length, 4)
  assert.ok(knownChart.pillars.every((pillar) => pillar.hiddenStems.length >= 1))
  assert.ok(knownChart.pillars.every((pillar) => pillar.voidBranches.length === 2))
  assert.equal(knownChart.luckPeriods.length, 8)

  const repeated = Array.from({ length: 20 }, () =>
    JSON.stringify(mapKnownChart(1992, 2, 2, 12, 0, Gender.MAN)),
  )
  assert.equal(new Set(repeated).size, 1)

  const lateZiInput = SolarTime.fromYmdHms(2023, 1, 22, 23, 30, 0).getLunarHour()
  LunarHour.provider = new DefaultEightCharProvider()
  const lateZiNextDay = lateZiInput.getEightChar().getName()
  LunarHour.provider = new LunarSect2EightCharProvider()
  const lateZiSameDay = lateZiInput.getEightChar().getName()
  assert.notEqual(lateZiNextDay, lateZiSameDay)

  LunarHour.provider = new DefaultEightCharProvider()
  const restoredLateZi = lateZiInput.getEightChar().getName()
  assert.equal(restoredLateZi, lateZiNextDay)

  ChildLimit.provider = new LunarSect1ChildLimitProvider()
  const lunarSect1 = getLuckBoundary(2000, 6, 15, 12, 0, Gender.MAN)
  ChildLimit.provider = new LunarSect2ChildLimitProvider()
  const lunarSect2 = getLuckBoundary(2000, 6, 15, 12, 0, Gender.MAN)
  assert.notDeepEqual(lunarSect1.startsAt, lunarSect2.startsAt)

  ChildLimit.provider = new LunarSect1ChildLimitProvider()
  const ordinaryUnknownTime = {
    startOfDay: {
      threePillars: getThreePillars(2000, 1, 3, 0, 0),
      luck: getLuckBoundary(2000, 1, 3, 0, 0, Gender.MAN),
    },
    lateZi: {
      threePillars: getThreePillars(2000, 1, 3, 23, 59),
      luck: getLuckBoundary(2000, 1, 3, 23, 59, Gender.MAN),
    },
  }
  assert.notDeepEqual(
    ordinaryUnknownTime.startOfDay.threePillars,
    ordinaryUnknownTime.lateZi.threePillars,
  )
  assert.notEqual(
    ordinaryUnknownTime.startOfDay.luck.startAge,
    ordinaryUnknownTime.lateZi.luck.startAge,
  )

  const solarTermTime = SolarTerm.fromName(2023, '立春').getJulianDay().getSolarTime()
  const termBoundary = {
    term: localDateTime(solarTermTime),
    before: getThreePillars(2023, 2, 4, 9, 0),
    after: getThreePillars(2023, 2, 4, 12, 0),
  }
  assert.notDeepEqual(termBoundary.before.slice(0, 2), termBoundary.after.slice(0, 2))

  process.stdout.write(
    `${JSON.stringify(
      {
        provider: { name: 'tyme4ts', version: PROVIDER_VERSION, license: 'MIT' },
        knownChart,
        determinism: { repetitions: repeated.length, distinctResults: new Set(repeated).size },
        dayBoundary: { lateZiNextDay, lateZiSameDay, restoredLateZi },
        luckStartVariants: { lunarSect1, lunarSect2 },
        unknownTimeEvidence: { ordinaryUnknownTime, termBoundary },
      },
      null,
      2,
    )}\n`,
  )
} finally {
  LunarHour.provider = originalEightCharProvider
  ChildLimit.provider = originalChildLimitProvider
}
