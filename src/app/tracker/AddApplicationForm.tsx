"use client";

import { useActionState } from "react";
import { createApplication, type ApplicationState } from "@/app/actions/applications";
import { APPLICATION_STATUSES } from "@/lib/types";

const inputClass =
  "w-full rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/10 dark:focus:border-white/30";
const labelClass = "text-sm font-medium text-zinc-900 dark:text-zinc-100";

export default function AddApplicationForm() {
  const [state, formAction, pending] = useActionState<ApplicationState, FormData>(
    createApplication,
    undefined
  );

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950"
    >
      <h2 className="text-lg font-semibold text-black dark:text-zinc-50">Add application</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className={labelClass}>Company</label>
          <input name="company" required className={inputClass} />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Role</label>
          <input name="role" required className={inputClass} />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Status</label>
          <select name="status" defaultValue="saved" className={inputClass}>
            {APPLICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status[0].toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Source</label>
          <input name="source" placeholder="LinkedIn, referral, ..." className={inputClass} />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Follow-up date</label>
          <input type="date" name="follow_up_at" className={inputClass} />
        </div>
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Notes</label>
        <textarea name="notes" rows={2} className={inputClass} />
      </div>

      {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
      >
        {pending ? "Adding..." : "Add application"}
      </button>
    </form>
  );
}
