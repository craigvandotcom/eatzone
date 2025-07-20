import imageAnalysisPrompt from '../../prompts/image-analysis.md';
import ingredientZoningPrompt from '../../prompts/ingredient-zoning.md';

export const prompts = {
  imageAnalysis: imageAnalysisPrompt,
  ingredientZoning: ingredientZoningPrompt,
} as const;
