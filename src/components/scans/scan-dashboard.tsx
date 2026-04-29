"use client";

import { QualityGauge } from "./quality-gauge";
import { LanguageChart } from "./language-chart";
import { CommitActivityChart } from "./commit-activity-chart";
import { ScanIssuesTable } from "./scan-issues-table";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FileCode, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ScanResults {
  metrics?: {
    total_files: number;
    languages: Record<string, number>;
    largest_files: Array<{ path: string; size: number }>;
  };
  git_stats?: {
    total_commits: number;
    recent_commits: number;
    contributors: number;
    open_prs: number;
  };
  ai_analysis?: {
    overall_quality_score: number;
    summary: string;
    strengths: string[];
    issues: Array<{
      severity: string;
      category: string;
      file: string;
      description: string;
      suggestion?: string;
    }>;
  };
}

interface ScanDashboardProps {
  results: ScanResults;
  scanDate?: string | null;
  className?: string;
}

export function ScanDashboard({ results, scanDate, className }: ScanDashboardProps) {
  const { metrics, git_stats, ai_analysis } = results;

  const hasAiAnalysis = !!ai_analysis;
  const hasLanguages = !!metrics?.languages && Object.keys(metrics.languages).length > 0;
  const hasGitStats = !!git_stats;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Top summary bar */}
      <div className="flex flex-wrap items-center gap-4">
        {metrics && (
          <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
            <FileCode className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {metrics.total_files.toLocaleString()} files scanned
            </span>
          </div>
        )}
        {scanDate && (
          <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Scanned{" "}
              {formatDistanceToNow(new Date(scanDate), { addSuffix: true })}
            </span>
          </div>
        )}
      </div>

      {/* AI analysis summary */}
      {hasAiAnalysis && ai_analysis.summary && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm leading-relaxed">{ai_analysis.summary}</p>
            {ai_analysis.strengths && ai_analysis.strengths.length > 0 && (
              <div className="mt-3">
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  Strengths
                </p>
                <ul className="space-y-1">
                  {ai_analysis.strengths.map((s, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-400"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main dashboard grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quality gauge - only show when AI analysis is available */}
        {hasAiAnalysis && (
          <QualityGauge score={ai_analysis.overall_quality_score} />
        )}

        {/* Language chart */}
        {hasLanguages && <LanguageChart languages={metrics.languages} />}

        {/* Git stats */}
        {hasGitStats && (
          <CommitActivityChart
            gitStats={git_stats}
            className={!hasAiAnalysis && hasLanguages ? "" : ""}
          />
        )}

        {/* Largest files - only when we have data and space to fill */}
        {metrics?.largest_files && metrics.largest_files.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <p className="mb-3 text-sm font-medium">Largest Files</p>
              <div className="space-y-2">
                {metrics.largest_files.slice(0, 5).map((file) => (
                  <div
                    key={file.path}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <code className="min-w-0 truncate text-xs text-muted-foreground">
                      {file.path}
                    </code>
                    <span className="shrink-0 text-xs font-medium">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Issues table - full width below the grid */}
      {hasAiAnalysis && ai_analysis.issues && ai_analysis.issues.length > 0 && (
        <ScanIssuesTable issues={ai_analysis.issues} />
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
