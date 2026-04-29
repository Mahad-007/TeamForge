import { NextResponse } from "next/server";
import { APIError } from "./auth";

export function apiSuccess<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ data, ...(meta && { meta }) }, { status: 200 });
}

export function apiCreated<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

export function apiNoContent() {
  return new NextResponse(null, { status: 204 });
}

export function apiError(
  code: string,
  message: string,
  status: number,
  details?: Record<string, string[]>
) {
  return NextResponse.json(
    { error: { code, message, ...(details && { details }) } },
    { status }
  );
}

export function handleAPIError(error: unknown) {
  if (error instanceof APIError) {
    return apiError(error.code, error.message, error.status, error.details);
  }

  console.error("Unhandled API error:", error);
  return apiError(
    "INTERNAL_ERROR",
    "An unexpected error occurred",
    500
  );
}
