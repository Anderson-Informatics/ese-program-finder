import ProgramModel from "~~/server/models/program.model";
import SchoolModel from "~~/server/models/school.model";
import SummaryModel from "~~/server/models/summary.model";

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
    "Birth to 3": "B3",
    "PreK": "PreK",
    "Kindergarten": "K",
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

  if (["Birth to 3", "PreK", "Post-Secondary"].includes(grade)) {
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
      B3: "None",
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
      B3: "None",
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
      B3: "None",
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
      B3: "None",
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
      B3: "None",
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
      B3: "None",
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
      B3: "None",
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
      B3: "None",
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
      B3: "None",
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
      B3: "None",
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
      B3: "None",
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
      B3: "Birth to 3",
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
    RR: {
      B3: "None",
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
      B3: "None",
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
      B3: "None",
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
  ) as Array<{ SchoolID: number }>;
  // Turn the program info into array of school IDs
  const programIds = programs.map((item) => item.SchoolID as number);
  console.log("Program IDs: ", programIds);
  const programIdStrings = programs.map((item) => item.SchoolID.toString());

  // Now for the fun logic of making the program assignment
    const find_nearest_school = async (
    lat: number,
    lng: number,
    schids: string[]
  ): Promise<any[]> => {
    const coordinates: [number, number] = [ Number(lng), Number(lat) ];
    let nearest = await SchoolModel.aggregate([
        {
            '$geoNear': {
            'near': {
                'type': 'Point', 
                'coordinates': coordinates
            }, 
            'key': 'location', 
            'spherical': true, 
            'distanceField': 'Distance', 
            'distanceMultiplier': 0.000621371
            }
        }, {
            '$match': {
            'SchoolID': {
                '$in': schids
            }
            }
        }, {
            '$project': {
                'location': 1,
                'SchoolID': 1, 
                'School Name': 1,
                'Address': 1,
                'Main office number': 1,
                'Type': 1,
                'url': 1,
                'Distance': 1
            }
        }, {
            '$sort': {
            'Distance': 1
            }
        }, {
          '$limit': 1
        }
        ]);
      return nearest;
    };

  // This will return the full list of available programs with their distance
  const find_programs = async (
    lat: number,
    lng: number,
    schids: string[]
  ): Promise<any[]> => {
    const coordinates: [number, number] = [ Number(lng), Number(lat) ];
    let available = await SchoolModel.aggregate([
        {
            '$geoNear': {
            'near': {
                'type': 'Point', 
                'coordinates': coordinates
            }, 
            'key': 'location', 
            'spherical': true, 
            'distanceField': 'Distance', 
            'distanceMultiplier': 0.000621371
            }
        }, {
            '$match': {
            'SchoolID': {
                '$in': schids
            }
            }
        }, {
            '$project': {
                'location': 1,
                'SchoolID': 1, 
                'School Name': 1,
                'Address': 1,
                'Main office number': 1,
                'Type': 1,
                'url': 1,
                'Distance': 1
            }
        }, {
            '$sort': {
            'Distance': 1
            }
        }
        ]);
    return available;
  };

  // These are the full feeder groups of the neighborhood schools
  const feederGroups = [
    [18, 4, 103, 456, 546, 853, 925, 939, 1084, 1362, 1438, 2341, 3640],
    [32, 5, 2377, 3130, 9341],
    [617, 975, 6103],
    [902, 3737, 4349, 4406, 5553, 9991],
    [1043, 176, 446, 689, 1803, 2058, 2703, 3558, 7581], // King the same as SE
    [1189, 542, 2390, 4062, 9992, 9994],
    [1634, 781, 1134, 2036, 3717, 4319, 9125],
    [2644, 168, 857, 1518, 1552, 2969, 3420, 4292, 7633],
    [2778, 468, 4156, 4413],
    [3015, 880, 1493, 2431, 2708],
    [3540, 176, 446, 689, 1803, 2058, 2703, 3558, 7581],
    [4477, 238, 277, 858, 860, 2383, 2448, 2669, 3123, 1574],
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
  if (["Birth to 3", "PreK", "Post-Secondary"].includes(grade)) {
    // Do nothing, no neighborhood schools for these grades
  } else {
    // This is the feeder group of the neighborhood school
    feederSchools = feederGroups.filter((group) => {
      return nhid !== undefined && group.includes(nhid);
    })[0];
    console.log("Feeder Schools: ", feederSchools);

    // This will be any school ids that have the desired program in the feeder group
    feederPrograms = programIds.filter((element) =>
      feederSchools.includes(element)
    );
  }

  let assignment = null;
  if (["RR"].includes(programKey)) {
    assignment = await $fetch(`/api/schools?SchoolID=${nhid}`); // Neighborhood school
  } else if (["EINT"].includes(programKey)) {
    assignment = await $fetch(`/api/schools?SchoolID=209594`); // EIDC
  } else if (["SCI", "SMI"].includes(programKey)) {
    if (gradeBand === "PK-8") {
      assignment = await find_nearest_school(lat, lng, ['9594', '8951']); // Keidan or Moses Field
    } else if (gradeBand === "9-12") {
      assignment = await $fetch(`/api/schools?SchoolID=9592`); // Jerry White
    } else if (gradeBand === "14") {
      assignment = await $fetch(`/api/schools?SchoolID=859`); // Drew
    } else {
      assignment = [];
    }
  } else if (setting === "Center-Based") {
    if (["PK-5", "6-8", "PK-2", "3-5"].includes(gradeBand)) {
      assignment = await find_nearest_school(lat, lng, ['9594', '8951']); // Keidan or Moses Field
    } else if (gradeBand === "9-12") {
      assignment = await $fetch(`/api/schools?SchoolID=9592`); // Jerry White
    } else if (gradeBand === "14") {
      assignment = await $fetch(`/api/schools?SchoolID=859`); // Drew
    }
  } else if (nhid && programIds.includes(nhid)) {
    assignment = await $fetch(`/api/schools?SchoolID=${nhid}`);
  } else if (feederPrograms.length > 0) {
    assignment = await find_nearest_school(lat, lng, feederPrograms.map((item) => item.toString()));
  } else if (program === "DT") {
    assignment = await find_nearest_school(lat, lng, programIdStrings);
  } else {
    assignment = await find_nearest_school(lat, lng, programIdStrings);
  }

  let available = null;
  if (programIdStrings) {
    available = await find_programs(lat, lng, programIdStrings);
  }
  if (assignment !== null && available !== null) {
    available = available.filter(function( obj ) {
      return obj.SchoolID !== assignment[0].SchoolID;
    });
  }

  // Start to retrieve program summary data for available programs
  if (available && available.length > 0) {
    for (let i = 0; i < available.length; i++) {
      const school = available[i];
      try {
        const summary = await SummaryModel.findOne(
          {
            SchoolID: parseInt(school.SchoolID),
            Program: programKey,
            GradeBand: gradeBand,
          },
          { _id: 0, __v: 0 }
        ).lean();
        if (summary) {
          school.ProgramSummary = summary;
        } else {
          school.ProgramSummary = {
            SchoolID: parseInt(school.SchoolID),
            Program: programKey,
            GradeBand: gradeBand,
            ProgramCount: 0,
            Capacity: 0,
            Remaining: 0,
            Enrolled: 0,
          };
        }
      } catch (error) {
        console.error(
          `Error retrieving program summary for SchoolID ${school.SchoolID}: `,
          error );
        school.ProgramSummary = {
          SchoolID: parseInt(school.SchoolID),
          Program: programKey,
          GradeBand: gradeBand,
          ProgramCount: 0,
          Capacity: 0,
          Remaining: 0,
          Enrolled: 0,
        };
      }
    }
  }

  return available;
});
