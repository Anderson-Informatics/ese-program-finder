import mongoose from "mongoose";

const schema: mongoose.Schema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    auto: true,
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BoundaryJob",
    index: true,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
  input: mongoose.Schema.Types.Mixed,
  lat: Number,
  lng: Number,
  grade: Number,
  assignments: [mongoose.Schema.Types.Mixed],
  error: { type: String, default: null },
  processed: { type: Boolean, default: false },
  processedAt: Date,
});

schema.index({ jobId: 1, index: 1 });
schema.index({ jobId: 1, processed: 1 });

export default mongoose.model("BoundaryJobResult", schema);
