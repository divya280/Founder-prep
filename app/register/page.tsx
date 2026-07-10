"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  AuthErrorBanner,
  AuthField,
  AuthForm,
  AuthSubmitButton,
} from "@/components/auth/AuthForm";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/client";
import { registerSchema } from "@/lib/validations/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");
    setFieldErrors({});

    const parsed = registerSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    });

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
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { name: parsed.data.name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setFormError(getAuthErrorMessage(error));
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setSuccessMessage(
      "Account created. Check your email to confirm your address, then sign in.",
    );
    setLoading(false);
  }

  return (
    <AuthForm
      title="Create your account"
      subtitle="Start building your compliance roadmap"
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerHref="/login"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError ? <AuthErrorBanner message={formError} /> : null}
        {successMessage ? (
          <div className="rounded border border-[#427a5b]/30 bg-[#427a5b]/10 px-3 py-2 text-sm text-[#356549]">
            {successMessage}
          </div>
        ) : null}

        <AuthField
          id="name"
          label="Full name"
          value={name}
          onChange={setName}
          error={fieldErrors.name}
          autoComplete="name"
        />

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
          autoComplete="new-password"
        />

        <AuthField
          id="confirmPassword"
          label="Confirm password"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          error={fieldErrors.confirmPassword}
          autoComplete="new-password"
        />

        <AuthSubmitButton label="Create account" loading={loading} />
      </form>
    </AuthForm>
  );
}
