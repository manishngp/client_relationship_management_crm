
// import "dotenv/config";
// import mongoose from "mongoose";

// import User from "./src/models/User.js";
// import Lead from "./src/models/Lead.js";
// import Customer from "./src/models/Customer.js";
// import Deal from "./src/models/Deal.js";
// import Activity from "./src/models/Activity.js";

// const demoCompanies = [
//   "Northstar Digital",
//   "BluePeak Technologies",
//   "UrbanNest Realty",
//   "FinEdge Consulting",
//   "GreenRoute Logistics",
// ];

// async function seedDemoData() {
//   try {
//     if (!process.env.MONGO_URI) {
//       throw new Error("MONGO_URI is missing from your .env file.");
//     }

//     await mongoose.connect(process.env.MONGO_URI);
//     console.log("Connected to MongoDB");

//     const user = process.env.DEMO_USER_EMAIL
//       ? await User.findOne({
//           email: process.env.DEMO_USER_EMAIL,
//         })
//       : await User.findOne();

//     if (!user) {
//       throw new Error(
//         "No user found. Register and log in first, then set DEMO_USER_EMAIL in .env."
//       );
//     }

//     const ownerId = user._id;

//     console.log(`Assigning demo records to: ${user.email}`);

//     // Remove records created by an earlier run of this demo.
//     const oldLeads = await Lead.find({
//       company: { $in: demoCompanies },
//     }).select("_id");

//     const oldLeadIds = oldLeads.map((lead) => lead._id);

//     const oldCustomers = await Customer.find({
//       $or: [
//         { company: { $in: demoCompanies } },
//         { sourceLead: { $in: oldLeadIds } },
//       ],
//     }).select("_id");

//     const oldCustomerIds = oldCustomers.map(
//       (customer) => customer._id
//     );

//     await Activity.deleteMany({
//       $or: [
//         { title: /^DEMO:/ },
//         { lead: { $in: oldLeadIds } },
//         { customer: { $in: oldCustomerIds } },
//       ],
//     });

//     await Deal.deleteMany({
//       $or: [
//         { title: /^DEMO:/ },
//         { customer: { $in: oldCustomerIds } },
//       ],
//     });

//     await Customer.deleteMany({
//       _id: { $in: oldCustomerIds },
//     });

//     await Lead.deleteMany({
//       _id: { $in: oldLeadIds },
//     });

//     // LEADS
//     const leads = await Lead.create([
//       {
//         name: "Aarav Mehta",
//         email: "aarav.mehta@example.com",
//         phone: "9876501001",
//         company: demoCompanies[0],
//         source: "Website",
//         status: "Qualified",
//         assignedTo: ownerId,
//         notes: "Interested in a customer portal and CRM integration.",
//       },
//       {
//         name: "Priya Sharma",
//         email: "priya.sharma@example.com",
//         phone: "9876501002",
//         company: demoCompanies[1],
//         source: "Referral",
//         status: "Proposal",
//         assignedTo: ownerId,
//         notes: "Proposal requested for a six-month implementation.",
//       },
//       {
//         name: "Rohan Kulkarni",
//         email: "rohan.kulkarni@example.com",
//         phone: "9876501003",
//         company: demoCompanies[2],
//         source: "LinkedIn",
//         status: "Contacted",
//         assignedTo: ownerId,
//         notes: "Needs a property lead management solution.",
//       },
//       {
//         name: "Sneha Patil",
//         email: "sneha.patil@example.com",
//         phone: "9876501004",
//         company: demoCompanies[3],
//         source: "Website",
//         status: "New",
//         assignedTo: ownerId,
//         notes: "Requested a product walkthrough.",
//       },
//       {
//         name: "Vikram Desai",
//         email: "vikram.desai@example.com",
//         phone: "9876501005",
//         company: demoCompanies[4],
//         source: "Cold Call",
//         status: "Qualified",
//         assignedTo: ownerId,
//         notes: "Exploring workflow automation for the sales team.",
//       },
//       {
//         name: "Neha Joshi",
//         email: "neha.joshi@example.com",
//         phone: "9876501006",
//         company: "SummitWorks",
//         source: "Referral",
//         status: "Won",
//         assignedTo: ownerId,
//         notes: "Converted customer account.",
//       },
//       {
//         name: "Aditya Rao",
//         email: "aditya.rao@example.com",
//         phone: "9876501007",
//         company: "CloudHarbor Systems",
//         source: "LinkedIn",
//         status: "Lost",
//         assignedTo: ownerId,
//         notes: "Budget postponed until next quarter.",
//       },
//       {
//         name: "Kavya Nair",
//         email: "kavya.nair@example.com",
//         phone: "9876501008",
//         company: "BrightPath Education",
//         source: "Website",
//         status: "Contacted",
//         assignedTo: ownerId,
//         notes: "Follow up after internal discussion.",
//       },
//     ]);

