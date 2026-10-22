import { GuestOnly } from "@/components/auth/guest-only";
import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/layout/auth-shell";

export default function LoginPage() {
  return (
    <GuestOnly>
      <AuthShell>
        <LoginForm />
      </AuthShell>
    </GuestOnly>
  );
}
