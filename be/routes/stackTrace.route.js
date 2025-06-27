import { Router } from "express";
import StackTraceSku from "../models/StackTraceSku.model.js";

const router = Router();

router.get("/getAllStackTraceSku", async (req, res) => {
  const { from, to, limit, page, skip, sku, category } = req.query;

  let query = {};
  if (from) {
    const from_00 = new Date(from).setTime(0, 0, 0, 0);
    query.createdAt = { $gte: from_00 };
  }
  if (to) {
    const to_00 = new Date(to).setTime(23, 59, 59, 999);
    query.createdAt = { ...query.createdAt, $lte: to_00 };
  }

  if (sku) {
    query.itemId = { $regex: sku, $options: "i" };
  }

  if (category && category !== "all") {
    query.category = category;
  }

  try {
    const sortedData = await StackTraceSku.find(query)
      .populate("lastEditBy", "username")
      //   .populate("kodeInvoice", "_id kodeInvoice")
      .limit(Number(limit) || 100)
      .sort({ createdAt: -1 })
      .skip(Number(skip) || 0);
    return res.json({
      message: "Berhasil mengambil data stack trace",
      data: sortedData,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
