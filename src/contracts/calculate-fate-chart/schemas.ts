import type {
  InferArgs,
  InferValue,
  ParameterSchemaSpec,
  ValueSchemaSpec,
} from '@deepseek-ai/dsh-tools'

const dateParts = {
  year: { type: 'integer', required: true, description: '出生年份。' },
  month: { type: 'integer', required: true, description: '出生月份，1 到 12。' },
  day: { type: 'integer', required: true, description: '出生日期。' },
} as const

const knownTimeSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    status: { type: 'string', const: 'known', required: true },
    hour: { type: 'integer', required: true, description: '小时，0 到 23。' },
    minute: { type: 'integer', required: true, description: '分钟，0 到 59。' },
  },
} as const

const unknownTimeSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    status: { type: 'string', const: 'unknown', required: true },
  },
} as const

const locationSchema = {
  type: 'object',
  additionalProperties: false,
  description:
    '出生地点。timeZone 必须是 IANA 时区；apparent_solar 模式还必须提供经度。label 只用于辨认地点，不参与坐标推断。',
  properties: {
    timeZone: {
      type: 'string',
      required: true,
      description: 'IANA 时区，例如 Asia/Shanghai。',
    },
    longitudeDegrees: {
      type: 'number',
      description: '东经为正、西经为负，范围 -180 到 180。真太阳时校准必须提供。',
    },
    latitudeDegrees: {
      type: 'number',
      description: '北纬为正、南纬为负，范围 -90 到 90。',
    },
    label: {
      type: 'string',
      description: '地点显示名称；不能代替时区或经纬度。',
    },
  },
} as const

const birthProperties = {
  time: {
    oneOf: [knownTimeSchema, unknownTimeSchema],
    required: true,
    description: '出生时刻。未知时必须显式传入 { status: "unknown" }，不得猜成 00:00。',
  },
  location: { ...locationSchema, required: true },
} as const

const gregorianBirthSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    calendar: { type: 'string', const: 'gregorian', required: true },
    date: {
      type: 'object',
      additionalProperties: false,
      required: true,
      properties: dateParts,
    },
    ...birthProperties,
  },
} as const

const lunarBirthSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    calendar: { type: 'string', const: 'lunar', required: true },
    date: {
      type: 'object',
      additionalProperties: false,
      required: true,
      properties: {
        ...dateParts,
        leapMonth: {
          type: 'boolean',
          required: true,
          description: '是否为闰月；必须显式提供。',
        },
      },
    },
    ...birthProperties,
  },
} as const

export const calculateFateChartParameters = {
  birth: {
    oneOf: [gregorianBirthSchema, lunarBirthSchema],
    required: true,
    description: '排盘所需的出生日期、明确时辰状态与地点。',
  },
  gender: {
    type: 'string',
    enum: ['male', 'female'],
    required: true,
    description: '命主性别：male 为男，female 为女。',
  },
  systems: {
    type: 'array',
    items: { type: 'string', enum: ['bazi', 'ziwei'] },
    description: '要计算的命盘系统；省略时默认同时请求 bazi 和 ziwei。不得传空数组或重复值。',
    default: ['bazi', 'ziwei'],
  },
  conventions: {
    type: 'object',
    additionalProperties: false,
    description: '可选计算约定；未提供的约定使用已审核默认值并在真实结果中披露。',
    properties: {
      timeMode: {
        type: 'string',
        enum: ['civil', 'apparent_solar'],
        description: 'civil 使用民用时；apparent_solar 使用完整视太阳时校准。默认 civil。',
        default: 'civil',
      },
      bazi: {
        type: 'object',
        additionalProperties: false,
        properties: {
          dayBoundary: {
            type: 'string',
            enum: ['zi_hour_next_day', 'late_zi_same_day'],
            description: '八字换日规则；默认 23:00 起使用次日日柱。',
            default: 'zi_hour_next_day',
          },
          luckStart: {
            type: 'string',
            enum: ['lunar_sect_1', 'lunar_sect_2'],
            description: '八字起运算法；默认 lunar_sect_1。',
            default: 'lunar_sect_1',
          },
        },
      },
      ziwei: {
        type: 'object',
        additionalProperties: false,
        properties: {
          school: {
            type: 'string',
            enum: ['standard', 'zhongzhou'],
            description:
              '紫微安星流派；standard 为《紫微斗数全书》通行安星法，zhongzhou 为中州派。默认 standard。',
            default: 'standard',
          },
          leapMonthRule: {
            type: 'string',
            enum: ['split_at_day_15', 'whole_leap_month'],
            description:
              '紫微闰月安宫规则；split_at_day_15 表示十五日及以前按本月、之后按下月，whole_leap_month 表示整个闰月按本月。默认 split_at_day_15。',
            default: 'split_at_day_15',
          },
        },
      },
    },
  },
} as const satisfies ParameterSchemaSpec

