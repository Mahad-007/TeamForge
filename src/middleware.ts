import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/verify-email",
  "/invite",
  "/api/v1",
  "/api/auth/callback",
  "/api/cron",
  "/api/api-keys",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths through without auth check
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Refresh session and get user
  const { user, supabaseResponse, supabase } = await updateSession(request);

  // No valid session — redirect to login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Root path — redirect to workspace dashboard or onboarding
  if (pathname === "/") {
    const { data: memberships } = await supabase
      .from("workspace_members")
      .select("workspace:workspaces(slug)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1);

    const url = request.nextUrl.clone();
    if (memberships && memberships.length > 0) {
      const workspace = memberships[0].workspace as unknown as { slug: string };
      url.pathname = `/${workspace.slug}/dashboard`;
    } else {
      url.pathname = "/onboarding";
    }
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
