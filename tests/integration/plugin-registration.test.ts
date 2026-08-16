import type { Context } from '@deepseek-ai/cordis'
import type { ToolDefinition } from '@deepseek-ai/dsh-tools'
import { describe, expect, it, vi } from 'vitest'

import { apply, inject, name } from '../../src/index.js'

describe('Cordis plugin registration', () => {
  it('declares the tools seam and registers calculate_fate_chart exactly once', () => {
    const register = vi.fn<(tool: ToolDefinition) => void>()
    const ctx = { tools: { register } } as unknown as Context

    apply(ctx)

    expect(name).toBe('dsh-fate-spectrum')
    expect(inject).toEqual(['tools'])
    expect(register).toHaveBeenCalledTimes(1)
    expect(register.mock.calls[0]?.[0].name).toBe('calculate_fate_chart')
  })
})
