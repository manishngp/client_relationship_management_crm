
import Lead from "../models/Lead.js";
import Customer from "../models/Customer.js";
import Deal from "../models/Deal.js";
import Activity from "../models/Activity.js";

function getRecordScope(req) {
  return req.user.role === "Admin"
    ? {}
    : { assignedTo: req.user.userId };
}

export async function getDashboard(req, res) {
  try {
    const scope = getRecordScope(req);

    // Count leads and customers
    const [
      totalLeads,
      totalCustomers,
      leadsByStatus,
      dealsByStage,
      activeDeals,
      wonDeals,
      recentLeads,
      recentDeals,
    ] = await Promise.all([
      Lead.countDocuments(scope),

      Customer.countDocuments(scope),

      Lead.aggregate([
        { $match: scope },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Deal.aggregate([
        { $match: scope },
        {
          $group: {
            _id: "$stage",
            count: { $sum: 1 },
            value: { $sum: "$value" },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Deal.find({
        ...scope,
        stage: { $nin: ["Won", "Lost"] },
      }).select("value"),

      Deal.find({
        ...scope,
        stage: "Won",
      }).select("value"),

      Lead.find(scope)
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name company status source createdAt")
        .populate("assignedTo", "name"),

      Deal.find(scope)
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title value stage expectedCloseDate createdAt")
        .populate("customer", "name company")
        .populate("assignedTo", "name"),
    ]);

    const activePipelineValue = activeDeals.reduce(
      (total, deal) => total + (Number(deal.value) || 0),
      0
    );

    const wonRevenue = wonDeals.reduce(
      (total, deal) => total + (Number(deal.value) || 0),
      0
    );

    // Use the server's local calendar date for today's activities.
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    const activityScope = {
      ...scope,
      status: "Pending",
    };

    const [pendingToday, overdueActivities] = await Promise.all([
      Activity.countDocuments({
        ...activityScope,
        dueDate: {
          $gte: startOfToday,
          $lt: startOfTomorrow,
        },
      }),

      Activity.countDocuments({
        ...activityScope,
        dueDate: { $lt: startOfToday },
      }),
    ]);

    return res.status(200).json({
      summary: {
        totalLeads,
        totalCustomers,
        activeDeals: activeDeals.length,
        wonDeals: wonDeals.length,
        activePipelineValue,
        wonRevenue,
        pendingToday,
        overdueActivities,
      },
      leadsByStatus,
      dealsByStage,
      recentLeads,
      recentDeals,
    });
  } catch (error) {
    console.error("Dashboard controller error:", error);

    return res.status(500).json({
      message: "Unable to load dashboard data.",
    });
  }
}
