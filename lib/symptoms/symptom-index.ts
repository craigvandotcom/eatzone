// Simplified symptom system for nutrition testing
// 4 categories with simple 0/1 toggle optimized for food sensitivity tracking

import { SymptomCategory } from '@/lib/types';

export interface SymptomDefinition {
  id: string; // Simple identifier matching your JSON
  name: string; // Human-readable name
  category: SymptomCategory;
  categoryIcon: string;
  searchTerms: string[];
  description?: string;
}

export interface SymptomCategoryInfo {
  name: SymptomCategory;
  displayName: string;
  icon: string;
  count: number;
  description: string;
}

// Complete symptom definitions - 18 symptoms across 4 categories
export const SYMPTOMS: SymptomDefinition[] = [
  // DIGESTION CATEGORY (7 symptoms)
  {
    id: 'nausea',
    name: 'Nausea',
    category: 'digestion',
    categoryIcon: '🦠',
    searchTerms: [
      'nausea',
      'sick',
      'queasy',
      'upset stomach',
      'vomiting',
      'digestion',
    ],
  },
  {
    id: 'diarrhea',
    name: 'Diarrhea',
    category: 'digestion',
    categoryIcon: '🦠',
    searchTerms: [
      'diarrhea',
      'loose stools',
      'watery stools',
      'frequent bowel movements',
      'digestion',
    ],
  },
  {
    id: 'constipation',
    name: 'Constipation',
    category: 'digestion',
    categoryIcon: '🦠',
    searchTerms: [
      'constipation',
      'blocked',
      'hard stools',
      'infrequent bowel movements',
      'digestion',
    ],
  },
  {
    id: 'bloat',
    name: 'Bloating',
    category: 'digestion',
    categoryIcon: '🦠',
    searchTerms: [
      'bloat',
      'bloating',
      'swollen',
      'distended',
      'full feeling',
      'digestion',
    ],
  },
  {
    id: 'gas',
    name: 'Gas',
    category: 'digestion',
    categoryIcon: '🦠',
    searchTerms: [
      'gas',
      'flatulence',
      'wind',
      'belching',
      'burping',
      'digestion',
    ],
  },
  {
    id: 'heartburn',
    name: 'Heartburn',
    category: 'digestion',
    categoryIcon: '🦠',
    searchTerms: [
      'heartburn',
      'acid reflux',
      'GERD',
      'burning chest',
      'indigestion',
      'digestion',
    ],
  },
  {
    id: 'abdominal_pain',
    name: 'Abdominal Pain',
    category: 'digestion',
    categoryIcon: '🦠',
    searchTerms: [
      'abdominal pain',
      'stomach ache',
      'belly pain',
      'cramps',
      'stomach cramps',
      'digestion',
    ],
  },

  // ENERGY CATEGORY (5 symptoms)
  {
    id: 'fatigue',
    name: 'Fatigue',
    category: 'energy',
    categoryIcon: '⚡',
    searchTerms: [
      'fatigue',
      'tired',
      'exhausted',
      'worn out',
      'drained',
      'energy',
    ],
  },
  {
    id: 'apathy',
    name: 'Apathy',
    category: 'energy',
    categoryIcon: '⚡',
    searchTerms: [
      'apathy',
      'lack of motivation',
      'indifferent',
      'unmotivated',
      'listless',
      'energy',
    ],
  },
  {
    id: 'hyperactivity',
    name: 'Hyperactivity',
    category: 'energy',
    categoryIcon: '⚡',
    searchTerms: [
      'hyperactivity',
      'hyperactive',
      'overstimulated',
      'hyper',
      'excessive energy',
      'energy',
    ],
  },
  {
    id: 'restlessness',
    name: 'Restlessness',
    category: 'energy',
    categoryIcon: '⚡',
    searchTerms: [
      'restlessness',
      'restless',
      'fidgety',
      "can't sit still",
      'agitated',
      'energy',
    ],
  },
  {
    id: 'inspiration',
    name: 'Inspiration',
    category: 'energy',
    categoryIcon: '⚡',
    searchTerms: [
      'inspiration',
      'inspired',
      'motivated',
      'creative',
      'energized',
      'energy',
    ],
  },

  // MIND CATEGORY (8 symptoms)
  {
    id: 'poor_memory',
    name: 'Poor Memory',
    category: 'mind',
    categoryIcon: '🧠',
    searchTerms: [
      'poor memory',
      'forgetful',
      'memory problems',
      "can't remember",
      'mind',
    ],
  },
  {
    id: 'poor_concentration',
    name: 'Poor Concentration',
    category: 'mind',
    categoryIcon: '🧠',
    searchTerms: [
      'poor concentration',
      "can't focus",
      'distracted',
      'attention problems',
      'mind',
    ],
  },
  {
    id: 'brain_fog',
    name: 'Brain Fog',
    category: 'mind',
    categoryIcon: '🧠',
    searchTerms: [
      'brain fog',
      'cloudy thinking',
      'mental fog',
      'unclear thinking',
      'foggy',
      'mind',
    ],
  },
  {
    id: 'confusion',
    name: 'Confusion',
    category: 'mind',
    categoryIcon: '🧠',
    searchTerms: [
      'confusion',
      'confused',
      'disoriented',
      'mixed up',
      'bewildered',
      'mind',
    ],
  },
  {
    id: 'decisiveness',
    name: 'Decisiveness',
    category: 'mind',
    categoryIcon: '🧠',
    searchTerms: [
      'decisiveness',
      'decisive',
      'quick decisions',
      'clear thinking',
      'confident choices',
      'mind',
    ],
  },
  {
    id: 'irritability',
    name: 'Irritability',
    category: 'mind',
    categoryIcon: '🧠',
    searchTerms: [
      'irritability',
      'irritable',
      'short temper',
      'easily annoyed',
      'cranky',
      'mind',
    ],
  },
  {
    id: 'anxiety',
    name: 'Anxiety',
    category: 'mind',
    categoryIcon: '🧠',
    searchTerms: [
      'anxiety',
      'anxious',
      'worried',
      'nervous',
      'panic',
      'stress',
      'mind',
    ],
  },
  {
    id: 'mood_swings',
    name: 'Mood Swings',
    category: 'mind',
    categoryIcon: '🧠',
    searchTerms: [
      'mood swings',
      'moody',
      'emotional ups and downs',
      'unstable mood',
      'mind',
    ],
  },

  // RECOVERY CATEGORY (6 symptoms)
  {
    id: 'joint_aches',
    name: 'Joint Aches',
    category: 'recovery',
    categoryIcon: '🦴',
    searchTerms: [
      'joint aches',
      'joint pain',
      'aching joints',
      'stiff joints',
      'recovery',
    ],
  },
  {
    id: 'muscle_aches',
    name: 'Muscle Aches',
    category: 'recovery',
    categoryIcon: '🦴',
    searchTerms: [
      'muscle aches',
      'muscle pain',
      'sore muscles',
      'muscle soreness',
      'recovery',
    ],
  },
  {
    id: 'stiffness',
    name: 'Stiffness',
    category: 'recovery',
    categoryIcon: '🦴',
    searchTerms: [
      'stiffness',
      'stiff',
      'rigid',
      'tight muscles',
      'inflexible',
      'recovery',
    ],
  },
  {
    id: 'weakness',
    name: 'Weakness',
    category: 'recovery',
    categoryIcon: '🦴',
    searchTerms: [
      'weakness',
      'weak',
      'feeble',
      'lack of strength',
      'frail',
      'recovery',
    ],
  },
  {
    id: 'tiredness',
    name: 'Tiredness',
    category: 'recovery',
    categoryIcon: '🦴',
    searchTerms: [
      'tiredness',
      'tired',
      'sleepy',
      'drowsy',
      'weary',
      'recovery',
    ],
  },
  {
    id: 'palpitations',
    name: 'Palpitations',
    category: 'recovery',
    categoryIcon: '🦴',
    searchTerms: [
      'palpitations',
      'heart racing',
      'rapid heartbeat',
      'heart pounding',
      'irregular heartbeat',
      'recovery',
    ],
  },
];

