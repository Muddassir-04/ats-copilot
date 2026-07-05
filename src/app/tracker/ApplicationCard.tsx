"use client";

import { useState } from "react";
import {
  deleteApplication,
  updateApplicationDetails,
  updateApplicationStatus,
} from "@/app/actions/applications";
import { APPLICATION_STATUSES, type Application } from "@/lib/types";

function isOverdue(app: Application): boolean {
  if (!app.follow_up_at) return false;
  if (app.status === "offer" || app.status === "rejected") return false;
  return app.follow_up_at < new Date().toISOString().slice(0, 10);
}

export default function ApplicationCard({ application }: { application: Application }) {
  const [editing, setEditing] = useState(false);
  const overdue = isOverdue(application);

  return (
    <div className="space-y-2 rounded-lg border border-black/10 bg-white p-3 text-sm dark:border-white/10 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-black dark:text-zinc-50">{application.role}</p>
          <p className="text-zinc-600 dark:text-zinc-400">{application.company}</p>
        </div>
        <form action={deleteApplication}>
          <input type="hidden" name="id" value={application.id} />
          <button type="submit" className="text-xs text-red-600 dark:text-red-400">
            Delete
          </button>
        </form>
      </div>

      <form action={updateApplicationStatus}>
        <input type="hidden" name="id" value={application.id} />
        <select
          name="status"
          defaultValue={application.status}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="w-full rounded-md border border-black/10 bg-transparent px-2 py-1 text-xs outline-none dark:border-white/10"
        >
          {APPLICATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status[0].toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </form>

      {application.follow_up_at && (
        <p className={overdue ? "text-xs font-medium text-red-600 dark:text-red-400" : "text-xs text-zinc-500"}>
          Follow up: {application.follow_up_at} {overdue && "(overdue)"}
        </p>
      )}
      {application.source && (
        <p className="text-xs text-zinc-500">Source: {application.source}</p>
      )}
      {application.notes && !editing && (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">{application.notes}</p>
      )}

      {editing ? (
        <form
          action={async (formData) => {
            await updateApplicationDetails(formData);
            setEditing(false);
          }}
          className="space-y-2"
        >
          <input type="hidden" name="id" value={application.id} />
          <input
            type="date"
            name="follow_up_at"
            defaultValue={application.follow_up_at ?? ""}
            className="w-full rounded-md border border-black/10 bg-transparent px-2 py-1 text-xs outline-none dark:border-white/10"
          />
          <textarea
            name="notes"
            defaultValue={application.notes ?? ""}
            rows={2}
            className="w-full rounded-md border border-black/10 bg-transparent px-2 py-1 text-xs outline-none dark:border-white/10"
          />
          <div className="flex gap-2">
            <button type="submit" className="text-xs font-medium text-zinc-950 dark:text-zinc-50">
              Save
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-xs text-zinc-500">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs font-medium text-zinc-950 dark:text-zinc-50"
        >
          Edit follow-up / notes
        </button>
      )}
    </div>
  );
}
