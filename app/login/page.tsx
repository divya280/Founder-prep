import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f7f8f3] text-[#526057]">
          Loading...
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
