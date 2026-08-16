export const FATE_SYSTEMS = ['bazi', 'ziwei'] as const

export type FateSystem = (typeof FATE_SYSTEMS)[number]
