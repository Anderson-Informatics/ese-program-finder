import ProgramModel from "~~/server/models/program.model";
import SchoolModel from "~~/server/models/school.model";
import SummaryModel from "~~/server/models/summary.model";

export default defineEventHandler(async (event) => {
  const params = (event.context && (event.context as any).params) || {};
  const schoolId = params.schoolId;

  if (!schoolId) {
    throw createError({ statusCode: 400, statusMessage: "Missing schoolId parameter" });
  }

  // Try numeric SchoolID first, then string, to tolerate the mixed types in the DB
  let program = null;
  try {
    const numericId = Number(schoolId);
    if (!Number.isNaN(numericId)) {
      program = await ProgramModel.findOne({ SchoolID: numericId }).lean();
    }
    if (!program) {
      program = await ProgramModel.findOne({ SchoolID: schoolId }).lean();
    }
  } catch (err) {
    console.error("Error fetching program doc:", err);
    throw createError({ statusCode: 500, statusMessage: "Error fetching program document" });
  }

  if (!program) {
    throw createError({ statusCode: 404, statusMessage: `Program document not found for SchoolID ${schoolId}` });
  }

  // Fetch any program summaries for this school (capacity/enrolled/etc.)
  try {
    const numericId = Number(schoolId);
    const summaryQuery = !Number.isNaN(numericId) ? { SchoolID: numericId } : { SchoolID: schoolId };
    const summaries = await SummaryModel.find(summaryQuery).lean();

    // Build a map: summariesMap[Program][GradeBand] = summary
    const summariesMap: Record<string, Record<string, any>> = {};
    for (const s of summaries) {
      const p = String((s as any).Program || "");
      const g = String((s as any).GradeBand || "");
      if (!(summariesMap as any)[p]) (summariesMap as any)[p] = {};
      (summariesMap as any)[p][g] = s;
    }

    // Attach to program response under a non-conflicting key
    (program as any)._summaries = summariesMap;
    // Compute latest LastUpdated across summaries.
    try {
      let bestEpoch: number | null = null;
      let bestComp: { y: number; mo: number; d: number; h: number; m: number; s: number } | null = null;
      for (const s of summaries) {
        const lu = (s as any).LastUpdated;
        if (!lu) continue;
        const d = new Date(lu);
        // The data is stored with UTC timezone but actually represents Eastern local time.
        // We will read the UTC components (which correspond to the intended Eastern components)
        // and use Date.UTC(...) for ordering and formatting.
        const y = d.getUTCFullYear();
        const mo = d.getUTCMonth();
        const dd = d.getUTCDate();
        const hh = d.getUTCHours();
        const mm = d.getUTCMinutes();
        const ss = d.getUTCSeconds();
        const epoch = Date.UTC(y, mo, dd, hh, mm, ss);
        if (bestEpoch === null || epoch > bestEpoch) {
          bestEpoch = epoch;
          bestComp = { y, mo, d: dd, h: hh, m: mm, s: ss };
        }
      }
      if (bestComp) {
        const months = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const pad2 = (n: number) => String(n).padStart(2, "0");
        const hr12 = bestComp.h % 12 === 0 ? 12 : bestComp.h % 12;
        const ampm = bestComp.h >= 12 ? "PM" : "AM";
        const formatted = `${months[bestComp.mo]} ${bestComp.d}, ${bestComp.y}, ${String(
          hr12
        ).padStart(2, "0")}:${pad2(bestComp.m)}:${pad2(bestComp.s)} ${ampm} ET`;
        (program as any).lastUpdatedEastern = formatted;
        (program as any)._lastUpdatedEasternEpoch = bestEpoch;
      }
    } catch (err) {
      /* ignore formatting errors */
    }
  } catch (err) {
    console.error("Error fetching summary docs:", err);
    // Non-fatal: continue without summaries
    (program as any)._summaries = {};
  }

  return program;
});