//     // CUSTOMERS
//     const customers = await Customer.create([
//       {
//         name: "Aarav Mehta",
//         email: "aarav.mehta@example.com",
//         phone: "9876501001",
//         company: demoCompanies[0],
//         assignedTo: ownerId,
//         notes: "CRM integration customer.",
//         sourceLead: leads[0]._id,
//       },
//       {
//         name: "Priya Sharma",
//         email: "priya.sharma@example.com",
//         phone: "9876501002",
//         company: demoCompanies[1],
//         assignedTo: ownerId,
//         notes: "Enterprise proposal in progress.",
//         sourceLead: leads[1]._id,
//       },
//       {
//         name: "Rohan Kulkarni",
//         email: "rohan.kulkarni@example.com",
//         phone: "9876501003",
//         company: demoCompanies[2],
//         assignedTo: ownerId,
//         notes: "Property sales management.",
//         sourceLead: leads[2]._id,
//       },
//       {
//         name: "Neha Joshi",
//         email: "neha.joshi@example.com",
//         phone: "9876501006",
//         company: "SummitWorks",
//         assignedTo: ownerId,
//         notes: "Existing customer; quarterly review planned.",
//         sourceLead: leads[5]._id,
//       },
//       {
//         name: "Ishaan Verma",
//         email: "ishaan.verma@example.com",
//         phone: "9876501009",
//         company: "Vertex Retail",
//         assignedTo: ownerId,
//         notes: "Retail operations account.",
//       },
//     ]);

//     // DEALS
//     await Deal.create([
//       {
//         title: "DEMO: CRM Integration",
//         customer: customers[0]._id,
//         value: 185000,
//         stage: "Proposal",
//         probability: 70,
//         assignedTo: ownerId,
//         expectedCloseDate: new Date(Date.now() + 7 * 86400000),
//       },
//       {
//         title: "DEMO: Enterprise Platform",
//         customer: customers[1]._id,
//         value: 450000,
//         stage: "Negotiation",
//         probability: 80,
//         assignedTo: ownerId,
//         expectedCloseDate: new Date(Date.now() + 14 * 86400000),
//       },
//       {
//         title: "DEMO: Property Sales Suite",
//         customer: customers[2]._id,
//         value: 120000,
//         stage: "Qualified",
//         probability: 40,
//         assignedTo: ownerId,
//         expectedCloseDate: new Date(Date.now() + 21 * 86400000),
//       },
//       {
//         title: "DEMO: Annual Support Plan",
//         customer: customers[3]._id,
//         value: 96000,
//         stage: "Won",
//         probability: 100,
//         assignedTo: ownerId,
//         expectedCloseDate: new Date(Date.now() - 5 * 86400000),
//       },
//       {
//         title: "DEMO: Retail Workflow Upgrade",
//         customer: customers[4]._id,
//         value: 275000,
//         stage: "New",
//         probability: 20,
//         assignedTo: ownerId,
//         expectedCloseDate: new Date(Date.now() + 30 * 86400000),
//       },
//       {
//         title: "DEMO: Implementation Services",
//         customer: customers[0]._id,
//         value: 150000,
//         stage: "Contacted",
//         probability: 30,
//         assignedTo: ownerId,
//         expectedCloseDate: new Date(Date.now() + 18 * 86400000),
//       },
//     ]);

