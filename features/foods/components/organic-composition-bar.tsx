"use client"

interface Ingredient {
  name: string
  isOrganic: boolean
}

interface OrganicCompositionBarProps {
  ingredients: Ingredient[]
}

export function OrganicCompositionBar({ ingredients }: OrganicCompositionBarProps) {
  const totalIngredients = ingredients.length

  if (totalIngredients === 0) {
    return <div className="h-1.5 w-full bg-gray-200 rounded-full animate-pulse" />
  }

  const organicCount = ingredients.filter((ing) => ing.isOrganic).length
  const organicPercent = (organicCount / totalIngredients) * 100

  return (
    <div
      className="flex h-1.5 w-full rounded-full overflow-hidden bg-gray-200"
      title={`Organic: ${organicCount}/${totalIngredients}`}
    >
      <div className="bg-green-400 transition-all duration-500" style={{ width: `${organicPercent}%` }} />
    </div>
  )
}
