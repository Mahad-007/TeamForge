import { Suspense } from "react";
import { VerifyEmailNotice } from "@/components/auth/verify-email-notice";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Verify Email - TeamForge" };

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<Skeleton className="h-48 w-full rounded-lg" />}>
      <VerifyEmailNotice />
    </Suspense>
  );
}
