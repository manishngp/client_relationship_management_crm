
import mongoose from "mongoose";

const dealSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Deal title is required"],
      trim: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
    },
    value: {
      type: Number,
      required: [true, "Deal value is required"],
      min: [0, "Deal value cannot be negative"],
    },
    stage: {
      type: String,
      enum: [
        "New",
        "Contacted",
        "Qualified",
        "Proposal",
        "Negotiation",
        "Won",
        "Lost",
      ],
      default: "New",
    },
    probability: {
      type: Number,
      min: 0,
      max: 100,
      default: 10,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expectedCloseDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Deal", dealSchema);
