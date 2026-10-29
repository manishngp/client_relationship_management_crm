
import mongoose from "mongoose";
import Deal from "../models/Deal.js";
import Customer from "../models/Customer.js";
import User from "../models/User.js";

const stages = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost",
];

const isAdmin = (req) => req.user.role === "Admin";

const dealScope = (req) =>
  isAdmin(req) ? {} : { assignedTo: req.user.userId };

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const editableFields = [
  "title",
  "customer",
  "value",
  "stage",
  "probability",
  "expectedCloseDate",
];

// GET /api/deals
export const getDeals = async (req, res) => {
  try {
    const {
      search = "",
      stage,
      page = "1",
      limit = "10",
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    if (stage && !stages.includes(stage)) {
      return res.status(400).json({ message: "Invalid deal stage" });
    }

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    const allowedSortFields = [
      "title",
      "value",
      "stage",
      "probability",
      "expectedCloseDate",
      "createdAt",
      "updatedAt",
    ];

    const sortField = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const filter = { ...dealScope(req) };

    if (stage) filter.stage = stage;

    if (search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), "i");
      const matchingCustomers = await Customer.find({
        $or: [{ name: regex }, { company: regex }, { email: regex }],
        ...(isAdmin(req) ? {} : { assignedTo: req.user.userId }),
      }).select("_id");

      filter.$or = [
        { title: regex },
        { customer: { $in: matchingCustomers.map((c) => c._id) } },
      ];
    }

    const [deals, total] = await Promise.all([
      Deal.find(filter)
        .populate("customer", "name email company")
        .populate("assignedTo", "name email role")
        .sort({ [sortField]: order === "asc" ? 1 : -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize),
      Deal.countDocuments(filter),
    ]);

    return res.status(200).json({
      deals,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Get deals error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/deals
export const createDeal = async (req, res) => {
  try {
    const {
      title,
      customer,
      value,
      stage,
      probability,
      expectedCloseDate,
      assignedTo,
    } = req.body;

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ message: "Deal title is required" });
    }

    if (
      value === undefined ||
      value === null ||
      value === "" ||
      !Number.isFinite(Number(value)) ||
      Number(value) < 0
    ) {
      return res.status(400).json({
        message: "Deal value must be a non-negative number",
      });
    }

    if (stage && !stages.includes(stage)) {
      return res.status(400).json({ message: "Invalid deal stage" });
    }

    if (
      probability !== undefined &&
      (!Number.isFinite(Number(probability)) ||
        Number(probability) < 0 ||
        Number(probability) > 100)
    ) {
      return res.status(400).json({
        message: "Probability must be between 0 and 100",
      });
    }

    if (!mongoose.isValidObjectId(customer)) {
      return res.status(400).json({ message: "Valid customer ID is required" });
    }

    const targetUserId = isAdmin(req)
      ? assignedTo || req.user.userId
      : req.user.userId;

    if (!mongoose.isValidObjectId(targetUserId)) {
      return res.status(400).json({ message: "Invalid assigned user ID" });
    }

    const [customerDoc, userExists] = await Promise.all([
      Customer.findOne({
        _id: customer,
        ...(isAdmin(req) ? {} : { assignedTo: req.user.userId }),
      }),
      User.exists({ _id: targetUserId }),
    ]);

    if (!customerDoc) {
      return res.status(400).json({
        message: "Customer does not exist or is not accessible",
      });
    }

    if (!userExists) {
      return res.status(400).json({ message: "Assigned user does not exist" });
    }

    const deal = await Deal.create({
      title: title.trim(),
      customer,
      value: Number(value),
      stage,
      probability,
      expectedCloseDate: expectedCloseDate || null,
      assignedTo: targetUserId,
    });

    await deal.populate([
      { path: "customer", select: "name email company" },
      { path: "assignedTo", select: "name email role" },
    ]);

    return res.status(201).json({
      message: "Deal created successfully",
      deal,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    console.error("Create deal error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/deals/:id
export const getDealById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid deal ID" });
    }

    const deal = await Deal.findOne({
      _id: req.params.id,
      ...dealScope(req),
    }).populate([
      { path: "customer", select: "name email phone company" },
      { path: "assignedTo", select: "name email role" },
    ]);

    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    return res.status(200).json({ deal });
  } catch (error) {
    console.error("Get deal error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /api/deals/:id
export const updateDeal = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid deal ID" });
    }

    const updates = {};

    for (const field of editableFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.title !== undefined) {
      if (typeof updates.title !== "string" || !updates.title.trim()) {
        return res.status(400).json({ message: "Deal title cannot be empty" });
      }
      updates.title = updates.title.trim();
    }

    if (updates.stage !== undefined && !stages.includes(updates.stage)) {
      return res.status(400).json({ message: "Invalid deal stage" });
    }

    if (updates.value !== undefined) {
      if (
        updates.value === "" ||
        !Number.isFinite(Number(updates.value)) ||
        Number(updates.value) < 0
      ) {
        return res.status(400).json({
          message: "Deal value must be a non-negative number",
        });
      }
      updates.value = Number(updates.value);
    }

    if (updates.probability !== undefined) {
      if (
        !Number.isFinite(Number(updates.probability)) ||
        Number(updates.probability) < 0 ||
        Number(updates.probability) > 100
      ) {
        return res.status(400).json({
          message: "Probability must be between 0 and 100",
        });
      }
      updates.probability = Number(updates.probability);
    }

    if (updates.customer !== undefined) {
      if (!mongoose.isValidObjectId(updates.customer)) {
        return res.status(400).json({ message: "Invalid customer ID" });
      }

      const customerExists = await Customer.findOne({
        _id: updates.customer,
        ...(isAdmin(req) ? {} : { assignedTo: req.user.userId }),
      });

      if (!customerExists) {
        return res.status(400).json({
          message: "Customer does not exist or is not accessible",
        });
      }
    }

    if (updates.expectedCloseDate !== undefined) {
      if (updates.expectedCloseDate === "") {
        updates.expectedCloseDate = null;
      } else if (Number.isNaN(Date.parse(updates.expectedCloseDate))) {
        return res.status(400).json({
          message: "Invalid expected close date",
        });
      }
    }

    // Only Admins can reassign a deal.
    if (req.body.assignedTo !== undefined && isAdmin(req)) {
      if (!mongoose.isValidObjectId(req.body.assignedTo)) {
        return res.status(400).json({ message: "Invalid assigned user ID" });
      }

      const userExists = await User.exists({ _id: req.body.assignedTo });

      if (!userExists) {
        return res.status(400).json({ message: "Assigned user does not exist" });
      }

      updates.assignedTo = req.body.assignedTo;
    }

    const deal = await Deal.findOneAndUpdate(
      { _id: req.params.id, ...dealScope(req) },
      { $set: updates },
      { new: true, runValidators: true }
    ).populate([
      { path: "customer", select: "name email company" },
      { path: "assignedTo", select: "name email role" },
    ]);

    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    return res.status(200).json({
      message: "Deal updated successfully",
      deal,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    console.error("Update deal error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/deals/:id
export const deleteDeal = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid deal ID" });
    }

    const deal = await Deal.findOneAndDelete({
      _id: req.params.id,
      ...dealScope(req),
    });

    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    return res.status(200).json({ message: "Deal deleted successfully" });
  } catch (error) {
    console.error("Delete deal error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};
