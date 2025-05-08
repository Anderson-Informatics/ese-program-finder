import BoundaryModel from "~~/server/models/boundary.model";

export default defineEventHandler(async (event) => {
  // Get the query parameters from the request
  const { lat, lng, grade } = getQuery(event);

  const parsedGrade =
    grade === "PreK"
      ? -1
      : grade === "Pre-K"
      ? -1
      : grade === "K"
      ? 0
      : grade === "Kindergarten"
      ? 0
      : parseInt(grade as string);

  type School = {
    schoolName: string;
    Match_Type: string;
    Type: string;
    SchoolID: number;
    High_Grade: number;
  };

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

  let assignments: School[] = [];

  if (Array.isArray(schools) && !schools.length) {
    schools = await BoundaryModel.find(
      {
        geometry: {
          $near: { $geometry: { type: "Point", coordinates: [lng, lat] } },
        },
      },
      { SchoolID: 1, Type: 1, schoolName: 1, High_Grade: 1, _id: 0 }
    );
    // Then add Match_Type variable to clarify how student was assigned
    assignments = schools.map((item) => {
      const { schoolName, Type, SchoolID, High_Grade } =
        item.toObject() as unknown as School;
      return {
        schoolName,
        Type,
        SchoolID,
        High_Grade,
        Match_Type: "Nearest Boundary",
      };
    });
  } else {
    // Then add Match_Type variable to clarify how student was assigned
    assignments = schools.map((item) => {
      const { schoolName, Type, SchoolID, High_Grade } =
        item.toObject() as unknown as School;
      return {
        schoolName,
        Type,
        SchoolID,
        High_Grade,
        Match_Type: "Within Boundary",
      };
    });
  }

  let elem = assignments.filter((school) => {
    return school.Type == "Elementary";
  })[0];
  let mid = assignments.filter((school) => {
    return school.Type == "Middle";
  })[0];
  let high = assignments.filter((school) => {
    return school.Type == "High";
  })[0];

  let neigh: Partial<School> = {};

  if (parsedGrade <= elem.High_Grade) {
    neigh = { ...elem };
    neigh.Type = "Neighborhood";
  } else if (parsedGrade <= mid.High_Grade) {
    neigh = { ...mid };
    neigh.Type = "Neighborhood";
  } else if (parsedGrade <= high.High_Grade) {
    neigh = { ...high };
    neigh.Type = "Neighborhood";
  } else {
    neigh = {};
  }

  // The return value of the function is sent as the response back to the client
  // when the "Respond with Result" setting is set.
  return [elem, mid, high, neigh];
});