// Category information
export const SYMPTOM_CATEGORIES: SymptomCategoryInfo[] = [
  {
    name: 'digestion',
    displayName: 'Digestion',
    icon: '🦠',
    count: 7,
    description: 'Digestive system symptoms and gut health indicators',
  },
  {
    name: 'energy',
    displayName: 'Energy',
    icon: '⚡',
    count: 5,
    description: 'Energy levels, motivation, and activity symptoms',
  },
  {
    name: 'mind',
    displayName: 'Mind',
    icon: '🧠',
    count: 8,
    description: 'Cognitive function, mood, and mental clarity symptoms',
  },
  {
    name: 'recovery',
    displayName: 'Recovery',
    icon: '🦴',
    count: 6,
    description: 'Physical recovery, aches, and cardiovascular symptoms',
  },
];

// Helper functions
export function getSymptomById(id: string): SymptomDefinition | undefined {
  return SYMPTOMS.find(symptom => symptom.id === id);
}

export function getSymptomsByCategory(
  category: SymptomCategory
): SymptomDefinition[] {
  return SYMPTOMS.filter(symptom => symptom.category === category);
}

export function getCategoryInfo(
  category: SymptomCategory
): SymptomCategoryInfo | undefined {
  return SYMPTOM_CATEGORIES.find(cat => cat.name === category);
}

