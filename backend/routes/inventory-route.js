import { Router } from "express";
import {
  disableSingleInventoriToggle,
  getAllinventories,
  registerSingleInventori,
  updateBulkPrices,
  updateSingleInventori,
  getInventoryById,
  getAllinventoriesMobile,
} from "../controllers/inventory.controller.js";

const router = Router();

//manual
router.post("/registerSingleInventori", registerSingleInventori);
router.delete("/disableSingleInventoriToggle", disableSingleInventoriToggle);
router.put("/updateSingleInventori", updateSingleInventori);

router.get("/getAllinventories", getAllinventories);
router.post("/updateBulkPrices", updateBulkPrices);
router.get("/getInventoryById/:skuId", getInventoryById);
router.get("/getAllinventoriesMobile", getAllinventoriesMobile);
//multi (import csv)

export default router;
