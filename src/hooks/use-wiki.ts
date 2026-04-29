"use client";

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/types/database";

interface WikiPage {
  id: string;
  title: string;
  icon: string | null;
  parent_page_id: string | null;
  sort_order: number | null;
  is_template: boolean | null;
  is_archived: boolean | null;
  children?: WikiPage[];
}

function buildTree(pages: WikiPage[]): WikiPage[] {
  const map = new Map<string, WikiPage>();
  const roots: WikiPage[] = [];

  for (const page of pages) {
    map.set(page.id, { ...page, children: [] });
  }

  for (const page of pages) {
    const node = map.get(page.id)!;
    if (page.parent_page_id && map.has(page.parent_page_id)) {
      map.get(page.parent_page_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortChildren = (nodes: WikiPage[]) => {
    nodes.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    nodes.forEach((n) => n.children && sortChildren(n.children));
  };
  sortChildren(roots);

  return roots;
}

export function useWikiPages(workspaceId: string, projectId?: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["wiki-pages", workspaceId, projectId],
    queryFn: async () => {
      let query = supabase
        .from("wiki_pages")
        .select("id, title, icon, parent_page_id, sort_order, is_template, is_archived")
        .eq("workspace_id", workspaceId)
        .eq("is_archived", false)
        .eq("is_template", false)
        .order("sort_order", { ascending: true });

      if (projectId) {
        query = query.eq("project_id", projectId);
      } else {
        query = query.is("project_id", null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as WikiPage[];
    },
    enabled: !!workspaceId,
  });
}

export function useWikiTree(workspaceId: string, projectId?: string | null) {
  const { data: pages, ...rest } = useWikiPages(workspaceId, projectId);
  const tree = useMemo(() => (pages ? buildTree(pages) : []), [pages]);
  return { tree, pages, ...rest };
}

export function useWikiPage(pageId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["wiki-page", pageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wiki_pages")
        .select("*, last_editor:workspace_members!wiki_pages_last_edited_by_fkey(display_name)")
        .eq("id", pageId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!pageId,
  });
}

export function useCreateWikiPage(workspaceId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (page: {
      title?: string;
      parent_page_id?: string | null;
      project_id?: string | null;
      created_by: string;
      last_edited_by: string;
      icon?: string;
      is_template?: boolean;
      content?: Json;
    }) => {
      const { data, error } = await supabase
        .from("wiki_pages")
        .insert({
          ...page,
          workspace_id: workspaceId,
          title: page.title ?? "Untitled",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wiki-pages", workspaceId] });
    },
  });
}

export function useUpdateWikiPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      memberId,
      ...updates
    }: {
      id: string;
      memberId: string;
      title?: string;
      content?: Json;
      icon?: string | null;
      cover_url?: string | null;
      parent_page_id?: string | null;
      sort_order?: number;
      is_archived?: boolean;
    }) => {
      // Save current version before update
      if (updates.content !== undefined) {
        const { data: current } = await supabase
          .from("wiki_pages")
          .select("content, title")
          .eq("id", id)
          .maybeSingle();

        if (current) {
          await supabase.from("wiki_page_versions").insert({
            page_id: id,
            content: current.content ?? [],
            title: current.title,
            edited_by: memberId,
          });
        }
      }

      const { data, error } = await supabase
        .from("wiki_pages")
        .update({ ...updates, last_edited_by: memberId })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["wiki-page", data.id] });
      queryClient.invalidateQueries({
        queryKey: ["wiki-pages", data.workspace_id],
      });
    },
  });
}

export function useDeleteWikiPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      workspaceId,
    }: {
      id: string;
      workspaceId: string;
    }) => {
      const { error } = await supabase
        .from("wiki_pages")
        .update({ is_archived: true })
        .eq("id", id);

      if (error) throw error;
      return { workspaceId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["wiki-pages", data.workspaceId],
      });
    },
  });
}

export function useWikiVersions(pageId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["wiki-versions", pageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wiki_page_versions")
        .select("*, editor:workspace_members!wiki_page_versions_edited_by_fkey(display_name)")
        .eq("page_id", pageId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!pageId,
  });
}

export function useWikiTemplates(workspaceId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["wiki-templates", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wiki_pages")
        .select("id, title, icon, content")
        .eq("workspace_id", workspaceId)
        .eq("is_template", true)
        .eq("is_archived", false)
        .order("title", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });
}
