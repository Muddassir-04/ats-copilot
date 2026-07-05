export type ApplicationStatus = "saved" | "applied" | "interviewing" | "offer" | "rejected";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "saved",
  "applied",
  "interviewing",
  "offer",
  "rejected",
];

export type Application = {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  applied_at: string | null;
  follow_up_at: string | null;
  source: string | null;
  notes: string | null;
};

export type Experience = {
  company: string;
  title: string;
  location: string;
  start: string;
  end: string;
  bullets: string[];
};

export type Education = {
  institution: string;
  degree: string;
  field: string;
  year: string;
};

export type SkillGroup = {
  category: string;
  items: string[];
};

export type Certification = {
  name: string;
  issuer: string;
  year: string;
};

export type MasterProfile = {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  linkedin_url: string;
  headline: string;
  summary: string;
  nationality: string;
  visa_status: string;
  availability: string;
  experiences: Experience[];
  education: Education[];
  skills: SkillGroup[];
  certifications: Certification[];
  languages: string[];
};

export const emptyMasterProfile: MasterProfile = {
  full_name: "",
  email: "",
  phone: "",
  location: "",
  linkedin_url: "",
  headline: "",
  summary: "",
  nationality: "",
  visa_status: "",
  availability: "",
  experiences: [],
  education: [],
  skills: [],
  certifications: [],
  languages: [],
};

// Output schema of Prompt B (CV tailoring) — see SPEC.md Section 8.
// Stored as `tailored_documents.tailored_cv` and rendered by the .docx exporter.

export type TailoredContact = {
  full_name: string;
  headline: string;
  phone?: string;
  email: string;
  linkedin_url?: string;
  location?: string;
};

export type TailoredWorkExperience = {
  company: string;
  title: string;
  location?: string;
  dates: string;
  bullets: string[];
};

export type TailoredEducation = {
  institution: string;
  degree: string;
  field?: string;
  year?: string;
};

export type TailoredCertification = {
  name: string;
  issuer: string;
  year?: string;
};

export type TailoredPersonalDetails = {
  nationality?: string;
  visa_status?: string;
  availability?: string;
  languages?: string;
  relocation?: string;
} | null;

export type TailoredCV = {
  contact: TailoredContact;
  professional_summary: string;
  key_skills: string[];
  work_experience: TailoredWorkExperience[];
  education: TailoredEducation[];
  certifications: TailoredCertification[];
  personal_details: TailoredPersonalDetails;
};
