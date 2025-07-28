import { Symptom } from '@/lib/types'

export const mockSymptoms: Symptom[] = [
  {
    id: '1',
    name: 'digestive',
    timestamp: new Date('2024-01-15T14:00:00Z').toISOString(),
    severity: 3,
    notes: 'Mild bloating after lunch',
  },
  {
    id: '2',
    name: 'energy',
    timestamp: new Date('2024-01-15T20:00:00Z').toISOString(),
    severity: 2,
    notes: 'Feeling tired',
  },
  {
    id: '3',
    name: 'skin',
    timestamp: new Date('2024-01-16T08:00:00Z').toISOString(),
    severity: 1,
    notes: 'Skin looking good today',
  },
]