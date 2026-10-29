import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
  getLeads,
  createLead,
  getLeadById,
  updateLead,
  deleteLead,
  convertLeadToCustomer,
} from "../controllers/leadController.js";

const router = Router();

router.use(protect);

router.route("/")
  .get(getLeads)
  .post(createLead);

router.post("/:id/convert", convertLeadToCustomer);

router.route("/:id")
  .get(getLeadById)
  .patch(updateLead)
  .delete(deleteLead);

export default router;