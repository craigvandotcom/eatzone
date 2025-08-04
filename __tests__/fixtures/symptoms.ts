import { Symptom } from "@/lib/types";

export const mockSymptoms: Symptom[] = [
  {
    id: "1",
    name: "Test Headache",
    timestamp: new Date("2024-01-15T14:00:00Z").toISOString(),
    severity: 3,
    notes: "Mild headache after lunch",
  },
  {
    id: "2",
    name: "Test Nausea",
    timestamp: new Date("2024-01-15T20:00:00Z").toISOString(),
    severity: 2,
    notes: "Feeling queasy",
  },
  {
    id: "3",
    name: "Test Fatigue",
    timestamp: new Date("2024-01-16T08:00:00Z").toISOString(),
    severity: 1,
    notes: "Slight tiredness",
  },
];
