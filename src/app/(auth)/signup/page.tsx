import { Suspense } from "react";
import { SignupForm } from "@/components/auth/signup-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Sign Up - TeamForge" };

export default function SignupPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg" />}>
      <SignupForm />
    </Suspense>
  );
}
