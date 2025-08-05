'use client';

interface VerticalProgressBarProps {
  percentage: number;
  height?: number;
}

export function VerticalProgressBar({
  percentage,
  height = 200,
}: VerticalProgressBarProps) {
  // Ensure percentage is a valid number
  const safePercentage = isNaN(percentage)
    ? 0
    : Math.max(0, Math.min(100, percentage));

  return (
    <div
      className="relative w-8 bg-gray-200 rounded-full overflow-hidden border-2 border-gray-400"
      style={{ height }}
      title={`Daily Organic: ${Math.round(safePercentage)}%`}
    >
      {/* Green fill from bottom */}
      {safePercentage > 0 && (
        <div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-500 via-green-400 to-emerald-500 transition-all duration-700 ease-out rounded-full"
          style={{
            height: `${safePercentage}%`,
            minHeight: safePercentage > 0 ? '2px' : '0px',
          }}
        />
      )}

      {/* Percentage label for debugging */}
      <div className="absolute -right-12 top-1/2 transform -translate-y-1/2 text-xs text-gray-600 font-mono bg-white px-1 rounded border">
        {Math.round(safePercentage)}%
      </div>

      {/* Empty state indicator */}
      {safePercentage === 0 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-400 rounded-full opacity-60" />
      )}
    </div>
  );
}
