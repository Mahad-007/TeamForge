export interface PaginationConfig {
  limit: number;
  cursor?: string;
  sort: string;
  order: "asc" | "desc";
}

export function parsePagination(
  searchParams: URLSearchParams,
  defaults?: { sort?: string; limit?: number }
): PaginationConfig {
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") ?? String(defaults?.limit ?? 50), 10), 1),
    100
  );
  const cursor = searchParams.get("cursor") ?? undefined;
  const sort = searchParams.get("sort") ?? defaults?.sort ?? "created_at";
  const order = (searchParams.get("order") ?? "desc") as "asc" | "desc";

  return { limit, cursor, sort, order };
}
