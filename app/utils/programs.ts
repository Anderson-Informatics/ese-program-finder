export const ALLOWED_PROGRAMS = ["ASD", "MICI", "ECSE", "MOCI", "POHI", "EI", "VI", "DHH"] as const;

export const PROGRAM_NAMES: Record<string, string> = {
  ASD: "Autism Spectrum Disorder",
  MICI: "Mild Cognitive Impaired",
  ECSE: "Early Childhood Special Education",
  MOCI: "Moderate Cognitive Impaired",
  POHI: "Physically/Other Health Impaired",
  EI: "Emotionally Impaired",
  VI: "Visually Impaired",
  DHH: "Deaf and Hard of Hearing",
};

// Grade band lists tailored for UI display. Matches server grouping roughly.
export const PROGRAM_GRADE_BANDS: Record<string, string[]> = {
  ASD: ["PK-2", "3-5", "6-8", "9-12", "14"],
  MICI: ["PK-5", "6-8", "9-12", "14"],
  ECSE: ["PK"],
  MOCI: ["PK-5", "6-8", "9-12", "14"],
  POHI: ["PK-2", "3-5", "6-8"],
  EI: ["PK-5", "6-8"],
  VI: ["PK-12", "14"],
  DHH: ["PK-2", "3-5", "6-8", "9-12", "14"],
};

export default { ALLOWED_PROGRAMS, PROGRAM_NAMES, PROGRAM_GRADE_BANDS };
