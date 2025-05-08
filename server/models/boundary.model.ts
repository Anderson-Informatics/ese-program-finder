import mongoose from "mongoose";

const schema: mongoose.Schema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    auto: true,
  },
  SchoolID: Number,
  schoolName: String,
  geometry: {
    type: {
      type: String,
      enum: ["Polygon", "MultiPolygon"],
      required: true,
    },
    coordinates: {
      type: [[[[Number]]]],
      required: true,
    },
  },
  Type: String,
  High_Grade: Number,
  shortName: String,
});

// boundary model
export default mongoose.model("Boundary", schema);
