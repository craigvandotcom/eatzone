// MSQ symptom search and filtering logic
// Provides fuzzy matching and smart ranking for symptom search interface

import {
  MSQ_SYMPTOMS,
  MSQ_CATEGORIES,
  type MSQSymptom,
  type MSQCategory,
} from './symptom-index';

export interface SearchResult {
  symptom: MSQSymptom;
  relevanceScore: number;
  matchType: 'exact' | 'partial' | 'category' | 'searchterm';
  matchedTerm?: string;
}

/**
 * Search symptoms with fuzzy matching and smart ranking
 * @param query Search query string
 * @param maxResults Maximum number of results to return (default: 20)
 * @returns Array of search results sorted by relevance
 */
export function searchSymptoms(
  query: string,
  maxResults: number = 20
): SearchResult[] {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  const results: SearchResult[] = [];

  // Search through all symptoms
  for (const symptom of MSQ_SYMPTOMS) {
    const searchResult = scoreSymptomMatch(symptom, normalizedQuery);
    if (searchResult) {
      results.push(searchResult);
    }
  }

  // Sort by relevance score (higher is better) and return top results
  return results
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxResults);
}

/**
 * Score how well a symptom matches the search query
 * @param symptom MSQ symptom to evaluate
 * @param query Normalized search query
 * @returns SearchResult if match found, undefined otherwise
 */
function scoreSymptomMatch(
  symptom: MSQSymptom,
  query: string
): SearchResult | undefined {
  const symptomName = symptom.name.toLowerCase();
  const categoryName = symptom.category.toLowerCase();

  // 1. Exact match on symptom name (highest score)
  if (symptomName === query) {
    return {
      symptom,
      relevanceScore: 100,
      matchType: 'exact',
      matchedTerm: symptom.name,
    };
  }

  // 2. Exact match on search terms
  for (const term of symptom.searchTerms) {
    const normalizedTerm = term.toLowerCase();
    if (normalizedTerm === query) {
      return {
        symptom,
        relevanceScore: 95,
        matchType: 'exact',
        matchedTerm: term,
      };
    }
  }

  // 3. Partial match at beginning of symptom name
  if (symptomName.startsWith(query)) {
    return {
      symptom,
      relevanceScore: 90,
      matchType: 'partial',
      matchedTerm: symptom.name,
    };
  }

  // 4. Partial match at beginning of search terms
  for (const term of symptom.searchTerms) {
    const normalizedTerm = term.toLowerCase();
    if (normalizedTerm.startsWith(query)) {
      return {
        symptom,
        relevanceScore: 85,
        matchType: 'searchterm',
        matchedTerm: term,
      };
    }
  }

  // 5. Contains match in symptom name
  if (symptomName.includes(query)) {
    const position = symptomName.indexOf(query);
    const score = 80 - position * 2; // Earlier matches score higher
    return {
      symptom,
      relevanceScore: Math.max(score, 60),
      matchType: 'partial',
      matchedTerm: symptom.name,
    };
  }

  // 6. Contains match in search terms
  for (const term of symptom.searchTerms) {
    const normalizedTerm = term.toLowerCase();
    if (normalizedTerm.includes(query)) {
      const position = normalizedTerm.indexOf(query);
      const score = 75 - position * 2;
      return {
        symptom,
        relevanceScore: Math.max(score, 50),
        matchType: 'searchterm',
        matchedTerm: term,
      };
    }
  }

  // 7. Category match (lowest score)
  if (categoryName.includes(query) || categoryName === query) {
    return {
      symptom,
      relevanceScore: 40,
      matchType: 'category',
      matchedTerm: symptom.category,
    };
  }

  return undefined;
}

/**
 * Get all symptoms grouped by category (for empty state)
 * @returns Symptoms grouped by category with category metadata
 */
export function getSymptomsByCategories(): Array<{
  category: MSQCategory;
  symptoms: MSQSymptom[];
}> {
  return MSQ_CATEGORIES.map(category => ({
    category,
    symptoms: MSQ_SYMPTOMS.filter(
      symptom => symptom.category === category.name
    ),
  }));
}

/**
 * Get symptoms for a specific category
 * @param categoryName Name of the MSQ category
 * @returns Array of symptoms in that category
 */
export function getSymptomsByCategory(categoryName: string): MSQSymptom[] {
  return MSQ_SYMPTOMS.filter(symptom => symptom.category === categoryName);
}

/**
 * Get a specific symptom by ID
 * @param symptomId MSQ symptom ID (e.g., 'head_headaches')
 * @returns MSQ symptom or undefined if not found
 */
export function getSymptomById(symptomId: string): MSQSymptom | undefined {
  return MSQ_SYMPTOMS.find(symptom => symptom.id === symptomId);
}

/**
 * Get category information by name
 * @param categoryName Name of the MSQ category
 * @returns MSQ category or undefined if not found
 */
export function getCategoryByName(
  categoryName: string
): MSQCategory | undefined {
  return MSQ_CATEGORIES.find(category => category.name === categoryName);
}

/**
 * Get suggestions for empty or short queries
 * @param query Current search query
 * @returns Array of suggested search terms
 */
export function getSearchSuggestions(query: string): string[] {
  const normalizedQuery = query.toLowerCase().trim();

  if (normalizedQuery.length === 0) {
    // Return popular symptom names for empty query
    return [
      'headache',
      'fatigue',
      'nausea',
      'bloating',
      'anxiety',
      'joint pain',
      'insomnia',
      'dizziness',
    ];
  }

  if (normalizedQuery.length < 2) {
    return [];
  }

  // Find search terms that start with the query
  const suggestions = new Set<string>();

  for (const symptom of MSQ_SYMPTOMS) {
    // Add symptom name if it starts with query
    if (symptom.name.toLowerCase().startsWith(normalizedQuery)) {
      suggestions.add(symptom.name.toLowerCase());
    }

    // Add search terms that start with query
    for (const term of symptom.searchTerms) {
      if (term.toLowerCase().startsWith(normalizedQuery)) {
        suggestions.add(term.toLowerCase());
      }
    }

    if (suggestions.size >= 8) break; // Limit suggestions
  }

  return Array.from(suggestions).slice(0, 8);
}

/**
 * Validate that a symptom ID exists in the MSQ index
 * @param symptomId MSQ symptom ID to validate
 * @returns true if valid, false otherwise
 */
export function isValidSymptomId(symptomId: string): boolean {
  return MSQ_SYMPTOMS.some(symptom => symptom.id === symptomId);
}

/**
 * Get total count of symptoms in each category
 * @returns Record mapping category names to symptom counts
 */
export function getCategoryCounts(): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const category of MSQ_CATEGORIES) {
    counts[category.name] = category.count;
  }

  return counts;
}
