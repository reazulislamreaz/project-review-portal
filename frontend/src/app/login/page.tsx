import { GuestOnly } from "@/components/auth/guest-only";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <GuestOnly>
      <main className="flex min-h-screen items-center justify-center px-4 py-12">
        <LoginForm />
      </main>
    </GuestOnly>
  );
}
