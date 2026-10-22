import { GuestOnly } from "@/components/auth/guest-only";
import { SignupForm } from "@/components/auth/signup-form";
import { AuthShell } from "@/components/layout/auth-shell";

export default function SignupPage() {
  return (
    <GuestOnly>
      <AuthShell>
        <SignupForm />
      </AuthShell>
    </GuestOnly>
  );
}
