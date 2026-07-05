import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { emptyMasterProfile, type MasterProfile } from "@/lib/types";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("master_profiles")
    .select(
      "full_name, email, phone, location, linkedin_url, headline, summary, nationality, visa_status, availability, experiences, education, skills, certifications, languages"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const initial: MasterProfile = profile
    ? {
        full_name: profile.full_name ?? "",
        email: profile.email ?? user.email ?? "",
        phone: profile.phone ?? "",
        location: profile.location ?? "",
        linkedin_url: profile.linkedin_url ?? "",
        headline: profile.headline ?? "",
        summary: profile.summary ?? "",
        nationality: profile.nationality ?? "",
        visa_status: profile.visa_status ?? "",
        availability: profile.availability ?? "",
        experiences: profile.experiences ?? [],
        education: profile.education ?? [],
        skills: profile.skills ?? [],
        certifications: profile.certifications ?? [],
        languages: profile.languages ?? [],
      }
    : { ...emptyMasterProfile, email: user.email ?? "" };

  return (
    <div className="flex-1 bg-zinc-50 px-6 py-10 dark:bg-black">
      <div className="mx-auto max-w-2xl space-y-2 pb-4">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          Build your master profile
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Enter this once. Every tailored CV and cover letter is generated from it — never
          invented beyond what you put here.
        </p>
      </div>
      <div className="mx-auto max-w-2xl">
        <OnboardingForm initial={initial} />
      </div>
    </div>
  );
}
