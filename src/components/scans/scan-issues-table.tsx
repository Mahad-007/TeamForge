"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";

interface ScanIssue {
  severity: string;
  category: string;
  file: string;
  description: string;
  suggestion?: string;
}

interface ScanIssuesTableProps {
  issues: ScanIssue[];
  className?: string;
}

type SortKey = "severity" | "file" | "category";
type SortDir = "asc" | "desc";

const SEVERITY_ORDER: Record<string, number> = {
  error: 0,
  warning: 1,
  info: 2,
};

function getSeverityConfig(severity: string) {
  switch (severity.toLowerCase()) {
    case "error":
      return {
        variant: "destructive" as const,
        icon: <AlertCircle className="h-3.5 w-3.5" />,
        className: "text-red-600 dark:text-red-400",
      };
    case "warning":
      return {
        variant: "secondary" as const,
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
        className: "text-amber-600 dark:text-amber-400",
      };
    default:
      return {
        variant: "outline" as const,
        icon: <Info className="h-3.5 w-3.5" />,
        className: "text-blue-600 dark:text-blue-400",
      };
  }
}

function SeverityBadge({ severity }: { severity: string }) {
  const config = getSeverityConfig(severity);
  return (
    <Badge variant={config.variant} className="gap-1 capitalize">
      {config.icon}
      {severity}
    </Badge>
  );
}

export function ScanIssuesTable({ issues, className }: ScanIssuesTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("severity");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function toggleRow(index: number) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  const sortedIssues = useMemo(() => {
    const sorted = [...issues].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "severity":
          cmp =
            (SEVERITY_ORDER[a.severity.toLowerCase()] ?? 3) -
            (SEVERITY_ORDER[b.severity.toLowerCase()] ?? 3);
          break;
        case "file":
          cmp = a.file.localeCompare(b.file);
          break;
        case "category":
          cmp = a.category.localeCompare(b.category);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [issues, sortKey, sortDir]);

  if (issues.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="text-base">Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No issues found. Your code is looking great!
          </p>
        </CardContent>
      </Card>
    );
  }

  const errorCount = issues.filter(
    (i) => i.severity.toLowerCase() === "error"
  ).length;
  const warningCount = issues.filter(
    (i) => i.severity.toLowerCase() === "warning"
  ).length;
  const infoCount = issues.filter(
    (i) => i.severity.toLowerCase() === "info"
  ).length;

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            Issues ({issues.length})
          </CardTitle>
          <div className="flex items-center gap-2 text-xs">
            {errorCount > 0 && (
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <AlertCircle className="h-3 w-3" />
                {errorCount}
              </span>
            )}
            {warningCount > 0 && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3" />
                {warningCount}
              </span>
            )}
            {infoCount > 0 && (
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <Info className="h-3 w-3" />
                {infoCount}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Table header */}
        <div className="rounded-t-lg border-b bg-muted/50">
          <div className="grid grid-cols-[100px_1fr_2fr] items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
            <button
              type="button"
              onClick={() => handleSort("severity")}
              className="flex items-center gap-1 text-left hover:text-foreground transition-colors"
            >
              Severity
              <ArrowUpDown className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => handleSort("file")}
              className="flex items-center gap-1 text-left hover:text-foreground transition-colors"
            >
              File
              <ArrowUpDown className="h-3 w-3" />
            </button>
            <span>Description</span>
          </div>
        </div>

        {/* Table rows */}
        <div className="divide-y rounded-b-lg border-x border-b">
          {sortedIssues.map((issue, index) => {
            const hasSuggestion = !!issue.suggestion;
            const isExpanded = expandedRows.has(index);

            return (
              <Collapsible
                key={index}
                open={isExpanded}
                onOpenChange={() => hasSuggestion && toggleRow(index)}
              >
                <CollapsibleTrigger
                  disabled={!hasSuggestion}
                  className={cn(
                    "grid w-full grid-cols-[100px_1fr_2fr] items-start gap-2 px-3 py-2.5 text-left text-sm transition-colors",
                    hasSuggestion && "cursor-pointer hover:bg-muted/50",
                    !hasSuggestion && "cursor-default"
                  )}
                >
                  <div>
                    <SeverityBadge severity={issue.severity} />
                  </div>
                  <code className="truncate text-xs text-muted-foreground">
                    {issue.file}
                  </code>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm">{issue.description}</span>
                    {hasSuggestion && (
                      <ChevronDown
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                          isExpanded && "rotate-180"
                        )}
                      />
                    )}
                  </div>
                </CollapsibleTrigger>
                {hasSuggestion && (
                  <CollapsibleContent>
                    <div className="border-t bg-muted/30 px-3 py-2.5">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Suggestion
                      </p>
                      <p className="text-sm">{issue.suggestion}</p>
                    </div>
                  </CollapsibleContent>
                )}
              </Collapsible>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
