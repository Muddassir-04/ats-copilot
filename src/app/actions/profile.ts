"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Certification, Education, Experience, SkillGroup } from "@/lib/types";

export type ProfileState = { error?: string } | undefined;

function parseJsonField<T>(formData: FormData, key: string, fallback: T): T {
  const raw = formData.get(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(String(raw)) as T;
  } catch {
    return fallback;
  }
}

export async function saveMasterProfile(
  _prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const full_name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const headline = String(formData.get("headline") ?? "").trim();

  if (!full_name || !email || !headline) {
    return { error: "Full name, email, and headline are required." };
  }

  const phone = String(formData.get("phone") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim() || null;
  const linkedin_url = String(formData.get("linkedin_url") ?? "").trim() || null;
  const summary = String(formData.get("summary") ?? "").trim() || null;
  const nationality = String(formData.get("nationality") ?? "").trim() || null;
  const visa_status = String(formData.get("visa_status") ?? "").trim() || null;
  const availability = String(formData.get("availability") ?? "").trim() || null;

  const experiences = parseJsonField<Experience[]>(formData, "experiences", []);
  const education = parseJsonField<Education[]>(formData, "education", []);
  const skills = parseJsonField<SkillGroup[]>(formData, "skills", []);
  const certifications = parseJsonField<Certification[]>(formData, "certifications", []);
  const languages = parseJsonField<string[]>(formData, "languages", []);

  const { error } = await supabase.from("master_profiles").upsert(
    {
      user_id: user.id,
      full_name,
      email,
      phone,
      location,
      linkedin_url,
      headline,
      summary,
      nationality,
      visa_status,
      availability,
      experiences,
      education,
      skills,
      certifications,
      languages,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}