/**
 * Safe wrapper for getCategoryInfo with runtime validation
 * Returns undefined if category is invalid or missing
 *
 * @param category - Category to look up (may be invalid/missing)
 * @returns CategoryInfo or undefined if invalid
 */
export function getCategoryInfoSafe(
  category: SymptomCategory | string | null | undefined
): SymptomCategoryInfo | undefined {
  // Validate category exists and is valid
  if (!category || typeof category !== 'string') {
    return undefined;
  }

  // Type guard: check if category is a valid SymptomCategory
  const validCategories: SymptomCategory[] = [
    'digestion',
    'energy',
    'mind',
    'recovery',
  ];
  if (!validCategories.includes(category as SymptomCategory)) {
    return undefined;
  }

  return getCategoryInfo(category as SymptomCategory);
}

// Simple symptom score descriptions
export const SYMPTOM_SCORE_LABELS = {
  '0': 'Baseline',
  '1': 'Present',
} as const;

export const SYMPTOM_SCORE_DESCRIPTIONS = {
  '0': 'Normal baseline - symptom not present',
  '1': 'Symptom is present',
} as const;

// Legacy delta score descriptions (for migration reference)
export const DELTA_SCORE_LABELS = {
  '-2': 'Much Worse',
  '-1': 'Worse',
  '0': 'Baseline',
  '1': 'Better',
  '2': 'Much Better',
} as const;

export const DELTA_SCORE_DESCRIPTIONS = {
  '-2': 'Significantly worse than usual - major flare or reaction',
  '-1': 'Somewhat worse than usual - mild flare or reaction',
  '0': 'Normal baseline - typical state for you',
  '1': 'Somewhat better than usual - mild improvement',
  '2': 'Significantly better than usual - major improvement',
} as const;

// Search functionality
export function searchSymptoms(query: string): SymptomDefinition[] {
  if (!query.trim()) return [];

  const searchTerm = query.toLowerCase().trim();

  return SYMPTOMS.filter(symptom => {
    // Search in name
    if (symptom.name.toLowerCase().includes(searchTerm)) return true;

    // Search in search terms
    return symptom.searchTerms.some(term =>
      term.toLowerCase().includes(searchTerm)
    );
  }).sort((a, b) => {
    // Prioritize exact name matches
    const aNameMatch = a.name.toLowerCase().includes(searchTerm);
    const bNameMatch = b.name.toLowerCase().includes(searchTerm);

    if (aNameMatch && !bNameMatch) return -1;
    if (!aNameMatch && bNameMatch) return 1;

    return a.name.localeCompare(b.name);
  });
}
