"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateWorkspaceForm } from "@/components/workspace/create-workspace-form";
import { JoinWorkspaceForm } from "@/components/workspace/join-workspace-form";
import { Building2, UserPlus } from "lucide-react";

export function OnboardingClient() {
  const [tab, setTab] = useState("create");

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Welcome to TeamForge</h1>
          <p className="mt-2 text-muted-foreground">
            Create a workspace for your team or join an existing one.
          </p>
        </div>

        <Card>
          <CardHeader>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="create" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  Create
                </TabsTrigger>
                <TabsTrigger value="join" className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Join
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {tab === "create" ? (
              <>
                <CardTitle className="mb-1 text-lg">
                  Create a workspace
                </CardTitle>
                <CardDescription className="mb-4">
                  Set up a new workspace for your team.
                </CardDescription>
                <CreateWorkspaceForm />
              </>
            ) : (
              <>
                <CardTitle className="mb-1 text-lg">
                  Join a workspace
                </CardTitle>
                <CardDescription className="mb-4">
                  Enter an invite code to join an existing workspace.
                </CardDescription>
                <JoinWorkspaceForm />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
