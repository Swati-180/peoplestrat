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
} from "../controllers/employeeController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/add", addEmployee);
router.post("/bulk", upload.single('file'), uploadBulkEmployees);
router.get("/", getEmployees);
router.get("/stats", getEmployeeStats);
router.get("/:id", getEmployeeById);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

export default router;
