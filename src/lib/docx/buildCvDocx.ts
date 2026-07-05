import {
  AlignmentType,
  Document,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  TabStopType,
  TabStopPosition,
  TextRun,
} from "docx";
import type { TailoredCV } from "@/lib/types";

// ATS gate Layer 1 (SPEC.md Section 6): guaranteed by construction here, not by
// re-checking after the fact — single column, standard fonts, bullets via
// LevelFormat.BULLET (never typed glyphs), right tab-stopped dates, no
// header/footer content, standard section order, photo-free.

const FONT = "Calibri";
const BULLET_REFERENCE = "cv-bullets";

type SectionName =
  | "Professional Summary"
  | "Key Skills"
  | "Work Experience"
  | "Education"
  | "Certifications"
  | "Personal Details";

function sectionHeading(text: SectionName): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, font: FONT })],
  });
}

function bulletParagraph(text: string): Paragraph {
  return new Paragraph({
    numbering: { reference: BULLET_REFERENCE, level: 0 },
    children: [new TextRun({ text, font: FONT })],
  });
}

// A left label with a date/year right-aligned via a right tab stop at the
// page's max width — never manual spaces (SPEC.md Section 6, Layer 1).
function labelWithRightDate(left: string, right: string, boldLeft: boolean): Paragraph {
  return new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    spacing: { after: 40 },
    children: [
      new TextRun({ text: left, bold: boldLeft, font: FONT }),
      ...(right ? [new TextRun({ text: `\t${right}`, font: FONT })] : []),
    ],
  });
}

export function buildCvDocx(cv: TailoredCV): Promise<Buffer> {
  const body: Paragraph[] = [];

  // Name, headline, contact — lives in the document body, never in a
  // true header/footer region (many ATS parsers skip those).
  body.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: cv.contact.full_name, bold: true, size: 32, font: FONT })],
    })
  );
  body.push(
    new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({ text: cv.contact.headline, size: 22, font: FONT })],
    })
  );

  const contactLine = [cv.contact.phone, cv.contact.email, cv.contact.location, cv.contact.linkedin_url]
    .filter(Boolean)
    .join(" | ");
  if (contactLine) {
    body.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: contactLine, size: 20, font: FONT })],
      })
    );
  }

  if (cv.professional_summary) {
    body.push(sectionHeading("Professional Summary"));
    body.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: cv.professional_summary, font: FONT })],
      })
    );
  }

  if (cv.key_skills?.length) {
    body.push(sectionHeading("Key Skills"));
    body.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: cv.key_skills.join(" | "), font: FONT })],
      })
    );
  }

  if (cv.work_experience?.length) {
    body.push(sectionHeading("Work Experience"));
    for (const role of cv.work_experience) {
      body.push(labelWithRightDate(`${role.title}, ${role.company}`, role.dates, true));
      if (role.location) {
        body.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [new TextRun({ text: role.location, italics: true, size: 20, font: FONT })],
          })
        );
      }
      for (const bullet of role.bullets) {
        body.push(bulletParagraph(bullet));
      }
      body.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
    }
  }

  if (cv.education?.length) {
    body.push(sectionHeading("Education"));
    for (const ed of cv.education) {
      const left = [ed.degree, ed.field].filter(Boolean).join(", ") +
        (ed.institution ? ` — ${ed.institution}` : "");
      body.push(labelWithRightDate(left, ed.year ?? "", false));
    }
  }

  if (cv.certifications?.length) {
    body.push(sectionHeading("Certifications"));
    for (const cert of cv.certifications) {
      body.push(labelWithRightDate(`${cert.name} — ${cert.issuer}`, cert.year ?? "", false));
    }
  }

  // Gulf format only — omitted entirely (not just left blank) when not set.
  if (cv.personal_details) {
    const pd = cv.personal_details;
    const rows: string[] = [];
    if (pd.nationality) rows.push(`Nationality: ${pd.nationality}`);
    if (pd.visa_status) rows.push(`Visa/Residency status: ${pd.visa_status}`);
    if (pd.availability) rows.push(`Availability: ${pd.availability}`);
    if (pd.languages) rows.push(`Languages: ${pd.languages}`);
    if (pd.relocation) rows.push(`Willingness to relocate: ${pd.relocation}`);

    if (rows.length) {
      body.push(sectionHeading("Personal Details"));
      for (const row of rows) {
        body.push(new Paragraph({ children: [new TextRun({ text: row, font: FONT })] }));
      }
    }
  }

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: BULLET_REFERENCE,
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 360, hanging: 360 },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [{ properties: {}, children: body }],
  });

  return Packer.toBuffer(doc);
}

function sanitizeFilenameSegment(value: string): string {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "_");
}

// SPEC.md Section 7: "{FullName}_{Role}_{Company}_CV.docx"
export function buildCvFilename(fullName: string, role: string, company?: string | null): string {
  const segments = [fullName, role, company ?? undefined]
    .filter((s): s is string => Boolean(s && s.trim()))
    .map(sanitizeFilenameSegment);
  return `${segments.join("_")}_CV.docx`;
}

// Cheap structural check before serving (Section 7): a .docx is a zip, so a
// well-formed one must start with the local file header signature "PK\x03\x04".
export function isWellFormedDocx(buffer: Buffer): boolean {
  return (
    buffer.length > 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  );
}
