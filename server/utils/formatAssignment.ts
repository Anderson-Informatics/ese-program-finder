import type { SchoolAssignment } from "./boundaryAssignment";

export function formatAssignment(
  a: SchoolAssignment | Partial<SchoolAssignment> | null
): string {
  if (!a || !a.schoolName) {
    return "";
  }

  if (a.Type === "Neighborhood") {
    return `${a.schoolName} (Neighborhood)`;
  }

  return `${a.schoolName} (${a.Match_Type || a.Type})`;
}
