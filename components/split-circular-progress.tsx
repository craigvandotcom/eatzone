"use client"

interface SplitCircularProgressProps {
  waterPercentage: number
  otherPercentage: number
  size?: number
  strokeWidth?: number
}

export function SplitCircularProgress({
  waterPercentage,
  otherPercentage,
  size = 200,
  strokeWidth = 12,
}: SplitCircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const halfCircumference = circumference / 2

  // Calculate stroke dash arrays for each half
  const waterStrokeDasharray = halfCircumference
  const waterStrokeDashoffset = halfCircumference - (waterPercentage / 100) * halfCircumference

  const otherStrokeDasharray = halfCircumference
  const otherStrokeDashoffset = halfCircumference - (otherPercentage / 100) * halfCircumference

  // Color functions for percentage text - matching icon color scheme
  const getWaterColor = (percentage: number) => {
    if (percentage <= 33) return "text-red-400" // Matches feel icon
    if (percentage <= 66) return "text-amber-500" // Matches move icon
    return "text-emerald-500" // Matches eat icon
  }

  const getOtherColor = (percentage: number) => {
    if (percentage <= 33) return "text-emerald-500" // Matches eat icon
    if (percentage <= 66) return "text-amber-500" // Matches move icon
    return "text-red-400" // Matches feel icon
  }

  return (
    <div className="relative flex flex-col items-center" style={{ width: size + 60, height: size + 20 }}>
      <svg width={size} height={size} className="transform -rotate-90" style={{ marginLeft: 30, marginRight: 30 }}>
        {/* Background circle */}
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#f1f5f9" strokeWidth={strokeWidth} fill="transparent" />

        {/* Water progress (left half) - Blue matching drink icon */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#waterGradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${waterStrokeDasharray} ${halfCircumference}`}
          strokeDashoffset={waterStrokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-in-out"
          transform={`rotate(0 ${size / 2} ${size / 2})`}
        />

        {/* Other liquids progress (right half) - Purple/Violet */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#otherGradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${otherStrokeDasharray} ${halfCircumference}`}
          strokeDashoffset={otherStrokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-in-out"
          transform={`rotate(180 ${size / 2} ${size / 2})`}
        />

        {/* Gradient definitions */}
        <defs>
          <linearGradient id="waterGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="otherGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>

        {/* Center vertical dividing line */}
        <line
          x1={strokeWidth / 2}
          y1={size / 2}
          x2={size - strokeWidth / 2}
          y2={size / 2}
          stroke="#e2e8f0"
          strokeWidth="2"
        />
      </svg>

      {/* Percentage labels - centered within the circle */}
      <div className="absolute flex items-center justify-center" style={{ left: 30, right: 30, top: 0, bottom: 0 }}>
        <div className="flex w-full justify-between px-6">
          <div className="text-center">
            <p className={`text-2xl font-bold transition-colors duration-300 ${getWaterColor(waterPercentage)}`}>
              {Math.round(waterPercentage)}%
            </p>
            <p className="text-xs text-slate-500 mt-1">2L</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold transition-colors duration-300 ${getOtherColor(otherPercentage)}`}>
              {Math.round(otherPercentage)}%
            </p>
            <p className="text-xs text-slate-500 mt-1">total</p>
          </div>
        </div>
      </div>

      {/* Side Labels - positioned outside the circle */}
      <div className="absolute inset-0 flex items-center justify-between" style={{ left: -15, right: -15 }}>
        <div className="text-center">
          <span className="text-sm text-slate-600 font-medium">Water</span>
        </div>
        <div className="text-center">
          <span className="text-sm text-slate-600 font-medium">Other</span>
        </div>
      </div>
    </div>
  )
}
