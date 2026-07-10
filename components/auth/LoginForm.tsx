"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  AuthErrorBanner,
  AuthField,
  AuthForm,
  AuthSubmitButton,
} from "@/components/auth/AuthForm";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validations/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authError = searchParams.get("error") === "auth";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState(
    authError ? "Authentication failed. Please try again." : "",
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setFieldErrors({});

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0];
        if (typeof key === "string") {
          errors[key] = issue.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      setFormError(getAuthErrorMessage(error));
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthForm
      title="Welcome back"
      subtitle="Sign in to your FounderPrep account"
      footerText="New here?"
      footerLinkText="Create an account"
      footerHref="/register"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError ? <AuthErrorBanner message={formError} /> : null}

        <AuthField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          error={fieldErrors.email}
          autoComplete="email"
        />

        <AuthField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          error={fieldErrors.password}
          autoComplete="current-password"
        />

        <AuthSubmitButton label="Sign in" loading={loading} />
      </form>
    </AuthForm>
  );
}
