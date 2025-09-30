import mongoose from "mongoose";

const schema: mongoose.Schema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    auto: true,
  },
  SchoolID: Number,
  Program: String,
  GradeBand: String,
  ProgramCount: Number,
  Capacity: Number,
  Remaining: Number,
  Enrolled: Number,
});

// program summary model
export default mongoose.model("Summary", schema);