const requestedSystemsOutputSchema = {
  type: 'array',
  items: { type: 'string', enum: ['bazi', 'ziwei'] },
} as const

const schemaVersionOutputSchema = {
  type: 'string',
  const: '0.1.0',
  required: true,
} as const

const localDateTimeOutputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    year: { type: 'integer', required: true },
    month: { type: 'integer', required: true },
    day: { type: 'integer', required: true },
    hour: { type: 'integer', required: true },
    minute: { type: 'integer', required: true },
    second: { type: 'integer', required: true },
  },
} as const

const hiddenStemOutputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    stem: { type: 'string', required: true },
    strength: {
      type: 'string',
      enum: ['main', 'middle', 'residual'],
      required: true,
    },
    tenGod: { type: 'string', required: true },
  },
} as const

const pillarOutputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    role: { type: 'string', enum: ['year', 'month', 'day', 'hour'], required: true },
    ganzhi: { type: 'string', required: true },
    stem: { type: 'string', required: true },
    branch: { type: 'string', required: true },
    stemTenGod: { type: 'string', required: true },
    hiddenStems: {
      type: 'array',
      required: true,
      items: hiddenStemOutputSchema,
    },
    nayin: { type: 'string', required: true },
    xunkong: {
      type: 'array',
      required: true,
      items: { type: 'string' },
    },
    dayMasterGrowthStage: { type: 'string', required: true },
    selfGrowthStage: { type: 'string', required: true },
  },
} as const

const luckPeriodOutputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    index: { type: 'integer', required: true },
    ganzhi: { type: 'string', required: true },
    tenGod: { type: 'string', required: true },
    startAge: { type: 'integer', required: true },
    endAge: { type: 'integer', required: true },
    startYear: { type: 'integer', required: true },
    endYear: { type: 'integer', required: true },
  },
} as const

const exactLuckStartOutputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    precision: { type: 'string', const: 'exact', required: true },
    startsAt: { ...localDateTimeOutputSchema, required: true },
    offset: {
      type: 'object',
      additionalProperties: false,
      required: true,
      properties: {
        years: { type: 'integer', required: true },
        months: { type: 'integer', required: true },
        days: { type: 'integer', required: true },
        hours: { type: 'integer', required: true },
        minutes: { type: 'integer', required: true },
      },
    },
  },
} as const

const rangedLuckStartOutputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    precision: { type: 'string', const: 'range', required: true },
    earliest: { ...localDateTimeOutputSchema, required: true },
    latest: { ...localDateTimeOutputSchema, required: true },
  },
} as const

const candidateOutputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    id: { type: 'string', required: true },
    possibleBirthTimeRanges: {
      type: 'array',
      required: true,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          start: { type: 'string', required: true },
          end: { type: 'string', required: true },
        },
      },
    },
    dayMaster: { type: 'string', required: true },
    pillars: { type: 'array', required: true, items: pillarOutputSchema },
    luck: {
      type: 'object',
      additionalProperties: false,
      required: true,
      properties: {
        direction: {
          type: 'string',
          enum: ['forward', 'backward'],
          required: true,
        },
        start: {
          oneOf: [exactLuckStartOutputSchema, rangedLuckStartOutputSchema],
          required: true,
        },
        periods: { type: 'array', required: true, items: luckPeriodOutputSchema },
      },
    },
  },
} as const

