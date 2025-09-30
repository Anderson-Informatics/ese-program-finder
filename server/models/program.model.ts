import mongoose from "mongoose";

const schema: mongoose.Schema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    auto: true,
  },
  SchoolID: Number,
  School: String,
  "High School Feeder": String,
  "East/West": String,
  ASD: Object,
  MICI: Object,
  ECSE: Object,
  MOCI: Object,
  POHI: Object,
  EI: Object,
  VI: Object,
  DHH: Object,
  ProgramSummary: {
    SchoolID: Number,
    Program: String,
    GradeBand: String,
    ProgramCount: Number,
    Capacity: Number,
    Remaining: Number,
    Enrolled: Number,
  },
});

// programs model
export default mongoose.model("Program", schema);
