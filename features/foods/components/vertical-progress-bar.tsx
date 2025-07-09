"use client"

interface VerticalProgressBarProps {
  percentage: number
  height?: number
}

export function VerticalProgressBar({ percentage, height = 200 }: VerticalProgressBarProps) {
  return (
    <div
      className="relative w-8 bg-gray-200 rounded-full overflow-hidden"
      style={{ height }}
      title={`Daily Organic: ${Math.round(percentage)}%`}
    >
      <div
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-400 to-emerald-500 transition-all duration-500 ease-out"
        style={{ height: `${percentage}%` }}
      />
    </div>
  )
}
