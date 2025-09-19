import mongoose from "mongoose";

const schema: mongoose.Schema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    auto: true,
  },
  SchoolID: String,
  SchoolName: String,
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  Type: String,
  ShortName: String,
  Capacity: Object,
  Att_Folder: String,
  url: String,
  "Main office number": String,
  Distance: Number,
});

// schools model
export default mongoose.model("School", schema);
