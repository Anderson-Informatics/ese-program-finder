import BoundaryModel from "~~/server/models/boundary.model";
import normalizeGrade from "./normalizeGrade";

export interface SchoolAssignment {
  schoolName: string;
  Match_Type: string;
  Type: string;
  SchoolID: number;
  High_Grade: number;
}

export default async function findBoundaryAssignments(
  lat: number,
  lng: number,
  grade: string | number
): Promise<(SchoolAssignment | Partial<SchoolAssignment> | null)[]> {
  const parsedGrade = normalizeGrade(grade);

  if (typeof lat !== "number" || typeof lng !== "number" || Number.isNaN(lat) || Number.isNaN(lng)) {
    throw new Error("Invalid lat or lng");
  }

  let schools = await BoundaryModel.find(
    {
      geometry: {
        $geoIntersects: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
        },
      },
    },
    { SchoolID: 1, Type: 1, schoolName: 1, High_Grade: 1, _id: 0 }
  );

  let assignments: SchoolAssignment[] = [];

  if (Array.isArray(schools) && !schools.length) {
    schools = await BoundaryModel.find(
      {
        geometry: {
          $near: { $geometry: { type: "Point", coordinates: [lng, lat] } },
        },
      },
      { SchoolID: 1, Type: 1, schoolName: 1, High_Grade: 1, _id: 0 }
    );

    assignments = schools.map((item) => {
      const { schoolName, Type, SchoolID, High_Grade } = item.toObject() as unknown as SchoolAssignment;
      return {
        schoolName,
        Type,
        SchoolID,
        High_Grade,
        Match_Type: "Nearest Boundary",
      };
    });
  } else {
    assignments = schools.map((item) => {
      const { schoolName, Type, SchoolID, High_Grade } = item.toObject() as unknown as SchoolAssignment;
      return {
        schoolName,
        Type,
        SchoolID,
        High_Grade,
        Match_Type: "Within Boundary",
      };
    });
  }

  const elem = assignments.find((school) => school.Type === "Elementary") ?? null;
  const mid = assignments.find((school) => school.Type === "Middle") ?? null;
  const high = assignments.find((school) => school.Type === "High") ?? null;

  let neigh: Partial<SchoolAssignment> = {};

  if (elem && typeof elem.High_Grade === "number" && parsedGrade <= elem.High_Grade) {
    neigh = { ...elem };
    neigh.Type = "Neighborhood";
  } else if (mid && typeof mid.High_Grade === "number" && parsedGrade <= mid.High_Grade) {
    neigh = { ...mid };
    neigh.Type = "Neighborhood";
  } else if (high && typeof high.High_Grade === "number" && parsedGrade <= high.High_Grade) {
    neigh = { ...high };
    neigh.Type = "Neighborhood";
  } else {
    neigh = {};
  }

  return [elem, mid, high, neigh];
}
