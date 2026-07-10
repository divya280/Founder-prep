import { isAuthError } from "@supabase/supabase-js";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  email_address_invalid:
    "Supabase rejected this email address. For local development, open Supabase Dashboard → Authentication → Providers → Email and turn off Confirm email. Also check for extra spaces in the email field.",
  email_address_not_authorized:
    "This email cannot receive auth emails on Supabase's default mail service. Add your email to your Supabase organization team, or configure custom SMTP under Authentication → SMTP Settings (Resend works well).",
  email_exists: "An account with this email already exists. Try signing in instead.",
  invalid_credentials: "Incorrect email or password.",
  email_not_confirmed:
    "Please confirm your email before signing in, or disable Confirm email in Supabase for local development.",
  signup_disabled: "New signups are disabled for this project.",
};

export function getAuthErrorMessage(error: unknown): string {
  if (isAuthError(error)) {
    if (error.code && AUTH_ERROR_MESSAGES[error.code]) {
      return AUTH_ERROR_MESSAGES[error.code];
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}
