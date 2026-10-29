import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
  getCustomers,
  createCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController.js";

const router = Router();

router.use(protect);

router.route("/")
  .get(getCustomers)
  .post(createCustomer);

router.route("/:id")
  .get(getCustomerById)
  .patch(updateCustomer)
  .delete(deleteCustomer);

export default router;