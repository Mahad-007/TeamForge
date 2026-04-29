"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  GitCommitHorizontal,
  GitBranch,
  Users,
  GitPullRequest,
} from "lucide-react";

interface GitStats {
  total_commits: number;
  recent_commits: number;
  contributors: number;
  open_prs: number;
}

interface CommitActivityChartProps {
  gitStats: GitStats;
  className?: string;
}

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
}

function StatCard({ icon, value, label, color }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", color)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-none tracking-tight">
          {value.toLocaleString()}
        </p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function CommitActivityChart({
  gitStats,
  className,
}: CommitActivityChartProps) {
  const stats: StatCardProps[] = [
    {
      icon: <GitCommitHorizontal className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      value: gitStats.total_commits,
      label: "Total Commits",
      color: "bg-blue-500/10",
    },
    {
      icon: <GitBranch className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
      value: gitStats.recent_commits,
      label: "Commits (30 days)",
      color: "bg-emerald-500/10",
    },
    {
      icon: <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />,
      value: gitStats.contributors,
      label: "Contributors",
      color: "bg-violet-500/10",
    },
    {
      icon: <GitPullRequest className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
      value: gitStats.open_prs,
      label: "Open PRs",
      color: "bg-amber-500/10",
    },
  ];

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="text-base">Repository Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
