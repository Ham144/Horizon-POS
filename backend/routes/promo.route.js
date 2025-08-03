import { Router } from "express";
import {
  registerPromo,
  getAllPromo,
  updatePromo,
  getAllPromoByProduct,
  deletePromo,
} from "../controllers/promo.controller.js";

const router = Router();

router.post("/registerPromo", registerPromo);
router.get("/getAllPromo", getAllPromo);
router.put("/updatePromo", updatePromo);
router.get("/getAllPromoByProduct/:sku", getAllPromoByProduct);
router.delete("/deletePromo/:id", deletePromo);

export default router;
