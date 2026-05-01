"use client";

import { useState, lazy, Suspense } from "react";
import dynamic from "next/dynamic";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { Header } from "@/components/layout/header";
import { FloatingAIButton } from "@/components/ai/floating-ai-button";

// Lazy load heavy components that are not immediately visible
const AIChatPanel = dynamic(
  () => import("@/components/ai/ai-chat-panel").then((mod) => ({ default: mod.AIChatPanel })),
  { ssr: false }
);
const CommandPalette = dynamic(
  () => import("@/components/layout/command-palette").then((mod) => ({ default: mod.CommandPalette })),
  { ssr: false }
);

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
