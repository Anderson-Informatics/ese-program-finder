import ProgramModel from "~~/server/models/program.model";
import SchoolModel from "~~/server/models/school.model";

export default defineEventHandler(async (event) => {
  // Get the query parameters from the request
  const { grade, program, lat, lng } = getQuery(event) as {
    grade: keyof (typeof grade_band_map)[keyof typeof grade_band_map];
    program: keyof typeof grade_band_map;
    lat: number;
    lng: number;
  };

  // Get the assigned neighborhood school
  const nhschoolData = await $fetch(
    `/api/boundaries?lat=${lat}&lng=${lng}&grade=${grade}`
  );
  const nhid = nhschoolData.filter((item) => {
    // Filter out the schools that are not in the same program
    if (item.Type === "Neighborhood") {
      return item;
    }
  })[0].SchoolID;

  const grade_band_map = {
    ASD: {
      PreK: "PK-2",
      K: "PK-2",
      "1": "PK-2",
      "2": "PK-2",
      "3": "3-5",
      "4": "3-5",
      "5": "3-5",
      "6": "6-8",
      "7": "6-8",
      "8": "6-8",
      "9": "9-12",
      "10": "9-12",
      "11": "9-12",
      "12": "9-12",
    },
    MICI: {
      PreK: "PK-5",
      K: "PK-5",
      "1": "PK-5",
      "2": "PK-5",
      "3": "PK-5",
      "4": "PK-5",
      "5": "PK-5",
      "6": "6-8",
      "7": "6-8",
      "8": "6-8",
      "9": "9-12",
      "10": "9-12",
      "11": "9-12",
      "12": "9-12",
    },
    ECSE: {
      PreK: "PK",
      K: "None",
      "1": "None",
      "2": "None",
      "3": "None",
      "4": "None",
      "5": "None",
      "6": "None",
      "7": "None",
      "8": "None",
      "9": "None",
      "10": "None",
      "11": "None",
      "12": "None",
    },
    MOCI: {
      PreK: "PK-5",
      K: "PK-5",
      "1": "PK-5",
      "2": "PK-5",
      "3": "PK-5",
      "4": "PK-5",
      "5": "PK-5",
      "6": "6-8",
      "7": "6-8",
      "8": "6-8",
      "9": "9-12",
      "10": "9-12",
      "11": "9-12",
      "12": "9-12",
    },
    POHI: {
      PreK: "PK-2",
      K: "PK-2",
      "1": "PK-2",
      "2": "PK-2",
      "3": "3-5",
      "4": "3-5",
      "5": "3-5",
      "6": "6-8",
      "7": "6-8",
      "8": "6-8",
      "9": "None",
      "10": "None",
      "11": "None",
      "12": "None",
    },
    EI: {
      PreK: "PK-5",
      K: "PK-5",
      "1": "PK-5",
      "2": "PK-5",
      "3": "PK-5",
      "4": "PK-5",
      "5": "PK-5",
      "6": "6-8",
      "7": "6-8",
      "8": "6-8",
      "9": "None",
      "10": "None",
      "11": "None",
      "12": "None",
    },
    VI: {
      PreK: "PK-12",
      K: "PK-12",
      "1": "PK-12",
      "2": "PK-12",
      "3": "PK-12",
      "4": "PK-12",
      "5": "PK-12",
      "6": "PK-12",
      "7": "PK-12",
      "8": "PK-12",
      "9": "PK-12",
      "10": "PK-12",
      "11": "PK-12",
      "12": "PK-12",
    },
    HI: {
      PreK: "PK-12",
      K: "PK-12",
      "1": "PK-12",
      "2": "PK-12",
      "3": "PK-12",
      "4": "PK-12",
      "5": "PK-12",
      "6": "PK-12",
      "7": "PK-12",
      "8": "PK-12",
      "9": "PK-12",
      "10": "PK-12",
      "11": "PK-12",
      "12": "PK-12",
    },
    DHH: {
      PreK: "PK-2",
      K: "PK-2",
      "1": "PK-2",
      "2": "PK-2",
      "3": "3-5",
      "4": "3-5",
      "5": "3-5",
      "6": "6-8",
      "7": "6-8",
      "8": "6-8",
      "9": "9-12",
      "10": "9-12",
      "11": "9-12",
      "12": "9-12",
    },
  };
  // Get the grade band for the given program and grade
  let gradeBand: string | undefined;
  if (
    program in grade_band_map &&
    grade in grade_band_map[program as keyof typeof grade_band_map]
  ) {
    gradeBand = grade_band_map[program][grade];
  } else {
    console.error("Invalid program or grade");
    return [];
  }

  // Query the database for matching programs
  const programs = await ProgramModel.find(
    {
      [`${program}.${gradeBand}`]: { $gt: 0 },
    },
    { SchoolID: 1, _id: 0 }
  );
  // Turn the program info into array of school IDs
  const programIds = programs.map((item) => item.SchoolID as number);

  // Now for the fun logic of making the program assignment
  const find_nearest_school = async (
    lat: number,
    lng: number,
    schids: number[]
  ): Promise<any[]> => {
    let nearest = await SchoolModel.find(
      {
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
          },
        },
        SchoolID: { $in: schids },
      },
      {
        SchoolID: 1,
        "School Name": 1,
        Address: 1,
        location: 1,
        Type: 1,
        ShortName: 1,
      }
    ).limit(1);
    return nearest;
  };

  // These are the full feeder groups of the neighborhood schools
  const feederGroups = [
    [18, 4, 103, 456, 546, 853, 925, 939, 1438],
    [32, 5, 2377, 3130, 9341],
    [617, 975, 6103],
    [902, 3737, 4349, 9991],
    [1043, 176, 446, 1803, 2058, 2703, 3558, 7581],
    [1189, 542, 2390, 4062, 9992, 9994],
    [1634, 1134, 2036, 4319, 9125],
    [2644, 857, 1518, 1552, 3420, 4292, 7633],
    [2778, 468, 4156, 4413],
    [3015, 880, 1493, 2431, 2708],
    [3540, 176, 446, 1803, 2058, 2703, 3558, 7581],
    [4477, 858, 860, 2383, 2669, 3123],
  ];

  // This is the feeder group of the neighborhood school
  const feederSchools = feederGroups.filter((group) => {
    return nhid !== undefined && group.includes(nhid);
  })[0];

  // This will be any school ids that have the desired program in the feeder group
  const feederPrograms = programIds.filter((element) =>
    feederSchools.includes(element)
  );

  let assignment = null;
  if (program === "VI") {
    assignment = await $fetch(`/api/schools?SchoolID=176`); // Golightly
  } else if (nhid && programIds.includes(nhid)) {
    assignment = await $fetch(`/api/schools?SchoolID=${nhid}`);
  } else if (feederPrograms.length > 0) {
    assignment = await find_nearest_school(lat, lng, feederPrograms);
  } else {
    assignment = await find_nearest_school(lat, lng, programIds);
  }
  return assignment;
});