const resolvedConventionSourceOutputSchema = {
  type: 'string',
  enum: ['default', 'explicit'],
  required: true,
} as const

const baziChartOutputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    system: { type: 'string', const: 'bazi', required: true },
    timePrecision: { type: 'string', enum: ['known', 'unknown'], required: true },
    calendar: {
      type: 'object',
      additionalProperties: false,
      required: true,
      properties: {
        input: {
          type: 'object',
          additionalProperties: false,
          required: true,
          properties: {
            calendar: {
              type: 'string',
              enum: ['gregorian', 'lunar'],
              required: true,
            },
            year: { type: 'integer', required: true },
            month: { type: 'integer', required: true },
            day: { type: 'integer', required: true },
            leapMonth: { type: 'boolean' },
          },
        },
        solarDate: {
          type: 'object',
          additionalProperties: false,
          required: true,
          properties: {
            year: { type: 'integer', required: true },
            month: { type: 'integer', required: true },
            day: { type: 'integer', required: true },
          },
        },
        lunarDate: {
          type: 'object',
          additionalProperties: false,
          required: true,
          properties: {
            year: { type: 'integer', required: true },
            month: { type: 'integer', required: true },
            day: { type: 'integer', required: true },
            leapMonth: { type: 'boolean', required: true },
            display: { type: 'string', required: true },
          },
        },
        timeZone: { type: 'string', required: true },
      },
    },
    candidates: { type: 'array', required: true, items: candidateOutputSchema },
    conventions: {
      type: 'object',
      additionalProperties: false,
      required: true,
      properties: {
        dayBoundary: {
          type: 'object',
          additionalProperties: false,
          required: true,
          properties: {
            value: {
              type: 'string',
              enum: ['zi_hour_next_day', 'late_zi_same_day'],
              required: true,
            },
            source: resolvedConventionSourceOutputSchema,
          },
        },
        luckStart: {
          type: 'object',
          additionalProperties: false,
          required: true,
          properties: {
            value: {
              type: 'string',
              enum: ['lunar_sect_1', 'lunar_sect_2'],
              required: true,
            },
            source: resolvedConventionSourceOutputSchema,
          },
        },
      },
    },
    provenance: {
      type: 'object',
      additionalProperties: false,
      required: true,
      properties: {
        provider: { type: 'string', const: 'tyme4ts', required: true },
        providerVersion: { type: 'string', const: '1.5.2', required: true },
      },
    },
    warnings: { type: 'array', required: true, items: { type: 'string' } },
  },
} as const

const baziSuccessSystemOutputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    system: { type: 'string', const: 'bazi', required: true },
    status: { type: 'string', const: 'success', required: true },
    chart: { ...baziChartOutputSchema, required: true },
  },
} as const

const ziweiTimeRangeOutputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    start: { type: 'string', required: true },
    end: { type: 'string', required: true },
  },
} as const

const ziweiStarOutputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    id: { type: 'string', required: true },
    name: { type: 'string', required: true },
    type: { type: 'string', required: true },
    scope: { type: 'string', required: true },
    brightness: { type: 'string' },
    transformation: {
      type: 'object',
      additionalProperties: false,
      properties: {
        id: { type: 'string', enum: ['lu', 'quan', 'ke', 'ji'], required: true },
        name: { type: 'string', required: true },
      },
    },
  },
} as const

const ziweiPalaceAnchorOutputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    palaceId: {
      type: 'string',
      enum: [
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
      ],
      required: true,
    },
    heavenlyStem: { type: 'string', required: true },
    earthlyBranch: { type: 'string', required: true },
  },
} as const

const ziweiPalaceOutputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    index: { type: 'integer', required: true },
    id: {
      type: 'string',
      enum: [
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
      ],
      required: true,
    },
    name: { type: 'string', required: true },
    heavenlyStem: { type: 'string', required: true },
    earthlyBranch: { type: 'string', required: true },
    isLifePalace: { type: 'boolean', required: true },
    isBodyPalace: { type: 'boolean', required: true },
    isOriginalPalace: { type: 'boolean', required: true },
    stars: { type: 'array', required: true, items: ziweiStarOutputSchema },
    decadal: {
      type: 'object',
      additionalProperties: false,
      required: true,
      properties: {
        startAge: { type: 'integer', required: true },
        endAge: { type: 'integer', required: true },
        ganzhi: { type: 'string', required: true },
      },
    },
  },
} as const

const ziweiCandidateOutputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    id: { type: 'string', required: true },
    possibleBirthTimeRanges: {
      type: 'array',
      required: true,
      items: ziweiTimeRangeOutputSchema,
    },
    timeSlot: {
      type: 'object',
      additionalProperties: false,
      required: true,
      properties: {
        index: { type: 'integer', required: true },
        name: { type: 'string', required: true },
        range: { ...ziweiTimeRangeOutputSchema, required: true },
      },
    },
    chineseDate: { type: 'string', required: true },
    lifePalace: { ...ziweiPalaceAnchorOutputSchema, required: true },
    bodyPalace: { ...ziweiPalaceAnchorOutputSchema, required: true },
    soul: { type: 'string', required: true },
    body: { type: 'string', required: true },
    fiveElementsClass: { type: 'string', required: true },
    palaces: { type: 'array', required: true, items: ziweiPalaceOutputSchema },
  },
} as const

const ziweiCalendarOutputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    input: {
      type: 'object',
      additionalProperties: false,
      required: true,
      properties: {
        calendar: { type: 'string', enum: ['gregorian', 'lunar'], required: true },
        year: { type: 'integer', required: true },
        month: { type: 'integer', required: true },
        day: { type: 'integer', required: true },
        leapMonth: { type: 'boolean' },
      },
    },
    solarDate: {
      type: 'object',
      additionalProperties: false,
      required: true,
      properties: {
        year: { type: 'integer', required: true },
        month: { type: 'integer', required: true },
        day: { type: 'integer', required: true },
      },
    },
    lunarDate: {
      type: 'object',
      additionalProperties: false,
      required: true,
      properties: {
        year: { type: 'integer', required: true },
        month: { type: 'integer', required: true },
        day: { type: 'integer', required: true },
        leapMonth: { type: 'boolean', required: true },
        display: { type: 'string', required: true },
      },
    },
    timeZone: { type: 'string', required: true },
  },
} as const

const ziweiResolvedConventionOutputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    value: { type: 'string', required: true },
    source: resolvedConventionSourceOutputSchema,
  },
} as const

const ziweiChartOutputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    system: { type: 'string', const: 'ziwei', required: true },
    timePrecision: { type: 'string', enum: ['known', 'unknown'], required: true },
    calendar: { ...ziweiCalendarOutputSchema, required: true },
    candidates: { type: 'array', required: true, items: ziweiCandidateOutputSchema },
    conventions: {
      type: 'object',
      additionalProperties: false,
      required: true,
      properties: {
        school: {
          ...ziweiResolvedConventionOutputSchema,
          required: true,
          properties: {
            value: { type: 'string', enum: ['standard', 'zhongzhou'], required: true },
            source: resolvedConventionSourceOutputSchema,
          },
        },
        leapMonthRule: {
          ...ziweiResolvedConventionOutputSchema,
          required: true,
          properties: {
            value: {
              type: 'string',
              enum: ['split_at_day_15', 'whole_leap_month'],
              required: true,
            },
            source: resolvedConventionSourceOutputSchema,
          },
        },
        dayBoundary: { type: 'string', const: 'zi_hour_next_day', required: true },
        yearBoundary: { type: 'string', const: 'lunar_new_year', required: true },
        horoscopeBoundary: { type: 'string', const: 'lunar_new_year', required: true },
        ageBoundary: { type: 'string', const: 'nominal_year', required: true },
      },
    },
    provenance: {
      type: 'object',
      additionalProperties: false,
      required: true,
      properties: {
        provider: { type: 'string', const: 'iztro', required: true },
        providerVersion: { type: 'string', const: '2.5.8', required: true },
      },
    },
    warnings: { type: 'array', required: true, items: { type: 'string' } },
  },
} as const

const ziweiSuccessSystemOutputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    system: { type: 'string', const: 'ziwei', required: true },
    status: { type: 'string', const: 'success', required: true },
    chart: { ...ziweiChartOutputSchema, required: true },
  },
} as const

const successSystemOutputSchema = {
  oneOf: [baziSuccessSystemOutputSchema, ziweiSuccessSystemOutputSchema],
} as const

const unavailableSystemOutputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    system: { type: 'string', enum: ['bazi', 'ziwei'], required: true },
    status: { type: 'string', const: 'unsupported', required: true },
    error: {
      type: 'object',
      additionalProperties: false,
      required: true,
      properties: {
        code: {
          type: 'string',
          enum: ['BAZI_NOT_IMPLEMENTED', 'ZIWEI_NOT_IMPLEMENTED'],
          required: true,
        },
        retryable: { type: 'boolean', const: false, required: true },
      },
    },
  },
} as const

const successOutputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    status: { type: 'string', const: 'success', required: true },
    schemaVersion: schemaVersionOutputSchema,
    requestedSystems: { ...requestedSystemsOutputSchema, required: true },
    systems: { type: 'array', required: true, items: successSystemOutputSchema },
  },
} as const

const partialOutputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    status: { type: 'string', const: 'partial', required: true },
    schemaVersion: schemaVersionOutputSchema,
    requestedSystems: { ...requestedSystemsOutputSchema, required: true },
    systems: {
      type: 'array',
      required: true,
      items: {
        oneOf: [
          baziSuccessSystemOutputSchema,
          ziweiSuccessSystemOutputSchema,
          unavailableSystemOutputSchema,
        ],
      },
    },
  },
} as const

const needsClarificationOutputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    status: { type: 'string', const: 'needs_clarification', required: true },
    schemaVersion: schemaVersionOutputSchema,
    requestedSystems: { ...requestedSystemsOutputSchema, required: true },
    error: {
      type: 'object',
      additionalProperties: false,
      required: true,
      properties: {
        code: {
          type: 'string',
          enum: [
            'INVALID_DATE',
            'INVALID_TIME',
            'INVALID_LOCATION',
            'UNSUPPORTED_TIMEZONE',
            'INVALID_SYSTEMS',
            'LONGITUDE_REQUIRED',
            'INVALID_LUNAR_DATE',
          ],
          required: true,
        },
        retryable: { type: 'boolean', const: true, required: true },
        field: { type: 'string', required: true },
        repair: { type: 'string', required: true },
      },
    },
  },
} as const

const unsupportedOutputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    status: { type: 'string', const: 'unsupported', required: true },
    schemaVersion: schemaVersionOutputSchema,
    requestedSystems: { ...requestedSystemsOutputSchema, required: true },
    error: {
      type: 'object',
      additionalProperties: false,
      required: true,
      properties: {
        code: {
          type: 'string',
          enum: ['REQUESTED_SYSTEMS_UNAVAILABLE', 'APPARENT_SOLAR_TIME_NOT_IMPLEMENTED'],
          required: true,
        },
        retryable: { type: 'boolean', const: false, required: true },
        systems: {
          type: 'array',
          required: true,
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              system: {
                type: 'string',
                enum: ['bazi', 'ziwei'],
                required: true,
              },
              code: {
                type: 'string',
                enum: [
                  'BAZI_NOT_IMPLEMENTED',
                  'ZIWEI_NOT_IMPLEMENTED',
                  'APPARENT_SOLAR_TIME_NOT_IMPLEMENTED',
                ],
                required: true,
              },
            },
          },
        },
      },
    },
  },
} as const

export const calculateFateChartOutputSchema = {
  oneOf: [
    successOutputSchema,
    partialOutputSchema,
    needsClarificationOutputSchema,
    unsupportedOutputSchema,
  ],
} as const satisfies ValueSchemaSpec

export type CalculateFateChartArgs = InferArgs<typeof calculateFateChartParameters>
export type CalculateFateChartResult = InferValue<typeof calculateFateChartOutputSchema>
