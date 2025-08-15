// MSQ (Medical Symptoms Questionnaire) symptom index
// Comprehensive index of all MSQ symptoms for search-first interface

export interface MSQSymptom {
  id: string; // Unique identifier: 'category_symptomname'
  name: string; // Standardized symptom name from MSQ
  category: string; // MSQ category name
  categoryIcon: string; // Emoji for visual identification
  searchTerms: string[]; // Alternative search terms for better matching
  description?: string; // Optional clarification
}

export interface MSQCategory {
  name: string;
  icon: string;
  count: number;
  description?: string;
}

// Complete MSQ symptom index - all 65 symptoms from the MSQ specification
export const MSQ_SYMPTOMS: MSQSymptom[] = [
  // HEAD CATEGORY (4 symptoms)
  {
    id: 'head_headaches',
    name: 'Headaches',
    category: 'Head',
    categoryIcon: '🧠',
    searchTerms: [
      'headache',
      'head pain',
      'migraine',
      'tension headache',
      'cluster headache',
    ],
  },
  {
    id: 'head_faintness',
    name: 'Faintness',
    category: 'Head',
    categoryIcon: '🧠',
    searchTerms: [
      'faint',
      'fainting',
      'lightheaded',
      'light headed',
      'weak',
      'dizzy',
    ],
  },
  {
    id: 'head_dizziness',
    name: 'Dizziness',
    category: 'Head',
    categoryIcon: '🧠',
    searchTerms: [
      'dizzy',
      'vertigo',
      'spinning',
      'balance',
      'unsteady',
      'wobbly',
    ],
  },
  {
    id: 'head_insomnia',
    name: 'Insomnia',
    category: 'Head',
    categoryIcon: '🧠',
    searchTerms: [
      'insomnia',
      'sleepless',
      'sleep problems',
      'cant sleep',
      'trouble sleeping',
      'sleep disorder',
    ],
  },

  // EYES CATEGORY (4 symptoms)
  {
    id: 'eyes_watery_itchy',
    name: 'Watery or itchy eyes',
    category: 'Eyes',
    categoryIcon: '👁️',
    searchTerms: [
      'watery eyes',
      'itchy eyes',
      'eye itch',
      'tears',
      'tearing',
      'eye irritation',
    ],
  },
  {
    id: 'eyes_swollen_eyelids',
    name: 'Swollen, reddened/sticky eyelids',
    category: 'Eyes',
    categoryIcon: '👁️',
    searchTerms: [
      'swollen eyelids',
      'puffy eyes',
      'red eyelids',
      'sticky eyes',
      'crusty eyes',
    ],
  },
  {
    id: 'eyes_bags_circles',
    name: 'Bags, dark circles',
    category: 'Eyes',
    categoryIcon: '👁️',
    searchTerms: [
      'eye bags',
      'dark circles',
      'under eye bags',
      'tired eyes',
      'puffy eyes',
    ],
  },
  {
    id: 'eyes_blurred_vision',
    name: 'Blurred or tunnel vision (does not include near or far-sightedness)',
    category: 'Eyes',
    categoryIcon: '👁️',
    searchTerms: [
      'blurred vision',
      'tunnel vision',
      'blurry',
      'vision problems',
      'sight problems',
    ],
  },

  // EARS CATEGORY (4 symptoms)
  {
    id: 'ears_itchy',
    name: 'Itchy ears',
    category: 'Ears',
    categoryIcon: '👂',
    searchTerms: ['itchy ears', 'ear itch', 'ears itch', 'ear irritation'],
  },
  {
    id: 'ears_aches_infections',
    name: 'Earaches, ear infections',
    category: 'Ears',
    categoryIcon: '👂',
    searchTerms: [
      'earache',
      'ear ache',
      'ear pain',
      'ear infection',
      'ear hurt',
    ],
  },
  {
    id: 'ears_drainage',
    name: 'Drainage from ear',
    category: 'Ears',
    categoryIcon: '👂',
    searchTerms: [
      'ear drainage',
      'ear discharge',
      'fluid from ear',
      'ear leak',
      'ear wax',
    ],
  },
  {
    id: 'ears_ringing_hearing_loss',
    name: 'Ringing/hearing loss',
    category: 'Ears',
    categoryIcon: '👂',
    searchTerms: [
      'ear ringing',
      'tinnitus',
      'hearing loss',
      'deaf',
      'hard of hearing',
      'buzzing ears',
    ],
  },

  // NOSE CATEGORY (5 symptoms)
  {
    id: 'nose_stuffy',
    name: 'Stuffy nose',
    category: 'Nose',
    categoryIcon: '👃',
    searchTerms: [
      'stuffy nose',
      'blocked nose',
      'congested',
      'nasal congestion',
      'clogged nose',
    ],
  },
  {
    id: 'nose_sinus_problems',
    name: 'Sinus problems',
    category: 'Nose',
    categoryIcon: '👃',
    searchTerms: [
      'sinus problems',
      'sinus pain',
      'sinus pressure',
      'sinusitis',
      'sinus infection',
    ],
  },
  {
    id: 'nose_hay_fever',
    name: 'Hay fever',
    category: 'Nose',
    categoryIcon: '👃',
    searchTerms: [
      'hay fever',
      'allergic rhinitis',
      'seasonal allergies',
      'pollen allergy',
      'allergy',
    ],
  },
  {
    id: 'nose_sneezing_attacks',
    name: 'Sneezing attacks',
    category: 'Nose',
    categoryIcon: '👃',
    searchTerms: [
      'sneezing',
      'sneeze attacks',
      'sneezing fits',
      'achoo',
      'sneeze',
    ],
  },
  {
    id: 'nose_excessive_mucous',
    name: 'Excessive mucous',
    category: 'Nose',
    categoryIcon: '👃',
    searchTerms: [
      'excessive mucus',
      'runny nose',
      'mucous',
      'phlegm',
      'post nasal drip',
    ],
  },

  // MOUTH/THROAT CATEGORY (5 symptoms)
  {
    id: 'throat_chronic_coughing',
    name: 'Chronic coughing',
    category: 'Mouth/Throat',
    categoryIcon: '🗣️',
    searchTerms: [
      'chronic cough',
      'persistent cough',
      'coughing',
      'cough',
      'hack',
    ],
  },
  {
    id: 'throat_gagging_clearing',
    name: 'Gagging/throat clearing',
    category: 'Mouth/Throat',
    categoryIcon: '🗣️',
    searchTerms: [
      'gagging',
      'throat clearing',
      'clear throat',
      'gag',
      'throat scratch',
    ],
  },
  {
    id: 'throat_sore_hoarseness',
    name: 'Sore throat, hoarseness',
    category: 'Mouth/Throat',
    categoryIcon: '🗣️',
    searchTerms: [
      'sore throat',
      'hoarse',
      'hoarseness',
      'scratchy throat',
      'throat pain',
      'raspy voice',
    ],
  },
  {
    id: 'throat_swollen_discolored',
    name: 'Swollen/discolored tongue, gums, lips',
    category: 'Mouth/Throat',
    categoryIcon: '🗣️',
    searchTerms: [
      'swollen tongue',
      'swollen gums',
      'swollen lips',
      'discolored tongue',
      'tongue problems',
    ],
  },
  {
    id: 'throat_canker_sores',
    name: 'Canker sores',
    category: 'Mouth/Throat',
    categoryIcon: '🗣️',
    searchTerms: [
      'canker sores',
      'mouth sores',
      'mouth ulcers',
      'oral ulcers',
      'sores in mouth',
    ],
  },

  // SKIN CATEGORY (5 symptoms)
  {
    id: 'skin_acne',
    name: 'Acne',
    category: 'Skin',
    categoryIcon: '🫧',
    searchTerms: [
      'acne',
      'pimples',
      'breakout',
      'zits',
      'blackheads',
      'whiteheads',
    ],
  },
  {
    id: 'skin_hives_rashes',
    name: 'Hives, rashes, dry skin',
    category: 'Skin',
    categoryIcon: '🫧',
    searchTerms: [
      'hives',
      'rash',
      'rashes',
      'dry skin',
      'eczema',
      'dermatitis',
      'skin irritation',
    ],
  },
  {
    id: 'skin_hair_loss',
    name: 'Hair loss',
    category: 'Skin',
    categoryIcon: '🫧',
    searchTerms: [
      'hair loss',
      'balding',
      'thinning hair',
      'losing hair',
      'alopecia',
    ],
  },
  {
    id: 'skin_flushing_hot_flashes',
    name: 'Flushing, hot flashes',
    category: 'Skin',
    categoryIcon: '🫧',
    searchTerms: [
      'flushing',
      'hot flashes',
      'hot flush',
      'red face',
      'blushing',
      'heat waves',
    ],
  },
  {
    id: 'skin_excessive_sweating',
    name: 'Excessive sweating',
    category: 'Skin',
    categoryIcon: '🫧',
    searchTerms: [
      'excessive sweating',
      'hyperhidrosis',
      'sweating',
      'perspiration',
      'sweat',
    ],
  },

  // HEART CATEGORY (3 symptoms)
  {
    id: 'heart_irregular_beats',
    name: 'Irregular/skipped beats',
    category: 'Heart',
    categoryIcon: '❤️',
    searchTerms: [
      'irregular heartbeat',
      'skipped beats',
      'heart palpitations',
      'arrhythmia',
      'heart flutter',
    ],
  },
  {
    id: 'heart_rapid_pounding',
    name: 'Rapid/pounding beats',
    category: 'Heart',
    categoryIcon: '❤️',
    searchTerms: [
      'rapid heartbeat',
      'pounding heart',
      'fast heart rate',
      'tachycardia',
      'racing heart',
    ],
  },
  {
    id: 'heart_chest_pain',
    name: 'Chest pain',
    category: 'Heart',
    categoryIcon: '❤️',
    searchTerms: [
      'chest pain',
      'chest ache',
      'heart pain',
      'chest pressure',
      'angina',
    ],
  },

  // LUNGS CATEGORY (4 symptoms)
  {
    id: 'lungs_chest_congestion',
    name: 'Chest congestion',
    category: 'Lungs',
    categoryIcon: '🫁',
    searchTerms: [
      'chest congestion',
      'lung congestion',
      'chest tightness',
      'phlegm in chest',
    ],
  },
  {
    id: 'lungs_asthma_bronchitis',
    name: 'Asthma, bronchitis',
    category: 'Lungs',
    categoryIcon: '🫁',
    searchTerms: [
      'asthma',
      'bronchitis',
      'wheezing',
      'breathing problems',
      'lung inflammation',
    ],
  },
  {
    id: 'lungs_shortness_breath',
    name: 'Shortness of breath',
    category: 'Lungs',
    categoryIcon: '🫁',
    searchTerms: [
      'shortness of breath',
      'short of breath',
      'breathless',
      'winded',
      'dyspnea',
    ],
  },
  {
    id: 'lungs_difficulty_breathing',
    name: 'Difficulty breathing',
    category: 'Lungs',
    categoryIcon: '🫁',
    searchTerms: [
      'difficulty breathing',
      'trouble breathing',
      'hard to breathe',
      'labored breathing',
    ],
  },

  // DIGESTIVE TRACT CATEGORY (7 symptoms)
  {
    id: 'digestive_nausea_vomiting',
    name: 'Nausea, vomiting',
    category: 'Digestive Tract',
    categoryIcon: '🍽️',
    searchTerms: [
      'nausea',
      'vomiting',
      'nauseous',
      'sick to stomach',
      'throw up',
      'queasy',
    ],
  },
  {
    id: 'digestive_diarrhea',
    name: 'Diarrhea',
    category: 'Digestive Tract',
    categoryIcon: '🍽️',
    searchTerms: [
      'diarrhea',
      'loose stools',
      'runny stool',
      'frequent bowel movements',
    ],
  },
  {
    id: 'digestive_constipation',
    name: 'Constipation',
    category: 'Digestive Tract',
    categoryIcon: '🍽️',
    searchTerms: [
      'constipation',
      'constipated',
      'hard stools',
      'difficulty pooping',
      'irregular bowel',
    ],
  },
  {
    id: 'digestive_bloated',
    name: 'Bloated feeling',
    category: 'Digestive Tract',
    categoryIcon: '🍽️',
    searchTerms: ['bloated', 'bloating', 'swollen belly', 'distended', 'gassy'],
  },
  {
    id: 'digestive_belching_gas',
    name: 'Belching, passing gas',
    category: 'Digestive Tract',
    categoryIcon: '🍽️',
    searchTerms: [
      'belching',
      'burping',
      'passing gas',
      'flatulence',
      'gassy',
      'gas',
    ],
  },
  {
    id: 'digestive_heartburn',
    name: 'Heartburn',
    category: 'Digestive Tract',
    categoryIcon: '🍽️',
    searchTerms: [
      'heartburn',
      'acid reflux',
      'indigestion',
      'GERD',
      'burning chest',
    ],
  },
  {
    id: 'digestive_stomach_pain',
    name: 'Intestinal/stomach pain',
    category: 'Digestive Tract',
    categoryIcon: '🍽️',
    searchTerms: [
      'stomach pain',
      'intestinal pain',
      'abdominal pain',
      'belly ache',
      'gut pain',
    ],
  },

  // JOINTS/MUSCLE CATEGORY (5 symptoms)
  {
    id: 'joints_joint_pain',
    name: 'Pain or aches in joints',
    category: 'Joints/Muscle',
    categoryIcon: '🦴',
    searchTerms: [
      'joint pain',
      'joint aches',
      'joint stiffness',
      'knee pain',
      'elbow pain',
      'shoulder pain',
    ],
  },
  {
    id: 'joints_arthritis',
    name: 'Arthritis',
    category: 'Joints/Muscle',
    categoryIcon: '🦴',
    searchTerms: [
      'arthritis',
      'rheumatoid arthritis',
      'osteoarthritis',
      'joint inflammation',
    ],
  },
  {
    id: 'joints_stiffness',
    name: 'Stiffness/limited movement',
    category: 'Joints/Muscle',
    categoryIcon: '🦴',
    searchTerms: [
      'stiffness',
      'stiff joints',
      'limited movement',
      'restricted motion',
      'immobility',
    ],
  },
  {
    id: 'joints_muscle_pain',
    name: 'Pain or aches in muscles',
    category: 'Joints/Muscle',
    categoryIcon: '🦴',
    searchTerms: [
      'muscle pain',
      'muscle aches',
      'sore muscles',
      'muscle cramps',
      'myalgia',
    ],
  },
  {
    id: 'joints_weakness_tiredness',
    name: 'Feeling of weakness or tiredness',
    category: 'Joints/Muscle',
    categoryIcon: '🦴',
    searchTerms: [
      'weakness',
      'tired muscles',
      'muscle fatigue',
      'weak',
      'muscle tiredness',
    ],
  },

  // WEIGHT CATEGORY (6 symptoms)
  {
    id: 'weight_binge_eating',
    name: 'Binge eating/drinking',
    category: 'Weight',
    categoryIcon: '⚖️',
    searchTerms: [
      'binge eating',
      'overeating',
      'food binges',
      'compulsive eating',
      'eating disorder',
    ],
  },
  {
    id: 'weight_food_cravings',
    name: 'Craving certain foods',
    category: 'Weight',
    categoryIcon: '⚖️',
    searchTerms: [
      'food cravings',
      'cravings',
      'craving sweets',
      'craving carbs',
      'food addiction',
    ],
  },
  {
    id: 'weight_excessive',
    name: 'Excessive weight',
    category: 'Weight',
    categoryIcon: '⚖️',
    searchTerms: [
      'excessive weight',
      'overweight',
      'obesity',
      'weight gain',
      'heavy',
    ],
  },
  {
    id: 'weight_compulsive_eating',
    name: 'Compulsive eating',
    category: 'Weight',
    categoryIcon: '⚖️',
    searchTerms: [
      'compulsive eating',
      'emotional eating',
      'stress eating',
      'mindless eating',
    ],
  },
  {
    id: 'weight_water_retention',
    name: 'Water retention',
    category: 'Weight',
    categoryIcon: '⚖️',
    searchTerms: [
      'water retention',
      'fluid retention',
      'edema',
      'swelling',
      'puffy',
    ],
  },
  {
    id: 'weight_underweight',
    name: 'Underweight',
    category: 'Weight',
    categoryIcon: '⚖️',
    searchTerms: [
      'underweight',
      'weight loss',
      'too thin',
      'losing weight',
      'skinny',
    ],
  },

  // ENERGY/ACTIVITY CATEGORY (5 symptoms)
  {
    id: 'energy_fatigue',
    name: 'Fatigue/sluggishness',
    category: 'Energy/Activity',
    categoryIcon: '⚡',
    searchTerms: [
      'fatigue',
      'sluggish',
      'tired',
      'exhausted',
      'low energy',
      'lethargy',
    ],
  },
  {
    id: 'energy_apathy',
    name: 'Apathy, lethargy',
    category: 'Energy/Activity',
    categoryIcon: '⚡',
    searchTerms: [
      'apathy',
      'lethargy',
      'unmotivated',
      'listless',
      'indifferent',
      'no motivation',
    ],
  },
  {
    id: 'energy_hyperactivity',
    name: 'Hyperactivity',
    category: 'Energy/Activity',
    categoryIcon: '⚡',
    searchTerms: [
      'hyperactivity',
      'hyperactive',
      'restless',
      'fidgety',
      'hyper',
      'ADHD',
    ],
  },
  {
    id: 'energy_restless_leg',
    name: 'Restless leg',
    category: 'Energy/Activity',
    categoryIcon: '⚡',
    searchTerms: [
      'restless leg',
      'restless legs',
      'leg cramps',
      'leg twitching',
      'RLS',
    ],
  },
  {
    id: 'energy_jetlag',
    name: 'Jetlag',
    category: 'Energy/Activity',
    categoryIcon: '⚡',
    searchTerms: [
      'jetlag',
      'jet lag',
      'time zone',
      'travel fatigue',
      'circadian rhythm',
    ],
  },

  // MIND CATEGORY (8 symptoms)
  {
    id: 'mind_poor_memory',
    name: 'Poor memory',
    category: 'Mind',
    categoryIcon: '🧠',
    searchTerms: [
      'poor memory',
      'memory problems',
      'forgetful',
      'memory loss',
      'cant remember',
    ],
  },
  {
    id: 'mind_confusion',
    name: 'Confusion, poor comprehension',
    category: 'Mind',
    categoryIcon: '🧠',
    searchTerms: [
      'confusion',
      'confused',
      'poor comprehension',
      'brain fog',
      'unclear thinking',
    ],
  },
  {
    id: 'mind_poor_concentration',
    name: 'Poor concentration',
    category: 'Mind',
    categoryIcon: '🧠',
    searchTerms: [
      'poor concentration',
      'cant focus',
      'distracted',
      'attention problems',
      'unfocused',
    ],
  },
  {
    id: 'mind_poor_coordination',
    name: 'Poor physical coordination',
    category: 'Mind',
    categoryIcon: '🧠',
    searchTerms: [
      'poor coordination',
      'clumsy',
      'uncoordinated',
      'balance problems',
      'motor skills',
    ],
  },
  {
    id: 'mind_decision_difficulty',
    name: 'Difficulty making decisions',
    category: 'Mind',
    categoryIcon: '🧠',
    searchTerms: [
      'difficulty making decisions',
      'indecisive',
      'cant decide',
      'decision problems',
    ],
  },
  {
    id: 'mind_stuttering',
    name: 'Stuttering or stammering',
    category: 'Mind',
    categoryIcon: '🧠',
    searchTerms: [
      'stuttering',
      'stammering',
      'speech problems',
      'speech impediment',
      'stutter',
    ],
  },
  {
    id: 'mind_slurred_speech',
    name: 'Slurred speech',
    category: 'Mind',
    categoryIcon: '🧠',
    searchTerms: [
      'slurred speech',
      'slurring',
      'unclear speech',
      'mumbling',
      'speech problems',
    ],
  },
  {
    id: 'mind_learning_disabilities',
    name: 'Learning disabilities',
    category: 'Mind',
    categoryIcon: '🧠',
    searchTerms: [
      'learning disabilities',
      'learning problems',
      'dyslexia',
      'ADHD',
      'cognitive problems',
    ],
  },

  // EMOTIONS CATEGORY (4 symptoms)
  {
    id: 'emotions_mood_swings',
    name: 'Mood swings',
    category: 'Emotions',
    categoryIcon: '😊',
    searchTerms: [
      'mood swings',
      'moody',
      'emotional',
      'mood changes',
      'bipolar',
    ],
  },
  {
    id: 'emotions_anxiety',
    name: 'Anxiety, fear, nervousness',
    category: 'Emotions',
    categoryIcon: '😊',
    searchTerms: [
      'anxiety',
      'anxious',
      'fear',
      'nervous',
      'nervousness',
      'panic',
      'worry',
    ],
  },
  {
    id: 'emotions_anger',
    name: 'Anger, irritability, aggressiveness',
    category: 'Emotions',
    categoryIcon: '😊',
    searchTerms: [
      'anger',
      'angry',
      'irritability',
      'irritable',
      'aggressive',
      'agitation',
      'rage',
    ],
  },
  {
    id: 'emotions_depression',
    name: 'Depression',
    category: 'Emotions',
    categoryIcon: '😊',
    searchTerms: [
      'depression',
      'depressed',
      'sad',
      'sadness',
      'melancholy',
      'low mood',
    ],
  },

  // OTHER CATEGORY (4 symptoms)
  {
    id: 'other_frequent_illness',
    name: 'Frequent illness',
    category: 'Other',
    categoryIcon: '🔧',
    searchTerms: [
      'frequent illness',
      'always sick',
      'frequent colds',
      'weak immune system',
      'infections',
    ],
  },
  {
    id: 'other_frequent_urination',
    name: 'Frequent or urgent urination',
    category: 'Other',
    categoryIcon: '🔧',
    searchTerms: [
      'frequent urination',
      'urgent urination',
      'frequent peeing',
      'bladder problems',
    ],
  },
  {
    id: 'other_genital_problems',
    name: 'Genital itch or discharge',
    category: 'Other',
    categoryIcon: '🔧',
    searchTerms: [
      'genital itch',
      'genital discharge',
      'yeast infection',
      'UTI',
      'genital problems',
    ],
  },
  {
    id: 'other_bone_pain',
    name: 'Bone pain',
    category: 'Other',
    categoryIcon: '🔧',
    searchTerms: ['bone pain', 'bone ache', 'deep pain', 'skeletal pain'],
  },
];

