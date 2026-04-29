"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { AIChatPanel } from "@/components/ai/ai-chat-panel";
import { FloatingAIButton } from "@/components/ai/floating-ai-button";
import { CommandPalette } from "@/components/layout/command-palette";

interface AppShellProps {
  workspaceSlug: string;
  workspaceName: string;
  workspaceId: string;
  userDisplayName: string;
  userAvatarUrl: string | null;
  userEmail: string;
  children: React.ReactNode;
}

export function AppShell({
  workspaceSlug,
  workspaceName,
  workspaceId,
  userDisplayName,
  userAvatarUrl,
  userEmail,
  children,
}: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar workspaceSlug={workspaceSlug} workspaceName={workspaceName} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          userDisplayName={userDisplayName}
          userAvatarUrl={userAvatarUrl}
          userEmail={userEmail}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {/* Global overlays */}
      <CommandPalette workspaceSlug={workspaceSlug} workspaceId={workspaceId} />
      <FloatingAIButton />
      <AIChatPanel
        workspaceId={workspaceId}
        workspaceName={workspaceName}
        userName={userDisplayName}
      />
    </div>
  );
}
