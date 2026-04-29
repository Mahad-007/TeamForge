"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar workspaceSlug={workspaceSlug} workspaceName={workspaceName} />
      <div className="flex w-full flex-1 flex-col overflow-hidden">
        <Header
          userDisplayName={userDisplayName}
          userAvatarUrl={userAvatarUrl}
          userEmail={userEmail}
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {/* Mobile sidebar */}
      <MobileSidebar
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        workspaceSlug={workspaceSlug}
        workspaceName={workspaceName}
      />

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
