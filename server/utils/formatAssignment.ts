import type { SchoolAssignment } from "./boundaryAssignment";

export function formatAssignmentId(
  a: SchoolAssignment | Partial<SchoolAssignment> | null
): string {
  if (!a || a.SchoolID === undefined || a.SchoolID === null) {
    return "";
  }
  return String(a.SchoolID);
}

export function formatAssignmentName(
  a: SchoolAssignment | Partial<SchoolAssignment> | null
): string {
  if (!a || !a.schoolName) {
    return "";
  }
  return a.schoolName;
}
