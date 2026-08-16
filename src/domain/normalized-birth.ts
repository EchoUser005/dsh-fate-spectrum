export type BirthCalendarDate =
  | {
      readonly calendar: 'gregorian'
      readonly year: number
      readonly month: number
      readonly day: number
    }
  | {
      readonly calendar: 'lunar'
      readonly year: number
      readonly month: number
      readonly day: number
      readonly leapMonth: boolean
    }

export interface KnownBirthClockTime {
  readonly status: 'known'
  readonly hour: number
  readonly minute: number
}

export interface UnknownBirthClockTime {
  readonly status: 'unknown'
}

export type BirthClockTime = KnownBirthClockTime | UnknownBirthClockTime

export interface NormalizedBirthLocation {
  readonly timeZone: string
  readonly longitudeDegrees?: number
  readonly latitudeDegrees?: number
  readonly label?: string
}

/**
 * Framework-free calculation input after the DSH adapter has validated and
 * normalized model arguments. Subject labels such as name/relation do not
 * belong here because they cannot change a chart calculation.
 */
export interface NormalizedBirth {
  readonly date: BirthCalendarDate
  readonly time: BirthClockTime
  readonly gender: 'male' | 'female'
  readonly location: NormalizedBirthLocation
}
