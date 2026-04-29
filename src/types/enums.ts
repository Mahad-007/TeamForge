export const PROJECT_STATUSES = [
  "planning",
  "active",
  "paused",
  "completed",
  "archived",
] as const;

export const PROJECT_PRIORITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export const TASK_PRIORITIES = [
  "none",
  "low",
  "medium",
  "high",
  "urgent",
] as const;

export const TASK_TYPES = ["epic", "story", "task", "subtask"] as const;

export const BUG_STATUSES = [
  "open",
  "confirmed",
  "in_progress",
  "fixed",
  "closed",
  "wont_fix",
] as const;

export const BUG_SEVERITIES = [
  "cosmetic",
  "minor",
  "major",
  "critical",
  "blocker",
] as const;

export const CHANNEL_TYPES = ["public", "private", "dm", "project"] as const;

export const MEMBER_STATUSES = ["active", "deactivated", "invited"] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type ProjectPriority = (typeof PROJECT_PRIORITIES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type TaskType = (typeof TASK_TYPES)[number];
export type BugStatus = (typeof BUG_STATUSES)[number];
export type BugSeverity = (typeof BUG_SEVERITIES)[number];
export type ChannelType = (typeof CHANNEL_TYPES)[number];
export type MemberStatus = (typeof MEMBER_STATUSES)[number];
