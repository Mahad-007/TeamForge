"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useUpdateBug } from "@/hooks/use-bugs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { BUG_SEVERITIES, BUG_STATUSES } from "@/types/enums";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

const severityColors: Record<string, string> = {
  blocker: "bg-red-600 text-white",
  critical: "bg-red-500 text-white",
  major: "bg-orange-500 text-white",
  minor: "bg-amber-500 text-black",
  cosmetic: "bg-gray-400 text-white",
};

interface BugDetailPanelProps {
  bugId: string | null;
  projectId: string;
  workspaceId: string;
  onClose: () => void;
  onDelete?: () => void;
}

export function BugDetailPanel({
  bugId,
  projectId,
  workspaceId,
  onClose,
  onDelete,
}: BugDetailPanelProps) {
  const supabase = createClient();
  const updateBug = useUpdateBug();

  const { data: bug } = useQuery({
    queryKey: ["bug-detail", bugId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bugs")
        .select(
          "*, assignee:workspace_members!bugs_assignee_id_fkey(id, display_name), reporter:workspace_members!bugs_reporter_id_fkey(id, display_name)"
        )
        .eq("id", bugId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!bugId,
  });

  const { data: members } = useQuery({
    queryKey: ["workspace-members-select", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspace_members")
        .select("id, display_name")
        .eq("workspace_id", workspaceId)
        .eq("status", "active");
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });

  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [description, setDescription] = useState("");
  const [editingEnv, setEditingEnv] = useState(false);
  const [environment, setEnvironment] = useState("");

  if (!bug) return null;

  function handleFieldUpdate(field: string, value: unknown) {
    const resolved = field === "status" && (value === "fixed" || value === "closed")
      ? { [field]: value, resolved_at: new Date().toISOString() }
      : { [field]: value };
    updateBug.mutate(
      { id: bug!.id, ...resolved },
      { onError: () => toast.error(`Failed to update ${field}`) }
    );
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this bug?")) return;
    const { error } = await supabase.from("bugs").delete().eq("id", bug!.id);
    if (error) {
      toast.error("Failed to delete bug");
      return;
    }
    toast.success("Bug deleted");
    onDelete?.();
    onClose();
  }

  const assigneeName = (bug.assignee as { display_name: string | null } | null)?.display_name;
  const reporterName = (bug.reporter as { display_name: string | null } | null)?.display_name;

  return (
    <Sheet open={!!bugId} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground">{bug.identifier}</p>
            <Badge className={severityColors[bug.severity]}>{bug.severity}</Badge>
          </div>
          {editingTitle ? (
            <Input
              value={title || bug.title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                if (title && title !== bug.title) handleFieldUpdate("title", title);
                setEditingTitle(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (title && title !== bug.title) handleFieldUpdate("title", title);
                  setEditingTitle(false);
                }
              }}
              autoFocus
              className="text-lg font-semibold"
            />
          ) : (
            <SheetTitle
              className="cursor-pointer text-lg hover:text-primary"
              onClick={() => { setTitle(bug.title); setEditingTitle(true); }}
            >
              {bug.title}
            </SheetTitle>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={bug.status} onValueChange={(v) => handleFieldUpdate("status", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BUG_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Severity</label>
              <Select value={bug.severity} onValueChange={(v) => handleFieldUpdate("severity", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BUG_SEVERITIES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Priority</label>
              <Select value={bug.priority} onValueChange={(v) => handleFieldUpdate("priority", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["low", "medium", "high", "urgent"].map((p) => (
                    <SelectItem key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Assignee</label>
              <Select
                value={bug.assignee_id ?? "unassigned"}
                onValueChange={(v) => handleFieldUpdate("assignee_id", v === "unassigned" ? null : v)}
              >
                <SelectTrigger className="mt-1">
                  {bug.assignee_id
                    ? members?.find((m) => m.id === bug.assignee_id)?.display_name ?? "Unknown"
                    : "Unassigned"}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {members?.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.display_name ?? "Unknown"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div>
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            {editingDesc ? (
              <Textarea
                value={description || bug.description || ""}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => {
                  const newDesc = description || "";
                  if (newDesc !== (bug.description || "")) handleFieldUpdate("description", newDesc || null);
                  setEditingDesc(false);
                }}
                autoFocus rows={6} className="mt-1"
              />
            ) : (
              <div
                className="mt-1 min-h-[80px] cursor-pointer rounded-md border p-3 text-sm hover:border-primary whitespace-pre-wrap"
                onClick={() => { setDescription(bug.description || ""); setEditingDesc(true); }}
              >
                {bug.description || <span className="text-muted-foreground">Click to add description...</span>}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Environment</label>
            {editingEnv ? (
              <Input
                value={environment || bug.environment || ""}
                onChange={(e) => setEnvironment(e.target.value)}
                onBlur={() => {
                  const newEnv = environment || "";
                  if (newEnv !== (bug.environment || "")) handleFieldUpdate("environment", newEnv || null);
                  setEditingEnv(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const newEnv = environment || "";
                    if (newEnv !== (bug.environment || "")) handleFieldUpdate("environment", newEnv || null);
                    setEditingEnv(false);
                  }
                }}
                autoFocus className="mt-1"
                placeholder="e.g., Chrome 120 / macOS"
              />
            ) : (
              <div
                className="mt-1 cursor-pointer rounded-md border p-2 text-sm hover:border-primary"
                onClick={() => { setEnvironment(bug.environment || ""); setEditingEnv(true); }}
              >
                {bug.environment || <span className="text-muted-foreground">Click to add environment...</span>}
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2 text-xs text-muted-foreground">
            <p>Reporter: {reporterName ?? "Unknown"}</p>
            <p>Created: {new Date(bug.created_at!).toLocaleString()}</p>
            {bug.resolved_at && <p>Resolved: {new Date(bug.resolved_at).toLocaleString()}</p>}
          </div>

          <Separator />

          <Button variant="destructive" size="sm" onClick={handleDelete} className="w-full">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete bug
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
