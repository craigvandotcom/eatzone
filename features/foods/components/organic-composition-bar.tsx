"use client";

interface Ingredient {
  name: string;
  isOrganic: boolean;
}

interface OrganicCompositionBarProps {
  ingredients: Ingredient[];
}

export function OrganicCompositionBar({
  ingredients,
}: OrganicCompositionBarProps) {
  const safeIngredients = ingredients || [];
  const totalIngredients = safeIngredients.length;

  if (totalIngredients === 0) {
    return (
      <div className="h-2 w-full bg-gray-200 rounded-full animate-pulse border border-gray-400" />
    );
  }

  const organicCount = safeIngredients.filter(
    ing => ing.isOrganic === true
  ).length;
  const organicPercent = (organicCount / totalIngredients) * 100;

  return (
    <div
      className="relative flex h-2 w-full rounded-full overflow-hidden bg-gray-200 border border-gray-400"
      title={`Organic: ${organicCount}/${totalIngredients}`}
    >
      {organicPercent > 0 && (
        <div
          className="bg-green-500 transition-all duration-500"
          style={{
            width: `${organicPercent}%`,
            minWidth: organicPercent > 0 ? "2px" : "0px",
          }}
        />
      )}
      {/* Empty state indicator */}
      {organicCount === 0 && (
        <div className="absolute right-0 w-1 h-full bg-gray-400 opacity-50" />
      )}
    </div>
  );
}
