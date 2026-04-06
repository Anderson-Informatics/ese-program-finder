import ProgramModel from "~~/server/models/program.model";
import SchoolModel from "~~/server/models/school.model";

export default defineEventHandler(async (event) => {
  try {
    // Find all program docs and return unique SchoolID + School name if present
    const docs = await ProgramModel.find({}, { SchoolID: 1, School: 1, _id: 0 }).lean();
    const ids = Array.from(new Set(docs.map((d: any) => (d && d.SchoolID !== undefined ? String(d.SchoolID) : null)).filter(Boolean)));
    // Query SchoolModel to get human names where available
    const schools = await SchoolModel.find({ SchoolID: { $in: ids.map((i) => (isNaN(Number(i)) ? i : Number(i))) } }, { SchoolID: 1, "School Name": 1, SchoolName: 1, School: 1, _id: 0 }).lean();
    const nameMap: Record<string, string> = {};
    for (const s of schools) {
      const id = s && s.SchoolID !== undefined ? String(s.SchoolID) : null;
      if (!id) continue;
      nameMap[id] = (s["School Name"] || s.SchoolName || s.School || "").toString();
    }

    const map: Record<string, { SchoolID: any; School?: string }> = {};
    for (const d of docs) {
      const id = d && d.SchoolID !== undefined ? String(d.SchoolID) : null;
      if (!id) continue;
      if (!map[id]) {
        const schoolName = nameMap[id] || (d && (d.School || (d as any)["School Name"])) || null;
        map[id] = { SchoolID: d.SchoolID, School: schoolName };
      }
    }
    return Object.values(map);
  } catch (err) {
    console.error("Error fetching schools from programs:", err);
    return [];
  }
});
