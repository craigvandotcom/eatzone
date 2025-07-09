"use client"

interface Ingredient {
  name: string
  healthCategory?: "green" | "yellow" | "red"
}

interface MealCompositionBarProps {
  ingredients: Ingredient[]
}

export function MealCompositionBar({ ingredients }: MealCompositionBarProps) {
  const totalIngredients = ingredients.length

  if (totalIngredients === 0) {
    // Still analyzing or no ingredients
    return (
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-gray-300 w-full animate-pulse"></div>
      </div>
    )
  }

  const greenCount = ingredients.filter((ing) => ing.healthCategory === "green").length
  const yellowCount = ingredients.filter((ing) => ing.healthCategory === "yellow").length
  const redCount = ingredients.filter((ing) => ing.healthCategory === "red").length
  const analyzedCount = greenCount + yellowCount + redCount

  if (analyzedCount < totalIngredients) {
    // Still analyzing
    return (
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-gray-300 w-full animate-pulse"></div>
      </div>
    )
  }

  const greenPercent = (greenCount / totalIngredients) * 100
  const yellowPercent = (yellowCount / totalIngredients) * 100
  const redPercent = (redCount / totalIngredients) * 100

  return (
    <div
      className="flex h-2 w-full rounded-full overflow-hidden"
      title={`Green: ${greenCount}, Yellow: ${yellowCount}, Red: ${redCount}`}
    >
      <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${greenPercent}%` }} />
      <div className="bg-amber-500 transition-all duration-500" style={{ width: `${yellowPercent}%` }} />
      <div className="bg-red-500 transition-all duration-500" style={{ width: `${redPercent}%` }} />
    </div>
  )
}
