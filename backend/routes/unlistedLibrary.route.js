import { Router } from "express";
import {
  getConfigUnlistedSource,
  getUnlistedLibraryByQueries,
  resetConfigUnlisteredSource,
  updateConfigUnlistedSource,
  TogglingDisableInventory,
} from "../controllers/UnlistedLibrary.controller.js";

const router = Router();

//config
router.put("/updateConfigUnlistedSource", updateConfigUnlistedSource);
router.get("/getConfigUnlistedSource", getConfigUnlistedSource);
router.delete("/resetConfigUnlistedSource", resetConfigUnlisteredSource);

//main
router.get("/getUnlistedLibraryByQueries", getUnlistedLibraryByQueries); //memperbarui data
router.post("/toggleDisableInventory/:id", TogglingDisableInventory);

export default router;
