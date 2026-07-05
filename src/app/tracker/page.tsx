import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { APPLICATION_STATUSES, type Application } from "@/lib/types";
import AddApplicationForm from "./AddApplicationForm";
import ApplicationCard from "./ApplicationCard";

const COLUMN_LABELS: Record<Application["status"], string> = {
  saved: "Saved",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
};

export default async function TrackerPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("applications")
    .select("id, company, role, status, applied_at, follow_up_at, source, notes")
    .eq("user_id", user.id)
    .order("follow_up_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  const applications: Application[] = data ?? [];

  const columns = APPLICATION_STATUSES.map((status) => ({
    status,
    label: COLUMN_LABELS[status],
    items: applications.filter((app) => app.status === status),
  }));

  return (
    <div className="flex-1 bg-zinc-50 px-6 py-10 dark:bg-black">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            Application tracker
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {applications.length} application{applications.length === 1 ? "" : "s"} tracked.
          </p>
        </div>

        <AddApplicationForm />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {columns.map((col) => (
            <div key={col.status} className="space-y-3">
              <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {col.label} <span className="text-zinc-400">({col.items.length})</span>
              </h2>
              <div className="space-y-3">
                {col.items.map((app) => (
                  <ApplicationCard key={app.id} application={app} />
                ))}
                {col.items.length === 0 && (
                  <p className="text-xs text-zinc-400">None</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
