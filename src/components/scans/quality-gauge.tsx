"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface QualityGaugeProps {
  score: number;
  className?: string;
}

function getScoreColor(score: number) {
  if (score <= 3) return { text: "text-red-500", stroke: "#ef4444", bg: "bg-red-500/10" };
  if (score <= 6) return { text: "text-amber-500", stroke: "#f59e0b", bg: "bg-amber-500/10" };
  return { text: "text-emerald-500", stroke: "#10b981", bg: "bg-emerald-500/10" };
}

function getScoreLabel(score: number) {
  if (score <= 3) return "Poor";
  if (score <= 6) return "Fair";
  if (score <= 8) return "Good";
  return "Excellent";
}

export function QualityGauge({ score, className }: QualityGaugeProps) {
  const clampedScore = Math.max(0, Math.min(10, score));
  const colors = getScoreColor(clampedScore);

  const gaugeData = useMemo(() => {
    const radius = 80;
    const strokeWidth = 12;
    const cx = 100;
    const cy = 100;
    // Semicircle from 180 degrees (left) to 0 degrees (right)
    const startAngle = Math.PI;
    const endAngle = 0;
    const sweepAngle = startAngle - endAngle;
    const filledAngle = startAngle - (clampedScore / 10) * sweepAngle;

    // Background arc (full semicircle)
    const bgStartX = cx + radius * Math.cos(startAngle);
    const bgStartY = cy - radius * Math.sin(startAngle);
    const bgEndX = cx + radius * Math.cos(endAngle);
    const bgEndY = cy - radius * Math.sin(endAngle);
    const bgPath = `M ${bgStartX} ${bgStartY} A ${radius} ${radius} 0 1 1 ${bgEndX} ${bgEndY}`;

    // Filled arc
    const fillEndX = cx + radius * Math.cos(filledAngle);
    const fillEndY = cy - radius * Math.sin(filledAngle);
    const largeArc = clampedScore / 10 > 0.5 ? 1 : 0;
    const fillPath =
      clampedScore > 0
        ? `M ${bgStartX} ${bgStartY} A ${radius} ${radius} 0 ${largeArc} 1 ${fillEndX} ${fillEndY}`
        : "";

    return { bgPath, fillPath, strokeWidth, cx, cy };
  }, [clampedScore]);

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="text-base">Quality Score</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center pb-6">
        <div className="relative w-[200px] h-[120px]">
          <svg
            viewBox="0 0 200 120"
            className="w-full h-full"
            aria-label={`Quality score: ${clampedScore.toFixed(1)} out of 10`}
          >
            {/* Background track */}
            <path
              d={gaugeData.bgPath}
              fill="none"
              stroke="currentColor"
              className="text-muted/40"
              strokeWidth={gaugeData.strokeWidth}
              strokeLinecap="round"
            />
            {/* Filled portion */}
            {gaugeData.fillPath && (
              <path
                d={gaugeData.fillPath}
                fill="none"
                stroke={colors.stroke}
                strokeWidth={gaugeData.strokeWidth}
                strokeLinecap="round"
              />
            )}
            {/* Score text */}
            <text
              x={gaugeData.cx}
              y={gaugeData.cy - 8}
              textAnchor="middle"
              className={cn("text-3xl font-bold fill-current", colors.text)}
              style={{ fontSize: "32px", fontWeight: 700 }}
            >
              {clampedScore.toFixed(1)}
            </text>
            <text
              x={gaugeData.cx}
              y={gaugeData.cy + 12}
              textAnchor="middle"
              className="fill-muted-foreground"
              style={{ fontSize: "12px" }}
            >
              / 10
            </text>
          </svg>
        </div>
        <span
          className={cn(
            "mt-1 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
            colors.bg,
            colors.text
          )}
        >
          {getScoreLabel(clampedScore)}
        </span>
      </CardContent>
    </Card>
  );
}
