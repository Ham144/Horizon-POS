import { Router } from "express";
import {
  deleteDiskon,
  deleteMultiDiskon,
  getAllDiskon,
  registerDiskon,
  registerMultiDiskon,
  updateDiskon,
  getAllDiskonByProduct,
} from "../controllers/diskon.controller.js";

const router = Router();

//single
router.post("/registerDiskon", registerDiskon);
router.delete("/deleteDiskon/:id", deleteDiskon);
router.put("/updateDiskon", updateDiskon);
router.get("/getAllDiskon", getAllDiskon);
router.get("/getAllDiskonByProduct/:sku", getAllDiskonByProduct);

//multi (import csv)
router.post("/registerMultiDiskon", registerMultiDiskon);
router.delete("/registerMultiDiskon", deleteMultiDiskon);

export default router;
