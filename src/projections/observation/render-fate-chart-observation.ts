import type { BaziChart, BaziChartCandidate } from '../../capabilities/bazi/bazi.model.js'
import type {
  ZiweiChart,
  ZiweiChartCandidate,
  ZiweiStar,
} from '../../capabilities/ziwei/ziwei.model.js'
import type { CalculateFateChartResult } from '../../contracts/calculate-fate-chart/schemas.js'

export function renderFateChartObservation(result: CalculateFateChartResult) {
  if (result.status === 'needs_clarification') {
    return [
      {
        type: 'text' as const,
        text: [
          '排盘尚未执行：输入需要补充或修正。',
          `问题字段：${result.error.field}`,
          `修复方式：${result.error.repair}`,
          '下一步：向用户确认该信息后，使用完整参数重新调用 calculate_fate_chart。',
        ].join('\n'),
      },
    ]
  }

  if (result.status === 'unsupported') return renderUnsupported(result)

  const lines: string[] = []
  for (const system of result.systems) {
    if (system.status !== 'success') continue
    if (lines.length > 0) lines.push('', '---', '')
    lines.push(
      ...(system.system === 'bazi'
        ? renderBaziChart(system.chart)
        : renderZiweiChart(system.chart)),
    )
  }

  if (lines.length === 0) throw new Error('Successful fate-chart result contains no chart facts')
  if (result.status === 'partial') {
    const unavailable = result.systems
      .filter((system) => system.status === 'unsupported')
      .map((system) => `${system.system}: ${system.error.code}`)
      .join('；')
    lines.push(
      '',
      `未完成的系统：${unavailable}。只能使用上面已成功系统的真实事实；不要猜测缺失命盘。`,
    )
  }

  return [{ type: 'text' as const, text: lines.join('\n') }]
}

function renderUnsupported(result: Extract<CalculateFateChartResult, { status: 'unsupported' }>) {
  if (result.error.code === 'APPARENT_SOLAR_TIME_NOT_IMPLEMENTED') {
    return [
      {
        type: 'text' as const,
        text: [
          '完整视太阳时计算引擎尚未接入，本次没有生成命盘事实。',
          `本次请求系统：${result.requestedSystems.join('、')}`,
          '不要猜测或补写八字、紫微结果。可向用户说明 civil 民用时可以排盘，并询问是否改用。',
        ].join('\n'),
      },
    ]
  }

  const unavailable = result.error.systems
    .map(({ system, code }) => `${system}: ${code}`)
    .join('；')
  return [
    {
      type: 'text' as const,
      text: [
        `本次请求系统：${result.requestedSystems.join('、')}`,
        `计算状态：${unavailable}`,
        '没有生成任何命盘事实。不要根据出生信息自行猜盘。',
      ].join('\n'),
    },
  ]
}

function renderBaziChart(chart: BaziChart): string[] {
  const { calendar } = chart
  const lines = [
    '八字排盘已成功，以下是可用于分析的确定性命盘事实。',
    `历法锚点：公历 ${formatDate(calendar.solarDate)}；${calendar.lunarDate.display}；时区 ${calendar.timeZone}。`,
    `计算约定：换日 ${chart.conventions.dayBoundary.value}（${chart.conventions.dayBoundary.source}）；起运 ${chart.conventions.luckStart.value}（${chart.conventions.luckStart.source}）。`,
    `来源：${chart.provenance.provider}@${chart.provenance.providerVersion}。`,
  ]

  if (chart.timePrecision === 'unknown') {
    lines.push(
      `出生时辰未知。共得到 ${chart.candidates.length} 个真正不同的候选盘；每个候选已标明可能时间范围。`,
      '所有候选都不含时柱，也不能推断任何时柱相关事实。共同结论可直接分析；候选间不同的日柱、月柱、年柱、十神或大运必须分别作条件式解读，不得擅自选择其中一个。',
    )
  }

  for (const candidate of chart.candidates) {
    lines.push('', ...renderCandidate(candidate, chart.timePrecision))
  }

  return lines
}

function renderZiweiChart(chart: ZiweiChart): string[] {
  const { calendar } = chart
  const lines = [
    '紫微斗数排盘已成功，以下是可用于分析和命盘渲染的确定性事实。',
    `历法锚点：公历 ${formatDate(calendar.solarDate)}；${calendar.lunarDate.display}；时区 ${calendar.timeZone}。`,
    `计算约定：安星流派 ${chart.conventions.school.value}（${chart.conventions.school.source}）；闰月 ${chart.conventions.leapMonthRule.value}（${chart.conventions.leapMonthRule.source}）；晚子时换次日。`,
    `来源：${chart.provenance.provider}@${chart.provenance.providerVersion}。`,
  ]

  if (chart.timePrecision === 'unknown') {
    lines.push(
      `出生时辰未知。已返回覆盖全天的 ${chart.candidates.length} 份紫微候选盘，从早子时到晚子时均有明确时段。`,
      '共同宫位、星曜或四化可作为共同事实；候选间不同的命身宫、星曜和大限必须按时辰条件分别解读，不得擅自选定一盘。',
    )
  }

  for (const candidate of chart.candidates) {
    lines.push('', ...renderZiweiCandidate(candidate, chart.timePrecision))
  }

  return lines
}