// MSQ Categories with metadata
export const MSQ_CATEGORIES: MSQCategory[] = [
  { name: 'Head', icon: '🧠', count: 4 },
  { name: 'Eyes', icon: '👁️', count: 4 },
  { name: 'Ears', icon: '👂', count: 4 },
  { name: 'Nose', icon: '👃', count: 5 },
  { name: 'Mouth/Throat', icon: '🗣️', count: 5 },
  { name: 'Skin', icon: '🫧', count: 5 },
  { name: 'Heart', icon: '❤️', count: 3 },
  { name: 'Lungs', icon: '🫁', count: 4 },
  { name: 'Digestive Tract', icon: '🍽️', count: 7 },
  { name: 'Joints/Muscle', icon: '🦴', count: 5 },
  { name: 'Weight', icon: '⚖️', count: 6 },
  { name: 'Energy/Activity', icon: '⚡', count: 5 },
  { name: 'Mind', icon: '🧠', count: 8 },
  { name: 'Emotions', icon: '😊', count: 4 },
  { name: 'Other', icon: '🔧', count: 4 },
];

// Helper functions
export function getSymptomById(id: string): MSQSymptom | undefined {
  return MSQ_SYMPTOMS.find(symptom => symptom.id === id);
}

export function getSymptomsByCategory(category: string): MSQSymptom[] {
  return MSQ_SYMPTOMS.filter(symptom => symptom.category === category);
}

export function getAllCategories(): MSQCategory[] {
  return MSQ_CATEGORIES;
}

export function getCategoryByName(name: string): MSQCategory | undefined {
  return MSQ_CATEGORIES.find(category => category.name === name);
}

// Total symptom count for validation
export const TOTAL_MSQ_SYMPTOMS = MSQ_SYMPTOMS.length; // Should be 65+
