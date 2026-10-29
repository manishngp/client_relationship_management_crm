
import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import User from "../models/User.js";

const isAdmin = (req) => req.user.role === "Admin";

const customerScope = (req) =>
  isAdmin(req) ? {} : { assignedTo: req.user.userId };

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const editableFields = [
  "name",
  "email",
  "phone",
  "company",
  "notes",
];

// GET /api/customers
export const getCustomers = async (req, res) => {
  try {
    const {
      search = "",
      page = "1",
      limit = "10",
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    const allowedSortFields = [
      "name",
      "company",
      "createdAt",
      "updatedAt",
    ];

    const sortField = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const filter = { ...customerScope(req) };

    if (search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), "i");

      filter.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
        { company: regex },
      ];
    }

    const [customers, total] = await Promise.all([
      Customer.find(filter)
        .populate("assignedTo", "name email role")
        .sort({ [sortField]: order === "asc" ? 1 : -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize),
      Customer.countDocuments(filter),
    ]);

    return res.status(200).json({
      customers,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Get customers error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/customers
export const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, company, notes, assignedTo } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "Customer name is required",
      });
    }

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

    const customer = await Customer.create({
      name: name.trim(),
      email,
      phone,
      company,
      notes,
      assignedTo: targetUserId,
    });

    await customer.populate("assignedTo", "name email role");

    return res.status(201).json({
      message: "Customer created successfully",
      customer,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    console.error("Create customer error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/customers/:id
export const getCustomerById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    const customer = await Customer.findOne({
      _id: req.params.id,
      ...customerScope(req),
    }).populate("assignedTo", "name email role");

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    return res.status(200).json({ customer });
  } catch (error) {
    console.error("Get customer error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /api/customers/:id
export const updateCustomer = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    const updates = {};

    for (const field of editableFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.name !== undefined) {
      if (typeof updates.name !== "string" || !updates.name.trim()) {
        return res.status(400).json({
          message: "Customer name cannot be empty",
        });
      }

      updates.name = updates.name.trim();
    }

    if (updates.email !== undefined) {
      if (typeof updates.email !== "string") {
        return res.status(400).json({ message: "Invalid email" });
      }

      updates.email = updates.email.trim().toLowerCase();
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

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, ...customerScope(req) },
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("assignedTo", "name email role");

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    return res.status(200).json({
      message: "Customer updated successfully",
      customer,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    console.error("Update customer error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/customers/:id
export const deleteCustomer = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    const customer = await Customer.findOneAndDelete({
      _id: req.params.id,
      ...customerScope(req),
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    return res.status(200).json({
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Delete customer error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};
