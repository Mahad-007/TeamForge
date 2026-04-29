"use client";

import Link from "next/link";
import { useLatestScan, useScanHistory, useTriggerScan } from "@/hooks/use-scans";
import { ScanDashboard } from "@/components/scans/scan-dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Loader2, Play } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface ScansClientProps {
  projectId: string;
  projectName: string;
  projectSlug: string;
  workspaceSlug: string;
  githubRepoUrl: string | null;
  currentMemberId: string;
}

export function ScansClient({
  projectId,
  projectName,
  projectSlug,
  workspaceSlug,
  githubRepoUrl,
  currentMemberId,
}: ScansClientProps) {
  const { data: latestScan, isLoading: scanLoading } = useLatestScan(projectId);
  const { data: history } = useScanHistory(projectId);
  const triggerScan = useTriggerScan(projectId);

  const base = `/${workspaceSlug}/projects/${projectSlug}`;
  const results = latestScan?.results as Record<string, unknown> | null;

  async function handleScan() {
    if (!githubRepoUrl) {
      toast.error("No GitHub repository linked to this project");
      return;
    }
    try {
      await triggerScan.mutateAsync({ memberId: currentMemberId });
      toast.success("Scan triggered. Results will appear shortly.");
    } catch {
      toast.error("Failed to trigger scan");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={base}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">{projectName}</h1>
            <p className="text-sm text-muted-foreground">Code quality scans</p>
          </div>
        </div>
        <Button
          onClick={handleScan}
          disabled={triggerScan.isPending || !githubRepoUrl}
        >
          {triggerScan.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          Scan Now
        </Button>
      </div>

      {!githubRepoUrl && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="p-4 text-sm text-warning">
            No GitHub repository linked. Connect a repo in project settings to enable scanning.
          </CardContent>
        </Card>
      )}

      {/* Latest scan results */}
      {scanLoading ? (
        <div className="space-y-4">
          <div className="flex gap-4">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-48" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      ) : results ? (
        <ScanDashboard
          results={results as Parameters<typeof ScanDashboard>[0]["results"]}
          scanDate={latestScan?.completed_at as string | null}
        />
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No scan results yet. Click &ldquo;Scan Now&rdquo; to analyze your repository.
          </CardContent>
        </Card>
      )}

      {/* Scan history */}
      {history && history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scan History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((scan) => (
                <div
                  key={scan.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        scan.status === "completed"
                          ? "default"
                          : scan.status === "failed"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {scan.status}
                    </Badge>
                    <span className="text-sm">
                      {scan.branch ?? "main"}
                    </span>
                    {scan.commit_sha && (
                      <code className="text-xs text-muted-foreground">
                        {scan.commit_sha.slice(0, 7)}
                      </code>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {scan.created_at &&
                      formatDistanceToNow(new Date(scan.created_at), {
                        addSuffix: true,
                      })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
