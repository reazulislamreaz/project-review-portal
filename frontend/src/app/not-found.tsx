import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-8 px-4 py-16 sm:px-6">
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Page not found
        </h1>
        <p className="text-base leading-relaxed text-subtle">
          This page is not part of the Project Submission Dashboard. Check the URL, or
          return home to submit or review projects.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/" className={cn(buttonVariants(), "sm:flex-1")}>
          Go home
        </Link>
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: "outline" }), "sm:flex-1")}
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
