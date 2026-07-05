import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, plan, free_tailors_used")
    .eq("id", user.id)
    .single();

  const { data: masterProfile } = await supabase
    .from("master_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { count: documentCount } = await supabase
    .from("tailored_documents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: applicationCount } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const displayName = profile?.full_name || user.email;

  return (
    <div className="flex-1 bg-zinc-50 px-6 py-10 dark:bg-black">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
              Welcome, {displayName}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Plan: {profile?.plan ?? "free"} · Tailored CVs used:{" "}
              {profile?.free_tailors_used ?? 0}
            </p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
            >
              Log out
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Tailored documents</p>
            <p className="text-2xl font-semibold text-black dark:text-zinc-50">
              {documentCount ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Applications tracked</p>
            <p className="text-2xl font-semibold text-black dark:text-zinc-50">
              {applicationCount ?? 0}
            </p>
            <Link
              href="/tracker"
              className="mt-3 inline-block text-sm font-medium text-zinc-950 dark:text-zinc-50"
            >
              Open tracker →
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {masterProfile
              ? "Your master profile is set up."
              : "Set up your master profile before tailoring a CV."}
          </p>
          <Link
            href="/onboarding"
            className="mt-3 inline-block rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            {masterProfile ? "Edit master profile" : "Build master profile"}
          </Link>
        </div>

        <p className="text-sm text-zinc-500">JD tailoring is coming next.</p>
      </div>
    </div>
  );
}
