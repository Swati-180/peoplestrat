import express from "express";
import multer from "multer";
import {
  addEmployee,
  getEmployees,
  uploadBulkEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
  terminateEmployee,
  reactivateEmployee,
} from "../controllers/employeeController.js";

import { protect, managerOnly, requireOrganization } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);
router.use(requireOrganization);
router.use(managerOnly);

router.post("/add", addEmployee);
router.post("/bulk", upload.single('file'), uploadBulkEmployees);
router.get("/", getEmployees);
router.get("/stats", getEmployeeStats);
router.get("/:id", getEmployeeById);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);
router.post("/:id/terminate", terminateEmployee);
router.post("/:id/reactivate", reactivateEmployee);

export default router;