function renderZiweiCandidate(
  candidate: ZiweiChartCandidate,
  precision: ZiweiChart['timePrecision'],
): string[] {
  const rangeText = candidate.possibleBirthTimeRanges
    .map(({ start, end }) => (start === end ? start : `${start}–${end}`))
    .join('、')
  const heading =
    precision === 'known'
      ? `紫微命盘（出生时刻 ${rangeText}；${candidate.timeSlot.name}）`
      : `${candidate.id}（${candidate.timeSlot.name}；可能时段 ${rangeText}）`
  const lines = [
    heading,
    `干支：${candidate.chineseDate}。`,
    `基本标识：命宫 ${formatZiweiPalaceAnchor(candidate.lifePalace)}；身宫 ${formatZiweiPalaceAnchor(candidate.bodyPalace)}；命主 ${candidate.soul}；身主 ${candidate.body}；五行局 ${candidate.fiveElementsClass}。`,
  ]

  const transformations = candidate.palaces.flatMap((palace) =>
    palace.stars
      .filter((star) => star.transformation !== undefined)
      .map((star) => `${star.name}化${star.transformation!.name}（${palace.name}宫）`),
  )
  lines.push(`本命四化：${transformations.length === 0 ? '无' : transformations.join('、')}。`)

  for (const palace of candidate.palaces) {
    const flags = [
      palace.isLifePalace ? '命宫' : undefined,
      palace.isBodyPalace ? '身宫' : undefined,
      palace.isOriginalPalace ? '来因宫' : undefined,
    ].filter((value): value is string => value !== undefined)
    const stars = palace.stars.map(formatZiweiStar).join('、')
    lines.push(
      `${palace.name}宫 [${palace.id}] ${palace.heavenlyStem}${palace.earthlyBranch}${flags.length === 0 ? '' : `（${flags.join('、')}）`}；大限 ${palace.decadal.startAge}–${palace.decadal.endAge} 虚岁 ${palace.decadal.ganzhi}；星曜 ${stars === '' ? '无' : stars}。`,
    )
  }

  return lines
}

function formatZiweiPalaceAnchor(anchor: ZiweiChartCandidate['lifePalace']): string {
  return `${anchor.heavenlyStem}${anchor.earthlyBranch} [${anchor.palaceId}]`
}

function formatZiweiStar(star: ZiweiStar): string {
  const details = [
    star.brightness,
    star.transformation === undefined ? undefined : `化${star.transformation.name}`,
  ].filter((value): value is string => value !== undefined)
  return `${star.name}${details.length === 0 ? '' : `（${details.join('、')}）`}`
}

function renderCandidate(
  candidate: BaziChartCandidate,
  precision: BaziChart['timePrecision'],
): string[] {
  const rangeText = candidate.possibleBirthTimeRanges
    .map(({ start, end }) => (start === end ? start : `${start}–${end}`))
    .join('、')
  const heading =
    precision === 'known'
      ? `命盘（出生时刻 ${rangeText}）`
      : `${candidate.id}（可能时段 ${rangeText}）`
  const lines = [heading, `日主：${candidate.dayMaster}。`]

  for (const pillar of candidate.pillars) {
    const hidden = pillar.hiddenStems
      .map(
        ({ stem, tenGod, strength }) =>
          `${stem}（${tenGod}，${translateHiddenStemStrength(strength)}）`,
      )
      .join('、')
    lines.push(
      `${translatePillarRole(pillar.role)} ${pillar.ganzhi}：天干十神 ${pillar.stemTenGod}；藏干 ${hidden}；纳音 ${pillar.nayin}；旬空 ${pillar.xunkong.join('、')}；日主十二长生 ${pillar.dayMasterGrowthStage}；自坐 ${pillar.selfGrowthStage}。`,
    )
  }

  const direction = candidate.luck.direction === 'forward' ? '顺排' : '逆排'
  if (candidate.luck.start.precision === 'exact') {
    const { offset } = candidate.luck.start
    lines.push(
      `起运：${direction}；出生后 ${offset.years} 年 ${offset.months} 月 ${offset.days} 日 ${offset.hours} 小时 ${offset.minutes} 分起运；交运时刻 ${formatDateTime(candidate.luck.start.startsAt)}。`,
    )
  } else {
    lines.push(
      `起运：${direction}；因时辰未知，交运时刻范围为 ${formatDateTime(candidate.luck.start.earliest)} 至 ${formatDateTime(candidate.luck.start.latest)}。`,
    )
  }

  lines.push(
    `大运：${candidate.luck.periods
      .map(
        (period) =>
          `${period.index}. ${period.ganzhi}（${period.tenGod}，${period.startYear}–${period.endYear} 年，${period.startAge}–${period.endAge} 周岁）`,
      )
      .join('；')}。`,
  )

  return lines
}

function translatePillarRole(role: 'year' | 'month' | 'day' | 'hour'): string {
  return { year: '年柱', month: '月柱', day: '日柱', hour: '时柱' }[role]
}

function translateHiddenStemStrength(strength: 'main' | 'middle' | 'residual'): string {
  return { main: '本气', middle: '中气', residual: '余气' }[strength]
}

function formatDate(value: { year: number; month: number; day: number }): string {
  return `${value.year}-${pad(value.month)}-${pad(value.day)}`
}

function formatDateTime(value: {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}): string {
  return `${formatDate(value)} ${pad(value.hour)}:${pad(value.minute)}:${pad(value.second)}`
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}
