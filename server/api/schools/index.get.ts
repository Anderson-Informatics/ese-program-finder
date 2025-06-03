import SchoolModel from "~~/server/models/school.model";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  console.log("query", query);
  const schools = await SchoolModel.find(query, {
    SchoolID: 1,
    "School Name": 1,
    Address: 1,
    location: 1,
    Type: 1,
    ShortName: 1,
    url: 1,
    "Main office number": 1,
  });

  return schools;
});
