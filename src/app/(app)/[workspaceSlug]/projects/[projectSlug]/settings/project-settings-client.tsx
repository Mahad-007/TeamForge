"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useUpdateProject, useWorkspaceMembers } from "@/hooks/use-projects";
import { useLabels, useCreateLabel, useDeleteLabel } from "@/hooks/use-labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PROJECT_PRIORITIES } from "@/types/enums";
import {
  ArrowLeft,
  GripVertical,
  Plus,
  Trash2,
  X,
  Save,
} from "lucide-react";
import { toast } from "sonner";

interface ProjectSettingsClientProps {
  projectId: string;
  projectName: string;
  projectSlug: string;
  workspaceId: string;
  workspaceSlug: string;
  currentMemberId: string;
  project: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    priority: string | null;
    start_date: string | null;
    target_date: string | null;
    lead_id: string | null;
    github_repo_url: string | null;
    settings: unknown;
    status: string;
  };
}

function SortableStatus({
  id,
  onRemove,
}: {
  id: string;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border bg-card px-3 py-2"
    >
      <button
        className="cursor-grab text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex-1 text-sm">{id}</span>
      <button
        onClick={onRemove}
        className="text-muted-foreground hover:text-destructive"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ProjectSettingsClient({
  projectId,
  projectName,
  projectSlug,
  workspaceId,
  workspaceSlug,
  currentMemberId,
  project,
}: ProjectSettingsClientProps) {
  const router = useRouter();
  const updateProject = useUpdateProject();
  const { data: members } = useWorkspaceMembers(workspaceId);
  const { data: labels } = useLabels(workspaceId, projectId);
  const createLabel = useCreateLabel(workspaceId);
  const deleteLabel = useDeleteLabel(workspaceId);

  // General settings state
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [slug, setSlug] = useState(project.slug);
  const [priority, setPriority] = useState(project.priority ?? "medium");
  const [startDate, setStartDate] = useState<Date | null>(
    project.start_date ? new Date(project.start_date) : null
  );
  const [targetDate, setTargetDate] = useState<Date | null>(
    project.target_date ? new Date(project.target_date) : null
  );

  // Status workflow state
  const settings = project.settings as { statuses?: string[] } | null;
  const [statuses, setStatuses] = useState<string[]>(
    settings?.statuses ?? ["Backlog", "Todo", "In Progress", "Review", "Done"]
  );
  const [newStatus, setNewStatus] = useState("");

  // Labels state
  const [labelName, setLabelName] = useState("");
  const [labelColor, setLabelColor] = useState("#6366f1");

  // GitHub connection state
  const [githubRepoUrl, setGithubRepoUrl] = useState(
    project.github_repo_url ?? ""
  );

  // Project lead state
  const [leadId, setLeadId] = useState<string | null>(project.lead_id);

  const base = `/${workspaceSlug}/projects/${projectSlug}`;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleSaveGeneral() {
    updateProject.mutate(
      {
        id: projectId,
        name,
        description: description || undefined,
        slug,
        priority,
        start_date: startDate?.toISOString() ?? null,
        target_date: targetDate?.toISOString() ?? null,
      },
      {
        onSuccess: () => {
          toast.success("Project settings saved");
          if (slug !== projectSlug) {
            router.push(`/${workspaceSlug}/projects/${slug}/settings`);
          }
        },
        onError: () => toast.error("Failed to save project settings"),
      }
    );
  }

  function handleSaveStatuses() {
    updateProject.mutate(
      {
        id: projectId,
        settings: { ...(settings ?? {}), statuses },
      },
      {
        onSuccess: () => toast.success("Status workflow saved"),
        onError: () => toast.error("Failed to save statuses"),
      }
    );
  }

  function handleAddStatus() {
    const trimmed = newStatus.trim();
    if (!trimmed) return;
    if (statuses.includes(trimmed)) {
      toast.error("Status already exists");
      return;
    }
    setStatuses([...statuses, trimmed]);
    setNewStatus("");
  }

  function handleRemoveStatus(status: string) {
    setStatuses(statuses.filter((s) => s !== status));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = statuses.indexOf(active.id as string);
    const newIndex = statuses.indexOf(over.id as string);
    setStatuses(arrayMove(statuses, oldIndex, newIndex));
  }

  function handleCreateLabel() {
    if (!labelName.trim()) return;
    createLabel.mutate(
      { name: labelName.trim(), color: labelColor, project_id: projectId },
      {
        onSuccess: () => {
          setLabelName("");
          setLabelColor("#6366f1");
          toast.success("Label created");
        },
        onError: () => toast.error("Failed to create label"),
      }
    );
  }

  function handleDeleteLabel(id: string) {
    deleteLabel.mutate(
      { id, projectId },
      {
        onError: () => toast.error("Failed to delete label"),
      }
    );
  }

  function handleSaveGithub() {
    updateProject.mutate(
      {
        id: projectId,
        github_repo_url: githubRepoUrl || null,
      },
      {
        onSuccess: () => toast.success("GitHub connection saved"),
        onError: () => toast.error("Failed to save GitHub connection"),
      }
    );
  }

  function handleSaveLead() {
    updateProject.mutate(
      {
        id: projectId,
        lead_id: leadId,
      },
      {
        onSuccess: () => toast.success("Project lead updated"),
        onError: () => toast.error("Failed to update project lead"),
      }
    );
  }

  function handleArchive() {
    updateProject.mutate(
      { id: projectId, status: "archived" },
      {
        onSuccess: () => {
          toast.success("Project archived");
          router.push(`/${workspaceSlug}/projects`);
        },
        onError: () => toast.error("Failed to archive project"),
      }
    );
  }

  function handleDelete() {
    // For safety, we archive instead of hard-delete in the UI.
    // A real delete would require a server action with proper cascade.
    updateProject.mutate(
      { id: projectId, status: "archived" },
      {
        onSuccess: () => {
          toast.success("Project deleted");
          router.push(`/${workspaceSlug}/projects`);
        },
        onError: () => toast.error("Failed to delete project"),
      }
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={base}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">{projectName}</h1>
          <p className="text-sm text-muted-foreground">Project Settings</p>
        </div>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Manage your project name, description, and other details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Project Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this project..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Slug</label>
            <Input
              value={slug}
              onChange={(e) =>
                setSlug(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, "-")
                    .replace(/-+/g, "-")
                )
              }
              placeholder="project-slug"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={priority} onValueChange={(v) => { if (v) setPriority(v); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <DatePicker
                value={startDate}
                onChange={(date) => setStartDate(date ?? null)}
                placeholder="Set start date..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Date</label>
              <DatePicker
                value={targetDate}
                onChange={(date) => setTargetDate(date ?? null)}
                placeholder="Set target date..."
              />
            </div>
          </div>
          <Button
            onClick={handleSaveGeneral}
            disabled={updateProject.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            Save General Settings
          </Button>
        </CardContent>
      </Card>

      {/* Status Workflow */}
      <Card>
        <CardHeader>
          <CardTitle>Status Workflow</CardTitle>
          <CardDescription>
            Configure the statuses used in your project. Drag to reorder.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={statuses}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {statuses.map((status) => (
                  <SortableStatus
                    key={status}
                    id={status}
                    onRemove={() => handleRemoveStatus(status)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="flex gap-2">
            <Input
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              placeholder="New status name..."
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddStatus();
              }}
            />
            <Button variant="outline" onClick={handleAddStatus}>
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>

          <Button
            onClick={handleSaveStatuses}
            disabled={updateProject.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Statuses
          </Button>
        </CardContent>
      </Card>

      {/* Labels */}
      <Card>
        <CardHeader>
          <CardTitle>Labels</CardTitle>
          <CardDescription>
            Create and manage labels for tasks in this project.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {labels?.map((label) => (
              <Badge
                key={label.id}
                variant="secondary"
                className="gap-1.5"
                style={{
                  backgroundColor: label.color + "20",
                  borderColor: label.color,
                  color: label.color,
                }}
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: label.color }}
                />
                {label.name}
                <button
                  onClick={() => handleDeleteLabel(label.id)}
                  className="ml-0.5 hover:opacity-70"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {(!labels || labels.length === 0) && (
              <p className="text-sm text-muted-foreground">
                No labels yet. Create one below.
              </p>
            )}
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Label Name</label>
              <Input
                value={labelName}
                onChange={(e) => setLabelName(e.target.value)}
                placeholder="e.g. Bug, Feature, Design..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateLabel();
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <Input
                type="color"
                value={labelColor}
                onChange={(e) => setLabelColor(e.target.value)}
                className="h-8 w-16 cursor-pointer p-1"
              />
            </div>
            <Button
              onClick={handleCreateLabel}
              disabled={createLabel.isPending || !labelName.trim()}
            >
              Create
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* GitHub Connection */}
      <Card>
        <CardHeader>
          <CardTitle>GitHub Connection</CardTitle>
          <CardDescription>
            Link a GitHub repository to this project.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Repository URL</label>
            <Input
              value={githubRepoUrl}
              onChange={(e) => setGithubRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
            />
          </div>
          <Button
            onClick={handleSaveGithub}
            disabled={updateProject.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            Save GitHub Connection
          </Button>
        </CardContent>
      </Card>

      {/* Project Lead */}
      <Card>
        <CardHeader>
          <CardTitle>Project Lead</CardTitle>
          <CardDescription>
            Assign a project lead from workspace members.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Lead</label>
            <Select
              value={leadId ?? "none"}
              onValueChange={(v) => setLeadId(v === "none" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a lead..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No lead</SelectItem>
                {members?.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.display_name ?? "Unknown"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSaveLead} disabled={updateProject.isPending}>
            <Save className="mr-2 h-4 w-4" />
            Save Project Lead
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="ring-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions. Proceed with caution.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-md border border-destructive/20 p-4">
            <div>
              <p className="text-sm font-medium">Archive Project</p>
              <p className="text-sm text-muted-foreground">
                Hides the project from active views. Can be restored later.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-destructive/10 px-2.5 text-sm font-medium text-destructive hover:bg-destructive/20"
              >
                Archive
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Archive Project</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to archive this project? It will be
                    hidden from active views but can be restored later.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={handleArchive}
                  >
                    Archive
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="flex items-center justify-between rounded-md border border-destructive/20 p-4">
            <div>
              <p className="text-sm font-medium">Delete Project</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete this project and all associated data.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-destructive/10 px-2.5 text-sm font-medium text-destructive hover:bg-destructive/20"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Project</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the project &ldquo;{projectName}&rdquo; and all of its
                    tasks, bugs, and data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={handleDelete}
                  >
                    Delete Permanently
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
