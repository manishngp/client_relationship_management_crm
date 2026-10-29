
import mongoose from "mongoose";
import Activity from "../models/Activity.js";
import Lead from "../models/Lead.js";
import Customer from "../models/Customer.js";
import User from "../models/User.js";

function isAdmin(req) {
  return req.user.role === "Admin";
}

function activityScope(req) {
  return isAdmin(req)
    ? {}
    : { assignedTo: req.user.userId };
}
async function validateRelatedRecords(req, data) {
  const errors = [];

  if (data.lead) {
    if (!mongoose.isValidObjectId(data.lead)) {
      errors.push("Invalid lead ID.");
    } else {
      const leadFilter = { _id: data.lead };

      if (!isAdmin(req)) {
        leadFilter.assignedTo = req.user._id;
      }

      const lead = await Lead.findOne(leadFilter);

      if (!lead) {
        errors.push("Lead not found or you do not have access to it.");
      }
    }
  }

//   if (data.customer) {
//     if (!mongoose.isValidObjectId(data.customer)) {
//       errors.push("Invalid customer ID.");
//     } else {
//       const customerFilter = { _id: data.customer };

//       if (!isAdmin(req)) {
//         customerFilter.assignedTo = req.user._id;
//       }

//       const customer = await Customer.findOne(customerFilter);

//       if (!customer) {
//         errors.push(
//           "Customer not found or you do not have access to it."
//         );
//       }
//     }
//   }
if (data.customer) {
 const customer = await Customer.findById(data.customer);

if (!customer) {
  errors.push("Customer not found.");
} else if (
  !isAdmin(req) &&
  customer.assignedTo?.toString() !== req.user.userId
) {
  errors.push("Customer belongs to another user.");
}
}

  if (data.assignedTo && isAdmin(req)) {
    if (!mongoose.isValidObjectId(data.assignedTo)) {
      errors.push("Invalid assigned user ID.");
    } else {
      const user = await User.findById(data.assignedTo);

      if (!user) {
        errors.push("Assigned user does not exist.");
      }
    }
  }

  if (errors.length) {
    const error = new Error(errors.join(" "));
    error.statusCode = 400;
    throw error;
  }
}



function handleError(res, error) {
  console.error("Activity controller error:", error);

  if (error.statusCode) {
    return res.status(error.statusCode).json({
      message: error.message,
    });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: error.message,
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      message: "Invalid activity ID or related record ID.",
    });
  }

  return res.status(500).json({
    message: "Server error while processing activity.",
  });
}

// GET /api/activities
export async function getActivities(req, res) {
  try {
    const {
      search = "",
      status,
      type,
      due,
      page = 1,
      limit = 10,
      sortBy = "dueDate",
      order = "asc",
    } = req.query;

    const filter = { ...activityScope(req) };

    if (status && ["Pending", "Completed"].includes(status)) {
      filter.status = status;
    }

    if (
      type &&
      ["Call", "Meeting", "Email", "Follow-up", "Demo", "Other"].includes(type)
    ) {
      filter.type = type;
    }

    if (due === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      filter.dueDate = { $gte: start, $lt: end };
    } else if (due === "overdue") {
      filter.dueDate = { $lt: new Date() };
      filter.status = "Pending";
    }

    if (search.trim()) {
      const regex = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );

      filter.$or = [
        { title: regex },
        { description: regex },
      ];
    }

    const allowedSortFields = ["dueDate", "createdAt", "title", "status"];
    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "dueDate";

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 10));

    const [activities, total] = await Promise.all([
      Activity.find(filter)
        .populate("lead", "name company email")
        .populate("customer", "name company email")
        .populate("assignedTo", "name email role")
        .sort({ [safeSortBy]: order === "desc" ? -1 : 1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit),
      Activity.countDocuments(filter),
    ]);

    return res.json({
      activities,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
}

// GET /api/activities/:id
export async function getActivityById(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid activity ID." });
    }

    const activity = await Activity.findOne({
      _id: req.params.id,
      ...activityScope(req),
    })
      .populate("lead", "name company email")
      .populate("customer", "name company email")
      .populate("assignedTo", "name email role");

    if (!activity) {
      return res.status(404).json({ message: "Activity not found." });
    }

    return res.json(activity);
  } catch (error) {
    return handleError(res, error);
  }
}

// POST /api/activities

export async function createActivity(req, res) {
  try {
    const {
      type,
      title,
      description,
      lead,
      customer,
      dueDate,
      status,
      assignedTo,
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        message: "Activity title is required.",
      });
    }

    if (!dueDate || Number.isNaN(Date.parse(dueDate))) {
      return res.status(400).json({
        message: "A valid due date is required.",
      });
    }

    if (lead && customer) {
      return res.status(400).json({
        message: "Link an activity to a lead or a customer, not both.",
      });
    }

    if (status && !["Pending", "Completed"].includes(status)) {
      return res.status(400).json({
        message: "Invalid activity status.",
      });
    }

    const data = {
      type: type || "Follow-up",
      title: title.trim(),
      description: description || "",
      lead: lead || null,
      customer: customer || null,
      dueDate,
      status: status || "Pending",
      assignedTo:
        req.user.role === "Admin" && assignedTo
          ? assignedTo
          : req.user.userId,
    };

    await validateRelatedRecords(req, data);

    const activity = await Activity.create(data);

    const populated = await Activity.findById(activity._id)
      .populate("lead", "name company email")
      .populate("customer", "name company email")
      .populate("assignedTo", "name email role");

    return res.status(201).json(populated);
  } catch (error) {
    return handleError(res, error);
  }
}


// PATCH /api/activities/:id
export async function updateActivity(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid activity ID." });
    }

    const activity = await Activity.findOne({
      _id: req.params.id,
      ...activityScope(req),
    });

    if (!activity) {
      return res.status(404).json({ message: "Activity not found." });
    }

    const allowedFields = [
      "type",
      "title",
      "description",
      "lead",
      "customer",
      "dueDate",
      "status",
    ];

    if (isAdmin(req)) {
      allowedFields.push("assignedTo");
    }

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        activity[field] = req.body[field] || (
          ["lead", "customer"].includes(field) ? null : req.body[field]
        );
      }
    }

    if (!activity.title?.trim()) {
      return res.status(400).json({
        message: "Activity title is required.",
      });
    }

    if (!activity.dueDate || Number.isNaN(Date.parse(activity.dueDate))) {
      return res.status(400).json({
        message: "A valid due date is required.",
      });
    }

    if (activity.lead && activity.customer) {
      return res.status(400).json({
        message: "Link an activity to a lead or a customer, not both.",
      });
    }

    await validateRelatedRecords(req, {
      lead: activity.lead,
      customer: activity.customer,
      assignedTo: activity.assignedTo,
    });

    await activity.save();

    const populated = await Activity.findById(activity._id)
      .populate("lead", "name company email")
      .populate("customer", "name company email")
      .populate("assignedTo", "name email role");

    return res.json(populated);
  } catch (error) {
    return handleError(res, error);
  }
}

// DELETE /api/activities/:id
export async function deleteActivity(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid activity ID." });
    }

    const activity = await Activity.findOneAndDelete({
      _id: req.params.id,
      ...activityScope(req),
    });

    if (!activity) {
      return res.status(404).json({ message: "Activity not found." });
    }

    return res.json({ message: "Activity deleted successfully." });
  } catch (error) {
    return handleError(res, error);
  }
}
