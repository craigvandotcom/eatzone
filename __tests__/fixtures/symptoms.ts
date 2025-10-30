import { Symptom } from '@/lib/types';

export const mockSymptoms: Symptom[] = [
  {
    id: '1',
    symptom_id: 'headache',
    category: 'mind',
    name: 'Headache',
    timestamp: new Date('2024-01-15T14:00:00Z').toISOString(),
    notes: 'Mild headache after lunch',
  },
  {
    id: '2',
    symptom_id: 'nausea',
    category: 'digestion',
    name: 'Nausea',
    timestamp: new Date('2024-01-15T20:00:00Z').toISOString(),
    notes: 'Feeling queasy',
  },
  {
    id: '3',
    symptom_id: 'fatigue',
    category: 'energy',
    name: 'Fatigue',
    timestamp: new Date('2024-01-16T08:00:00Z').toISOString(),
    notes: 'Slight tiredness',
  },
];
