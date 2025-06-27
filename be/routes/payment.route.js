import { Router } from "express";
import {
  payBca,
  payBni,
  payDana,
  payGopay,
  payMandiri,
  payPermata,
  payBri,
  payOvo,
  payShopeePay,
} from "../controllers/payment.controller.js";

const router = Router();

router.post("/payment/bca", payBca);
router.post("/payment/bni", payBni);
router.post("/payment/mandiri", payMandiri);
router.post("/payment/dana", payDana);
router.post("/payment/gopay", payGopay);
router.post("/payment/permata", payPermata);
router.post("/payment/bri", payBri);
router.post("/payment/ovo", payOvo);
router.post("/payment/shopee", payShopeePay);

export default router;
