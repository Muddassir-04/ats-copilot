"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/types";

export type ApplicationState = { error?: string } | undefined;

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, userId: user.id };
}

function isValidStatus(value: string): value is ApplicationStatus {
  return (APPLICATION_STATUSES as string[]).includes(value);
}

export async function createApplication(
  _prevState: ApplicationState,
  formData: FormData
): Promise<ApplicationState> {
  const { supabase, userId } = await requireUserId();

  const company = String(formData.get("company") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "saved");
  const source = String(formData.get("source") ?? "").trim() || null;
  const followUpAt = String(formData.get("follow_up_at") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!company || !role) {
    return { error: "Company and role are required." };
  }
  if (!isValidStatus(statusRaw)) {
    return { error: "Invalid status." };
  }

  const { error } = await supabase.from("applications").insert({
    user_id: userId,
    company,
    role,
    status: statusRaw,
    source,
    follow_up_at: followUpAt,
    notes,
    applied_at: statusRaw === "applied" ? new Date().toISOString().slice(0, 10) : null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/tracker");
}

export async function updateApplicationStatus(formData: FormData): Promise<void> {
  const { supabase, userId } = await requireUserId();

  const id = String(formData.get("id") ?? "");
  const statusRaw = String(formData.get("status") ?? "");

  if (!id || !isValidStatus(statusRaw)) {
    return;
  }

  const patch: Record<string, unknown> = { status: statusRaw };
  if (statusRaw === "applied") {
    patch.applied_at = new Date().toISOString().slice(0, 10);
  }

  await supabase.from("applications").update(patch).eq("id", id).eq("user_id", userId);

  revalidatePath("/tracker");
}

export async function updateApplicationDetails(formData: FormData): Promise<void> {
  const { supabase, userId } = await requireUserId();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const followUpAt = String(formData.get("follow_up_at") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  await supabase
    .from("applications")
    .update({ follow_up_at: followUpAt, notes })
    .eq("id", id)
    .eq("user_id", userId);

  revalidatePath("/tracker");
}

export async function deleteApplication(formData: FormData): Promise<void> {
  const { supabase, userId } = await requireUserId();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabase.from("applications").delete().eq("id", id).eq("user_id", userId);

  revalidatePath("/tracker");
}
