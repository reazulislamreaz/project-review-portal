import { GuestOnly } from "@/components/auth/guest-only";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <GuestOnly>
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6">
        <SignupForm />
      </main>
    </GuestOnly>
  );
}