//     // ACTIVITIES
//     const day = 86400000;
//     const now = Date.now();

//     await Activity.create([
//       {
//         type: "Call",
//         title: "DEMO: Follow up on CRM proposal",
//         description: "Discuss scope, timeline, and implementation costs.",
//         customer: customers[0]._id,
//         assignedTo: ownerId,
//         dueDate: new Date(now + day),
//         status: "Pending",
//       },
//       {
//         type: "Meeting",
//         title: "DEMO: Enterprise requirements meeting",
//         description: "Review integration and security requirements.",
//         customer: customers[1]._id,
//         assignedTo: ownerId,
//         dueDate: new Date(now + 2 * day),
//         status: "Pending",
//       },
//       {
//         type: "Email",
//         title: "DEMO: Send revised quotation",
//         description: "Share revised commercial terms.",
//         lead: leads[4]._id,
//         assignedTo: ownerId,
//         dueDate: new Date(now + 3 * day),
//         status: "Pending",
//       },
//       {
//         type: "Demo",
//         title: "DEMO: Product walkthrough",
//         description: "Demonstrate pipeline and reporting features.",
//         lead: leads[3]._id,
//         assignedTo: ownerId,
//         dueDate: new Date(now + 4 * day),
//         status: "Pending",
//       },
//       {
//         type: "Follow-up",
//         title: "DEMO: Check implementation progress",
//         description: "Review open implementation questions.",
//         customer: customers[3]._id,
//         assignedTo: ownerId,
//         dueDate: new Date(now - day),
//         status: "Pending",
//       },
//       {
//         type: "Call",
//         title: "DEMO: Initial discovery call",
//         description: "Understand customer goals and current workflow.",
//         lead: leads[2]._id,
//         assignedTo: ownerId,
//         dueDate: new Date(now - 2 * day),
//         status: "Completed",
//       },
//       {
//         type: "Meeting",
//         title: "DEMO: Quarterly customer review",
//         description: "Review results and agree on next steps.",
//         customer: customers[3]._id,
//         assignedTo: ownerId,
//         dueDate: new Date(now - 3 * day),
//         status: "Completed",
//       },
//       {
//         type: "Email",
//         title: "DEMO: Share onboarding documents",
//         description: "Send onboarding material and next steps.",
//         customer: customers[4]._id,
//         assignedTo: ownerId,
//         dueDate: new Date(now + 5 * day),
//         status: "Pending",
//       },
//     ]);

//     // Mark converted demo leads as linked to their customers.
//     await Lead.findByIdAndUpdate(leads[0]._id, {
//       convertedToCustomer: customers[0]._id,
//       convertedAt: new Date(),
//     });

//     await Lead.findByIdAndUpdate(leads[1]._id, {
//       convertedToCustomer: customers[1]._id,
//       convertedAt: new Date(),
//     });

//     await Lead.findByIdAndUpdate(leads[2]._id, {
//       convertedToCustomer: customers[2]._id,
//       convertedAt: new Date(),
//     });

//     await Lead.findByIdAndUpdate(leads[5]._id, {
//       convertedToCustomer: customers[3]._id,
//       convertedAt: new Date(),
//     });

//     console.log("Demo data created successfully.");
//     console.log("Leads: 8 | Customers: 5 | Deals: 6 | Activities: 8");
//   } catch (error) {
//     console.error("Demo data seeding failed:", error.message);
//     process.exitCode = 1;
//   } finally {
//     await mongoose.disconnect();
//   }
// }

// seedDemoData();
