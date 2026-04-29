"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useBugs, useCreateBug, useUpdateBug } from "@/hooks/use-bugs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BugDetailPanel } from "@/components/bugs/bug-detail-panel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertTriangle, ArrowLeft, Bug, ChevronDown, Download, Loader2, Plus } from "lucide-react";
import { BUG_SEVERITIES, BUG_STATUSES } from "@/types/enums";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { exportBugsPDF } from "@/lib/export/pdf";

const severityColors: Record<string, string> = {
  blocker: "bg-red-600 text-white",
  critical: "bg-red-500 text-white",
  major: "bg-orange-500 text-white",
  minor: "bg-amber-500 text-black",
  cosmetic: "bg-gray-400 text-white",
};

const statusColors: Record<string, string> = {
  open: "bg-red-500/10 text-red-600",
  confirmed: "bg-orange-500/10 text-orange-600",
  in_progress: "bg-blue-500/10 text-blue-600",
  fixed: "bg-green-500/10 text-green-600",
  closed: "bg-gray-500/10 text-gray-600",
  wont_fix: "bg-gray-500/10 text-gray-600",
};

interface BugsClientProps {
  projectId: string;
  projectName: string;
  projectSlug: string;
  workspaceSlug: string;
  workspaceId: string;
  currentMemberId: string;
}

export function BugsClient({
  projectId,
  projectName,
  projectSlug,
  workspaceSlug,
  workspaceId,
  currentMemberId,
}: BugsClientProps) {
  const { data: bugs, isLoading } = useBugs(projectId);
  const createBug = useCreateBug(projectId);
  const updateBug = useUpdateBug();

  const [selectedBugId, setSelectedBugId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("minor");
  const [priority, setPriority] = useState("medium");
  const [similarBugs, setSimilarBugs] = useState<
    { id: string; identifier: string; title: string; status: string; severity: string }[]
  >([]);

  useEffect(() => {
    if (!title.trim()) {
      setSimilarBugs([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("bugs")
          .select("id, identifier, title, status, severity")
          .eq("project_id", projectId)
          .ilike("title", `%${title.trim()}%`)
          .limit(5);

        setSimilarBugs(data ?? []);
      } catch {
        setSimilarBugs([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [title, projectId]);

  async function handleCreateBug(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createBug.mutateAsync({
        title,
        description: description || undefined,
        severity,
        priority,
        workspace_id: workspaceId,
        reporter_id: currentMemberId,
      });
      setDialogOpen(false);
      setTitle("");
      setDescription("");
      setSeverity("minor");
      setSimilarBugs([]);
      toast.success("Bug reported");
    } catch {
      toast.error("Failed to create bug");
    }
  }

  const base = `/${workspaceSlug}/projects/${projectSlug}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={base}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">{projectName}</h1>
            <p className="text-sm text-muted-foreground">Bug tracker</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
            >
              <Download className="h-4 w-4" />
              Export
              <ChevronDown className="h-3 w-3 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  if (!bugs) return;
                  const csv = [
                    ["ID", "Title", "Status", "Severity", "Priority", "Assignee"].join(","),
                    ...bugs.map((b) =>
                      [
                        b.identifier,
                        `"${b.title.replace(/"/g, '""')}"`,
                        b.status,
                        b.severity,
                        b.priority,
                        (b.assignee as { display_name: string | null } | null)
                          ?.display_name ?? "",
                      ].join(",")
                    ),
                  ].join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${projectName}-bugs.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (!bugs) return;
                  exportBugsPDF(
                    bugs.map((b) => ({
                      identifier: b.identifier,
                      title: b.title,
                      status: b.status,
                      severity: b.severity,
                      priority: b.priority,
                      assignee_name:
                        (b.assignee as { display_name: string | null } | null)
                          ?.display_name ?? undefined,
                    })),
                    projectName
                  );
                }}
              >
                Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger className="inline-flex items-center justify-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow hover:bg-destructive/90">
            <Bug className="h-4 w-4" />
            Report Bug
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Report a bug</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateBug} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief description of the bug"
                  required
                />
                {similarBugs.length > 0 && (
                  <div className="rounded-md border border-yellow-400 bg-yellow-50 p-3 text-sm dark:bg-yellow-950/30">
                    <div className="mb-1.5 flex items-center gap-1.5 font-medium text-yellow-700 dark:text-yellow-400">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Similar bugs found:
                    </div>
                    <ul className="space-y-1 text-yellow-800 dark:text-yellow-300">
                      {similarBugs.map((bug) => (
                        <li key={bug.id} className="flex items-center gap-2">
                          <span className="font-mono text-xs text-yellow-600 dark:text-yellow-500">
                            {bug.identifier}
                          </span>
                          <span className="truncate">{bug.title}</span>
                          <Badge
                            variant="secondary"
                            className={cn("ml-auto shrink-0 text-xs", statusColors[bug.status])}
                          >
                            {bug.status.replace("_", " ")}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Steps to reproduce, expected vs actual behavior..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select value={severity} onValueChange={(v) => v && setSeverity(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BUG_SEVERITIES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={(v) => v && setPriority(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["low", "medium", "high", "urgent"].map((p) => (
                        <SelectItem key={p} value={p}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createBug.isPending || !title}>
                  {createBug.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Report
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-md" />
          ))}
        </div>
      ) : bugs && bugs.length > 0 ? (
        <div className="rounded-lg border">
          <div className="grid grid-cols-[1fr_100px_100px_100px_100px] gap-2 border-b bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
            <span>Bug</span>
            <span>Severity</span>
            <span>Priority</span>
            <span>Status</span>
            <span>Assignee</span>
          </div>
          {bugs.map((bug) => {
            const assigneeName = (bug.assignee as { display_name: string | null } | null)?.display_name;
            return (
              <div
                key={bug.id}
                className="grid cursor-pointer grid-cols-[1fr_100px_100px_100px_100px] items-center gap-2 border-b px-4 py-3 text-sm last:border-0 hover:bg-muted/30"
                onClick={() => setSelectedBugId(bug.id)}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Bug className="h-3.5 w-3.5 shrink-0 text-destructive" />
                    <span className="text-xs text-muted-foreground">{bug.identifier}</span>
                    <span className="truncate font-medium">{bug.title}</span>
                  </div>
                </div>
                <Badge className={cn("text-xs", severityColors[bug.severity])}>
                  {bug.severity}
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">
                  {bug.priority}
                </Badge>
                <Badge variant="secondary" className={cn("text-xs", statusColors[bug.status])}>
                  {bug.status.replace("_", " ")}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {assigneeName ?? "--"}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Bug className="h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">No bugs reported yet.</p>
        </div>
      )}

      <BugDetailPanel
        bugId={selectedBugId}
        projectId={projectId}
        workspaceId={workspaceId}
        onClose={() => setSelectedBugId(null)}
        onDelete={() => setSelectedBugId(null)}
      />
    </div>
  );
}
