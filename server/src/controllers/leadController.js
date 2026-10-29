import mongoose from "mongoose";
import Lead from "../models/Lead.js";
import User from "../models/User.js";
import Customer from "../models/Customer.js";

const allowedStatuses = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal",
  "Won",
  "Lost",
];

const editableFields = [
  "name",
  "email",
  "phone",
  "company",
  "source",
  "status",
  "notes",
];

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isAdmin = (req) => req.user.role === "Admin";

const leadScope = (req) =>
  isAdmin(req) ? {} : { assignedTo: req.user.userId };

// GET /api/leads
export const getLeads = async (req, res) => {
  try {
    const {
      search = "",
      status,
      assignedTo,
      sortBy = "createdAt",
      order = "desc",
      page = "1",
      limit = "10",
    } = req.query;

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid lead status" });
    }

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(limit, 10) || 10)
    );

    const allowedSortFields = [
      "name",
      "company",
      "status",
      "createdAt",
      "updatedAt",
    ];

    const sortField = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const sortOrder = order === "asc" ? 1 : -1;

    const filter = { ...leadScope(req) };

    if (status) filter.status = status;

    if (isAdmin(req) && assignedTo) {
      if (!mongoose.isValidObjectId(assignedTo)) {
        return res.status(400).json({
          message: "Invalid assignedTo user ID",
        });
      }

      filter.assignedTo = assignedTo;
    }

    if (search.trim()) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), "i");

      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { company: searchRegex },
        { phone: searchRegex },
      ];
    }

    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .populate("assignedTo", "name email role")
        .sort({ [sortField]: sortOrder })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize),
      Lead.countDocuments(filter),
    ]);

    return res.status(200).json({
      leads,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Get leads error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/leads
export const createLead = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      source,
      status,
      notes,
      assignedTo,
    } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "Lead name is required",
      });
    }

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid lead status",
      });
    }

    // Sales Executives can only assign leads to themselves.
    const targetUserId = isAdmin(req)
      ? assignedTo || req.user.userId
      : req.user.userId;

    if (!mongoose.isValidObjectId(targetUserId)) {
      return res.status(400).json({
        message: "Invalid assigned user ID",
      });
    }

    const userExists = await User.exists({ _id: targetUserId });

    if (!userExists) {
      return res.status(400).json({
        message: "Assigned user does not exist",
      });
    }

    const lead = await Lead.create({
      name: name.trim(),
      email,
      phone,
      company,
      source,
      status,
      notes,
      assignedTo: targetUserId,
    });

    const populatedLead = await lead.populate(
      "assignedTo",
      "name email role"
    );

    return res.status(201).json({
      message: "Lead created successfully",
      lead: populatedLead,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    console.error("Create lead error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/leads/:id
export const getLeadById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid lead ID" });
    }

    const lead = await Lead.findOne({
      _id: req.params.id,
      ...leadScope(req),
    }).populate("assignedTo", "name email role");

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    return res.status(200).json({ lead });
  } catch (error) {
    console.error("Get lead error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /api/leads/:id
export const updateLead = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid lead ID" });
    }

    const updates = {};

    for (const field of editableFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (req.body.assignedTo !== undefined && isAdmin(req)) {
      if (!mongoose.isValidObjectId(req.body.assignedTo)) {
        return res.status(400).json({
          message: "Invalid assigned user ID",
        });
      }

      const userExists = await User.exists({
        _id: req.body.assignedTo,
      });

      if (!userExists) {
        return res.status(400).json({
          message: "Assigned user does not exist",
        });
      }

      updates.assignedTo = req.body.assignedTo;
    }

    if (updates.name !== undefined) {
      if (
        typeof updates.name !== "string" ||
        !updates.name.trim()
      ) {
        return res.status(400).json({
          message: "Lead name cannot be empty",
        });
      }

      updates.name = updates.name.trim();
    }

    if (
      updates.status !== undefined &&
      !allowedStatuses.includes(updates.status)
    ) {
      return res.status(400).json({
        message: "Invalid lead status",
      });
    }

    if (updates.email !== undefined) {
      updates.email =
        typeof updates.email === "string"
          ? updates.email.trim().toLowerCase()
          : updates.email;
    }

    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, ...leadScope(req) },
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("assignedTo", "name email role");

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    return res.status(200).json({
      message: "Lead updated successfully",
      lead,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    console.error("Update lead error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/leads/:id
export const deleteLead = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid lead ID" });
    }

    const lead = await Lead.findOneAndDelete({
      _id: req.params.id,
      ...leadScope(req),
    });

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    return res.status(200).json({
      message: "Lead deleted successfully",
    });
  } catch (error) {
    console.error("Delete lead error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/leads/:id/convert
export const convertLeadToCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid lead ID" });
    }

    const lead = await Lead.findOne({
      _id: id,
      ...leadScope(req),
    });

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // If already converted, return the existing customer.
    if (lead.convertedToCustomer) {
      const existingCustomer = await Customer.findById(
        lead.convertedToCustomer
      );

      if (existingCustomer) {
        return res.status(409).json({
          message: "This lead has already been converted",
          customer: existingCustomer,
        });
      }
    }

    // Also check the unique sourceLead relationship.
    const existingCustomer = await Customer.findOne({ sourceLead: lead._id });

    if (existingCustomer) {
      lead.convertedToCustomer = existingCustomer._id;
      lead.convertedAt = lead.convertedAt || new Date();
      await lead.save();

      return res.status(409).json({
        message: "This lead has already been converted",
        customer: existingCustomer,
      });
    }

    const customer = await Customer.create({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      notes: lead.notes,
      assignedTo: lead.assignedTo,
      sourceLead: lead._id,
    });

    lead.convertedToCustomer = customer._id;
    lead.convertedAt = new Date();
    await lead.save();

    return res.status(201).json({
      message: "Lead converted to customer successfully",
      customer,
    });
  } catch (error) {
    // Handles concurrent attempts to convert the same lead.
    if (error.code === 11000) {
      const customer = await Customer.findOne({
        sourceLead: req.params.id,
      });

      return res.status(409).json({
        message: "This lead has already been converted",
        customer,
      });
    }

    console.error("Convert lead error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};