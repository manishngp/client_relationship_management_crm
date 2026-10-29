
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
  getDeals,
  createDeal,
  getDealById,
  updateDeal,
  deleteDeal,
} from "../controllers/dealController.js";

const router = Router();

router.use(protect);

router.route("/")
  .get(getDeals)
  .post(createDeal);

router.route("/:id")
  .get(getDealById)
  .patch(updateDeal)
  .delete(deleteDeal);

export default router;
