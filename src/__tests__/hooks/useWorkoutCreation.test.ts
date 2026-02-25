import { getNextSetDefaults } from '@/hooks/useWorkoutCreation'

describe('useWorkoutCreation defaults', () => {
  it('preserves zero load for bodyweight sets', () => {
    const defaults = getNextSetDefaults({
      targetLoad: 0,
      targetReps: 12,
    })

    expect(defaults).toEqual({
      targetLoad: 0,
      targetReps: 12,
    })
  })

  it('falls back to weighted defaults when no previous set exists', () => {
    const defaults = getNextSetDefaults()

    expect(defaults).toEqual({
      targetLoad: 20,
      targetReps: 10,
    })
  })
})
