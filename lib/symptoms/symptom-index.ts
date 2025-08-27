// New simplified symptom system for nutrition testing
// 4 categories with delta rating scale optimized for food sensitivity tracking

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
    categoryIcon: '🍽️',
    searchTerms: ['nausea', 'sick', 'queasy', 'upset stomach', 'vomiting'],
  },
  {
    id: 'diarrhea',
    name: 'Diarrhea',
    category: 'digestion',
    categoryIcon: '🍽️',
    searchTerms: [
      'diarrhea',
      'loose stools',
      'watery stools',
      'frequent bowel movements',
    ],
  },
  {
    id: 'constipation',
    name: 'Constipation',
    category: 'digestion',
    categoryIcon: '🍽️',
    searchTerms: [
      'constipation',
      'blocked',
      'hard stools',
      'infrequent bowel movements',
    ],
  },
  {
    id: 'bloat',
    name: 'Bloating',
    category: 'digestion',
    categoryIcon: '🍽️',
    searchTerms: ['bloat', 'bloating', 'swollen', 'distended', 'full feeling'],
  },
  {
    id: 'gas',
    name: 'Gas',
    category: 'digestion',
    categoryIcon: '🍽️',
    searchTerms: ['gas', 'flatulence', 'wind', 'belching', 'burping'],
  },
  {
    id: 'heartburn',
    name: 'Heartburn',
    category: 'digestion',
    categoryIcon: '🍽️',
    searchTerms: [
      'heartburn',
      'acid reflux',
      'GERD',
      'burning chest',
      'indigestion',
    ],
  },
  {
    id: 'abdominal_pain',
    name: 'Abdominal Pain',
    category: 'digestion',
    categoryIcon: '🍽️',
    searchTerms: [
      'abdominal pain',
      'stomach ache',
      'belly pain',
      'cramps',
      'stomach cramps',
    ],
  },

  // ENERGY CATEGORY (4 symptoms)
  {
    id: 'fatigue',
    name: 'Fatigue',
    category: 'energy',
    categoryIcon: '⚡',
    searchTerms: ['fatigue', 'tired', 'exhausted', 'worn out', 'drained'],
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
    ],
  },

  // MIND CATEGORY (7 symptoms)
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
    ],
  },
  {
    id: 'brain_fog_confusion',
    name: 'Brain Fog/Confusion',
    category: 'mind',
    categoryIcon: '🧠',
    searchTerms: [
      'brain fog',
      'confusion',
      'cloudy thinking',
      'mental fog',
      'unclear thinking',
    ],
  },
  {
    id: 'decision_difficulty',
    name: 'Decision Difficulty',
    category: 'mind',
    categoryIcon: '🧠',
    searchTerms: [
      'decision difficulty',
      'indecisive',
      "can't decide",
      'decision paralysis',
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
    ],
  },

  // RECOVERY CATEGORY (6 symptoms)
  {
    id: 'joint_aches',
    name: 'Joint Aches',
    category: 'recovery',
    categoryIcon: '🦴',
    searchTerms: ['joint aches', 'joint pain', 'aching joints', 'stiff joints'],
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
    ],
  },
  {
    id: 'stiffness',
    name: 'Stiffness',
    category: 'recovery',
    categoryIcon: '🦴',
    searchTerms: ['stiffness', 'stiff', 'rigid', 'tight muscles', 'inflexible'],
  },
  {
    id: 'weakness',
    name: 'Weakness',
    category: 'recovery',
    categoryIcon: '🦴',
    searchTerms: ['weakness', 'weak', 'feeble', 'lack of strength', 'frail'],
  },
  {
    id: 'tiredness',
    name: 'Tiredness',
    category: 'recovery',
    categoryIcon: '🦴',
    searchTerms: ['tiredness', 'tired', 'sleepy', 'drowsy', 'weary'],
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
    ],
  },
];

// Category information
export const SYMPTOM_CATEGORIES: SymptomCategoryInfo[] = [
  {
    name: 'digestion',
    displayName: 'Digestion',
    icon: '🍽️',
    count: 7,
    description: 'Digestive system symptoms and gut health indicators',
  },
  {
    name: 'energy',
    displayName: 'Energy',
    icon: '⚡',
    count: 4,
    description: 'Energy levels, motivation, and activity symptoms',
  },
  {
    name: 'mind',
    displayName: 'Mind',
    icon: '🧠',
    count: 7,
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

// Delta score descriptions
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
