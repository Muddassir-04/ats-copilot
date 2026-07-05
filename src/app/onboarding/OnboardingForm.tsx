"use client";

import { useActionState, useState } from "react";
import { saveMasterProfile, type ProfileState } from "@/app/actions/profile";
import type { Certification, Education, Experience, MasterProfile, SkillGroup } from "@/lib/types";

type EditableExperience = Omit<Experience, "bullets"> & { bulletsText: string };
type EditableSkillGroup = { category: string; itemsText: string };

const inputClass =
  "w-full rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/10 dark:focus:border-white/30";
const labelClass = "text-sm font-medium text-zinc-900 dark:text-zinc-100";
const cardClass =
  "space-y-3 rounded-lg border border-black/10 p-4 dark:border-white/10";
const sectionClass =
  "space-y-4 rounded-xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950";

function toEditableExperiences(experiences: Experience[]): EditableExperience[] {
  return experiences.map(({ bullets, ...rest }) => ({
    ...rest,
    bulletsText: bullets.join("\n"),
  }));
}

function toEditableSkills(skills: SkillGroup[]): EditableSkillGroup[] {
  return skills.map(({ category, items }) => ({
    category,
    itemsText: items.join(", "),
  }));
}

export default function OnboardingForm({ initial }: { initial: MasterProfile }) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    saveMasterProfile,
    undefined
  );

  const [fullName, setFullName] = useState(initial.full_name);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);
  const [location, setLocation] = useState(initial.location);
  const [linkedinUrl, setLinkedinUrl] = useState(initial.linkedin_url);
  const [headline, setHeadline] = useState(initial.headline);
  const [summary, setSummary] = useState(initial.summary);
  const [nationality, setNationality] = useState(initial.nationality);
  const [visaStatus, setVisaStatus] = useState(initial.visa_status);
  const [availability, setAvailability] = useState(initial.availability);
  const [languagesText, setLanguagesText] = useState(initial.languages.join(", "));

  const [experiences, setExperiences] = useState<EditableExperience[]>(
    toEditableExperiences(initial.experiences)
  );
  const [education, setEducation] = useState<Education[]>(initial.education);
  const [skills, setSkills] = useState<EditableSkillGroup[]>(toEditableSkills(initial.skills));
  const [certifications, setCertifications] = useState<Certification[]>(initial.certifications);

  const addExperience = () =>
    setExperiences((prev) => [
      ...prev,
      { company: "", title: "", location: "", start: "", end: "", bulletsText: "" },
    ]);
  const updateExperience = (index: number, patch: Partial<EditableExperience>) =>
    setExperiences((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  const removeExperience = (index: number) =>
    setExperiences((prev) => prev.filter((_, i) => i !== index));

  const addEducation = () =>
    setEducation((prev) => [...prev, { institution: "", degree: "", field: "", year: "" }]);
  const updateEducation = (index: number, patch: Partial<Education>) =>
    setEducation((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  const removeEducation = (index: number) =>
    setEducation((prev) => prev.filter((_, i) => i !== index));

  const addSkillGroup = () =>
    setSkills((prev) => [...prev, { category: "", itemsText: "" }]);
  const updateSkillGroup = (index: number, patch: Partial<EditableSkillGroup>) =>
    setSkills((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  const removeSkillGroup = (index: number) =>
    setSkills((prev) => prev.filter((_, i) => i !== index));

  const addCertification = () =>
    setCertifications((prev) => [...prev, { name: "", issuer: "", year: "" }]);
  const updateCertification = (index: number, patch: Partial<Certification>) =>
    setCertifications((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  const removeCertification = (index: number) =>
    setCertifications((prev) => prev.filter((_, i) => i !== index));

  const experiencesJson = JSON.stringify(
    experiences.map(({ bulletsText, ...rest }) => ({
      ...rest,
      bullets: bulletsText
        .split("\n")
        .map((b) => b.trim())
        .filter(Boolean),
    }))
  );
  const skillsJson = JSON.stringify(
    skills.map(({ category, itemsText }) => ({
      category,
      items: itemsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    }))
  );
  const languagesJson = JSON.stringify(
    languagesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="experiences" value={experiencesJson} />
      <input type="hidden" name="education" value={JSON.stringify(education)} />
      <input type="hidden" name="skills" value={skillsJson} />
      <input type="hidden" name="certifications" value={JSON.stringify(certifications)} />
      <input type="hidden" name="languages" value={languagesJson} />

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">Contact</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className={labelClass}>Full name</label>
            <input
              name="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Email</label>
            <input
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Phone</label>
            <input
              name="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Location</label>
            <input
              name="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Hyderabad, India"
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>LinkedIn URL</label>
            <input
              name="linkedin_url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Headline</label>
            <input
              name="headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              required
              placeholder="Senior Data Analyst | SAP BW/4HANA"
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">Professional summary</h2>
        <textarea
          name="summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={4}
          className={inputClass}
        />
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
          Gulf details <span className="text-sm font-normal text-zinc-500">(optional)</span>
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <label className={labelClass}>Nationality</label>
            <input
              name="nationality"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Visa status</label>
            <input
              name="visa_status"
              value={visaStatus}
              onChange={(e) => setVisaStatus(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Availability</label>
            <input
              name="availability"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              placeholder="30 days notice"
              className={inputClass}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Languages (comma-separated)</label>
          <input
            value={languagesText}
            onChange={(e) => setLanguagesText(e.target.value)}
            placeholder="English, Hindi, Arabic"
            className={inputClass}
          />
        </div>
      </section>

      <section className={sectionClass}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50">Work experience</h2>
          <button
            type="button"
            onClick={addExperience}
            className="text-sm font-medium text-zinc-950 dark:text-zinc-50"
          >
            + Add role
          </button>
        </div>
        {experiences.length === 0 && (
          <p className="text-sm text-zinc-500">No roles added yet.</p>
        )}
        {experiences.map((exp, i) => (
          <div key={i} className={cardClass}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                placeholder="Company"
                value={exp.company}
                onChange={(e) => updateExperience(i, { company: e.target.value })}
                className={inputClass}
              />
              <input
                placeholder="Title"
                value={exp.title}
                onChange={(e) => updateExperience(i, { title: e.target.value })}
                className={inputClass}
              />
              <input
                placeholder="Location"
                value={exp.location}
                onChange={(e) => updateExperience(i, { location: e.target.value })}
                className={inputClass}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Start (Jan 2022)"
                  value={exp.start}
                  onChange={(e) => updateExperience(i, { start: e.target.value })}
                  className={inputClass}
                />
                <input
                  placeholder="End (Present)"
                  value={exp.end}
                  onChange={(e) => updateExperience(i, { end: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
            <textarea
              placeholder="One bullet per line"
              value={exp.bulletsText}
              onChange={(e) => updateExperience(i, { bulletsText: e.target.value })}
              rows={4}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => removeExperience(i)}
              className="text-sm text-red-600 dark:text-red-400"
            >
              Remove
            </button>
          </div>
        ))}
      </section>

      <section className={sectionClass}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50">Education</h2>
          <button
            type="button"
            onClick={addEducation}
            className="text-sm font-medium text-zinc-950 dark:text-zinc-50"
          >
            + Add education
          </button>
        </div>
        {education.length === 0 && <p className="text-sm text-zinc-500">None added yet.</p>}
        {education.map((ed, i) => (
          <div key={i} className={cardClass}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                placeholder="Institution"
                value={ed.institution}
                onChange={(e) => updateEducation(i, { institution: e.target.value })}
                className={inputClass}
              />
              <input
                placeholder="Degree"
                value={ed.degree}
                onChange={(e) => updateEducation(i, { degree: e.target.value })}
                className={inputClass}
              />
              <input
                placeholder="Field of study"
                value={ed.field}
                onChange={(e) => updateEducation(i, { field: e.target.value })}
                className={inputClass}
              />
              <input
                placeholder="Year"
                value={ed.year}
                onChange={(e) => updateEducation(i, { year: e.target.value })}
                className={inputClass}
              />
            </div>
            <button
              type="button"
              onClick={() => removeEducation(i)}
              className="text-sm text-red-600 dark:text-red-400"
            >
              Remove
            </button>
          </div>
        ))}
      </section>

      <section className={sectionClass}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50">Skills</h2>
          <button
            type="button"
            onClick={addSkillGroup}
            className="text-sm font-medium text-zinc-950 dark:text-zinc-50"
          >
            + Add category
          </button>
        </div>
        {skills.length === 0 && <p className="text-sm text-zinc-500">None added yet.</p>}
        {skills.map((sk, i) => (
          <div key={i} className={cardClass}>
            <input
              placeholder="Category (e.g. Data & BI)"
              value={sk.category}
              onChange={(e) => updateSkillGroup(i, { category: e.target.value })}
              className={inputClass}
            />
            <input
              placeholder="Skills, comma-separated"
              value={sk.itemsText}
              onChange={(e) => updateSkillGroup(i, { itemsText: e.target.value })}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => removeSkillGroup(i)}
              className="text-sm text-red-600 dark:text-red-400"
            >
              Remove
            </button>
          </div>
        ))}
      </section>

      <section className={sectionClass}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50">Certifications</h2>
          <button
            type="button"
            onClick={addCertification}
            className="text-sm font-medium text-zinc-950 dark:text-zinc-50"
          >
            + Add certification
          </button>
        </div>
        {certifications.length === 0 && <p className="text-sm text-zinc-500">None added yet.</p>}
        {certifications.map((cert, i) => (
          <div key={i} className={cardClass}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input
                placeholder="Name"
                value={cert.name}
                onChange={(e) => updateCertification(i, { name: e.target.value })}
                className={inputClass}
              />
              <input
                placeholder="Issuer"
                value={cert.issuer}
                onChange={(e) => updateCertification(i, { issuer: e.target.value })}
                className={inputClass}
              />
              <input
                placeholder="Year"
                value={cert.year}
                onChange={(e) => updateCertification(i, { year: e.target.value })}
                className={inputClass}
              />
            </div>
            <button
              type="button"
              onClick={() => removeCertification(i)}
              className="text-sm text-red-600 dark:text-red-400"
            >
              Remove
            </button>
          </div>
        ))}
      </section>

      {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc] sm:w-auto"
      >
        {pending ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
