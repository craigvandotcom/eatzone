'use client';

import { getZoneColor, getZoneColorWithAlpha } from '@/lib/utils/zone-colors';

interface FoodCategoryProgressProps {
  greenCount: number;
  yellowCount: number;
  redCount: number;
  size?: number;
  strokeWidth?: number;
  isFromToday?: boolean;
}

export function FoodCategoryProgress({
  greenCount,
  yellowCount,
  redCount,
  size = 200,
  isFromToday = true,
}: FoodCategoryProgressProps) {
  const radius = size / 2;
  const centerX = size / 2;
  const centerY = size / 2;
  const totalCount = greenCount + yellowCount + redCount;

  // Calculate angles for each section (in degrees)
  const greenAngle = totalCount > 0 ? (greenCount / totalCount) * 360 : 120;
  const yellowAngle = totalCount > 0 ? (yellowCount / totalCount) * 360 : 120;
  const redAngle = totalCount > 0 ? (redCount / totalCount) * 360 : 120;

  // Starting angles (Green starts at top, -90 degrees)
  const greenStart = -90;
  const redStart = greenStart + greenAngle;
  const yellowStart = redStart + redAngle;

  // Function to create SVG path for pie slice
  const createPieSlice = (startAngle: number, endAngle: number) => {
    // Handle full circle case (360 degrees)
    if (Math.abs(endAngle - startAngle) >= 360) {
      return `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 1 1 ${centerX + radius} ${centerY} A ${radius} ${radius} 0 1 1 ${centerX - radius} ${centerY} Z`;
    }

    const start = (startAngle * Math.PI) / 180;
    const end = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(start);
    const y1 = centerY + radius * Math.sin(start);
    const x2 = centerX + radius * Math.cos(end);
    const y2 = centerY + radius * Math.sin(end);

    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  return (
    <div
      className="relative flex flex-col items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size}>
        {/* Green slice (Good) */}
        <path
          d={createPieSlice(greenStart, greenStart + greenAngle)}
          fill={
            totalCount > 0
              ? getZoneColor('green', 'hex')
              : getZoneColorWithAlpha('green', '40')
          }
          className="transition-all duration-500 ease-in-out"
        />

        {/* Red slice (Bad) */}
        <path
          d={createPieSlice(redStart, redStart + redAngle)}
          fill={
            totalCount > 0
              ? getZoneColor('red', 'hex')
              : getZoneColorWithAlpha('red', '40')
          }
          className="transition-all duration-500 ease-in-out"
        />

        {/* Yellow slice (Maybe) */}
        <path
          d={createPieSlice(yellowStart, yellowStart + yellowAngle)}
          fill={
            totalCount > 0
              ? getZoneColor('yellow', 'hex')
              : getZoneColorWithAlpha('yellow', '40')
          }
          className="transition-all duration-500 ease-in-out"
        />
      </svg>

      {/* Center count display */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-3xl font-bold text-slate-700">{totalCount}</p>
          <p className="text-xs text-slate-500 mt-1">
            {isFromToday ? 'foods today' : 'recent foods'}
          </p>
        </div>
      </div>
    </div>
  );
}
