
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getActivities,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
} from "../controllers/activityController.js";

const router = Router();

router.use(protect);

router.route("/")
  .get(getActivities)
  .post(createActivity);

router.route("/:id")
  .get(getActivityById)
  .patch(updateActivity)
  .delete(deleteActivity);

export default router;
