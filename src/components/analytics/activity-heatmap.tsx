"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ActivityHeatmapProps {
  data: Record<string, number>; // { "2026-04-01": 5, "2026-04-02": 12, ... }
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getIntensityClass(count: number): string {
  if (count === 0) return "bg-muted";
  if (count <= 2) return "bg-green-200 dark:bg-green-900";
  if (count <= 5) return "bg-green-400 dark:bg-green-700";
  return "bg-green-600 dark:bg-green-500";
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{
    date: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  const weeks = useMemo(() => {
    const today = new Date();
    const result: { date: string; count: number; dayOfWeek: number }[][] = [];

    // Build 52 weeks of data ending on today
    const endDate = new Date(today);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364); // 52 weeks back

    // Align start to Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());

    let currentWeek: { date: string; count: number; dayOfWeek: number }[] = [];
    const cursor = new Date(startDate);

    while (cursor <= endDate) {
      const dateStr = cursor.toISOString().split("T")[0];
      currentWeek.push({
        date: dateStr,
        count: data[dateStr] ?? 0,
        dayOfWeek: cursor.getDay(),
      });

      if (cursor.getDay() === 6) {
        result.push(currentWeek);
        currentWeek = [];
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }

    return result;
  }, [data]);

  if (Object.keys(data).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            No activity data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto">
          <div className="inline-flex gap-0.5">
            {/* Day labels column */}
            <div className="flex flex-col gap-0.5 pr-1">
              {DAY_LABELS.map((label, i) => (
                <div
                  key={i}
                  className="flex h-3 w-6 items-center text-[9px] text-muted-foreground"
                >
                  {i % 2 === 1 ? label : ""}
                </div>
              ))}
            </div>

            {/* Weeks grid */}
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-0.5">
                {Array.from({ length: 7 }).map((_, dayIdx) => {
                  const cell = week.find((c) => c.dayOfWeek === dayIdx);
                  if (!cell) {
                    return <div key={dayIdx} className="h-3 w-3" />;
                  }
                  return (
                    <div
                      key={dayIdx}
                      className={`h-3 w-3 rounded-[2px] ${getIntensityClass(cell.count)} cursor-default`}
                      onMouseEnter={(e) => {
                        const rect = (e.target as HTMLElement).getBoundingClientRect();
                        setHoveredCell({
                          date: cell.date,
                          count: cell.count,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        });
                      }}
                      onMouseLeave={() => setHoveredCell(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Tooltip */}
          {hoveredCell && (
            <div
              className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-md bg-foreground px-2 py-1 text-xs text-background shadow"
              style={{ left: hoveredCell.x, top: hoveredCell.y - 6 }}
            >
              <span className="font-medium">{hoveredCell.count}</span>{" "}
              {hoveredCell.count === 1 ? "activity" : "activities"} on{" "}
              {new Date(hoveredCell.date + "T00:00:00").toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          )}

          {/* Legend */}
          <div className="mt-3 flex items-center gap-1 text-[10px] text-muted-foreground">
            <span>Less</span>
            <div className="h-3 w-3 rounded-[2px] bg-muted" />
            <div className="h-3 w-3 rounded-[2px] bg-green-200 dark:bg-green-900" />
            <div className="h-3 w-3 rounded-[2px] bg-green-400 dark:bg-green-700" />
            <div className="h-3 w-3 rounded-[2px] bg-green-600 dark:bg-green-500" />
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
