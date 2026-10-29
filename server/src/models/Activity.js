
import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Call", "Meeting", "Email", "Follow-up", "Demo", "Other"],
      required: [true, "Activity type is required"],
      default: "Follow-up",
    },
    title: {
      type: String,
      required: [true, "Activity title is required"],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    status: {
      type: String,
      enum: ["Pending", "Completed"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

activitySchema.index({ assignedTo: 1, dueDate: 1, status: 1 });

export default mongoose.model("Activity", activitySchema);
