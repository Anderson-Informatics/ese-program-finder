import ProgramModel from "~~/server/models/program.model";
import SchoolModel from "~~/server/models/school.model";

export default defineEventHandler(async (event) => {
  // Get the query parameters from the request
  const { grade, program, lat, lng, setting } = getQuery(event) as {
    grade: keyof typeof grade_band_map;
    program: keyof typeof program_string_map;
    lat: number;
    lng: number;
    setting?: string;
  };

  // Convert the program string to a short key
  const grade_string_map: Record<
    string,
    keyof (typeof grade_band_map)[keyof typeof grade_band_map]
  > = {
    PreK: "PreK",
    Kindergarten: "K",
    "1st grade": "1",
    "2nd grade": "2",
    "3rd grade": "3",
    "4th grade": "4",
    "5th grade": "5",
    "6th grade": "6",
    "7th grade": "7",
    "8th grade": "8",
    "9th grade": "9",
    "10th grade": "10",
    "11th grade": "11",
    "12th grade": "12",
    "Post-Secondary": "14",
  };

  // Convert the program string to a short key
  const program_string_map: Record<string, keyof typeof grade_band_map> = {
    "Autism Spectrum Disorder": "ASD",
    "Day Treatment": "DT",
    "Deaf and Hard of Hearing": "DHH",
    "Dual Diagnosed (Emotionally Impaired)": "DDEI",
    "Early Childhood Special Education": "ECSE",
    "Early Intervention": "EINT",
    "Emotionally Impaired": "EI",
    "Mild Cognitive Impaired": "MICI",
    "Moderate Cognitive Impaired": "MOCI",
    "Physically/Other Health Impaired": "POHI",
    "Resource Room": "RR",
    "Severe Cognitive Impaired": "SCI",
    "Severe Multiple Impaired": "SMI",
    "Visually Impaired": "VI",
  };

  const programKey = program_string_map[program];
  console.log("Program: ", program);
  console.log("Program Key: ", programKey);
  const gradeKey = grade_string_map[grade];
  console.log("Grade: ", grade);
  console.log("Grade Key: ", gradeKey);

  let nhschoolData;
  let nhid: number | undefined;

  if (["PreK", "Post-Secondary"].includes(grade)) {
  } else {
    // Get the assigned neighborhood school
    nhschoolData = await $fetch(
      `/api/boundaries?lat=${lat}&lng=${lng}&grade=${gradeKey}`
    );
    nhid = nhschoolData.filter((item) => {
      // Filter out the schools that are not in the same program
      if (item.Type === "Neighborhood") {
        return item;
      }
    })[0].SchoolID;
    console.log("Neighborhood School ID: ", nhid);
  }

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
      "14": "14",
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
      "14": "14",
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
      "14": "None",
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
      "14": "14",
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
      "14": "None",
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
      "14": "None",
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
      "14": "14",
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
      "14": "14",
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
      "14": "14",
    },
    DT: {
      PreK: "None",
      K: "K-12",
      "1": "K-12",
      "2": "K-12",
      "3": "K-12",
      "4": "K-12",
      "5": "K-12",
      "6": "K-12",
      "7": "K-12",
      "8": "K-12",
      "9": "K-12",
      "10": "K-12",
      "11": "K-12",
      "12": "K-12",
      "14": "14",
    },
    DDEI: {
      PreK: "None",
      K: "K-12",
      "1": "K-12",
      "2": "K-12",
      "3": "K-12",
      "4": "K-12",
      "5": "K-12",
      "6": "K-12",
      "7": "K-12",
      "8": "K-12",
      "9": "K-12",
      "10": "K-12",
      "11": "K-12",
      "12": "K-12",
      "14": "14",
    },
    EINT: {
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
      "14": "None",
    },
    RR: {
      PreK: "None",
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
      "14": "None",
    },
    SCI: {
      PreK: "PK-8",
      K: "PK-8",
      "1": "PK-8",
      "2": "PK-8",
      "3": "PK-8",
      "4": "PK-8",
      "5": "PK-8",
      "6": "PK-8",
      "7": "PK-8",
      "8": "PK-8",
      "9": "9-12",
      "10": "9-12",
      "11": "9-12",
      "12": "9-12",
      "14": "14",
    },
    SMI: {
      PreK: "PK-8",
      K: "PK-8",
      "1": "PK-8",
      "2": "PK-8",
      "3": "PK-8",
      "4": "PK-8",
      "5": "PK-8",
      "6": "PK-8",
      "7": "PK-8",
      "8": "PK-8",
      "9": "9-12",
      "10": "9-12",
      "11": "9-12",
      "12": "9-12",
      "14": "14",
    },
  };
  // Get the grade band for the given program and grade
  let gradeBand: string | undefined;
  if (
    programKey in grade_band_map &&
    gradeKey in grade_band_map[programKey as keyof typeof grade_band_map]
  ) {
    gradeBand = grade_band_map[programKey][gradeKey];
  } else {
    console.error("Invalid program or grade");
    return [];
  }
  console.log("Grade Band: ", gradeBand);

  // Query the database for matching programs
  const programs = await ProgramModel.find(
    {
      [`${programKey}.${gradeBand}`]: { $gt: 0 },
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
        url: 1,
        "Main office number": 1,
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

  const centers = [
    { school: "Turning Point", SchoolID: 3284 },
    { school: "Keidan", SchoolID: 9594 },
    { school: "Moses Field", SchoolID: 8951 },
    { school: "Drew", SchoolID: 859 },
    { school: "Jerry White", SchoolID: 9592 },
  ];

  let feederSchools: number[] = [];
  let feederPrograms: number[] = [];
  if (["PreK", "Post-Secondary"].includes(grade)) {
  } else {
    // This is the feeder group of the neighborhood school
    feederSchools = feederGroups.filter((group) => {
      return nhid !== undefined && group.includes(nhid);
    })[0];

    // This will be any school ids that have the desired program in the feeder group
    feederPrograms = programIds.filter((element) =>
      feederSchools.includes(element)
    );
  }

  let assignment = null;
  if (program === "VI") {
    assignment = await $fetch(`/api/schools?SchoolID=176`); // Golightly
  } else if (["RR"].includes(programKey)) {
    assignment = await $fetch(`/api/schools?SchoolID=${nhid}`); // Neighborhood school
  } else if (["SCI", "SMI"].includes(programKey)) {
    if (gradeBand === "PK-8") {
      assignment = await find_nearest_school(lat, lng, [9594, 8951]); // Keidan or Moses Field
    } else if (gradeBand === "9-12") {
      assignment = await $fetch(`/api/schools?SchoolID=9592`); // Jerry White
    } else if (gradeBand === "14") {
      assignment = await $fetch(`/api/schools?SchoolID=859`); // Drew
    } else {
      assignment = [];
    }
  } else if (setting === "Center-Based") {
    if (["PK-5", "6-8", "PK-2", "3-5"].includes(gradeBand)) {
      assignment = await find_nearest_school(lat, lng, [9594, 8951]); // Keidan or Moses Field
    } else if (gradeBand === "9-12") {
      assignment = await $fetch(`/api/schools?SchoolID=9592`); // Jerry White
    } else if (gradeBand === "14") {
      assignment = await $fetch(`/api/schools?SchoolID=859`); // Drew
    }
  } else if (nhid && programIds.includes(nhid)) {
    assignment = await $fetch(`/api/schools?SchoolID=${nhid}`);
  } else if (feederPrograms.length > 0) {
    assignment = await find_nearest_school(lat, lng, feederPrograms);
  } else if (program === "DT") {
    assignment = await find_nearest_school(lat, lng, programIds);
  } else {
    assignment = await find_nearest_school(lat, lng, programIds);
  }
  return assignment;
});
