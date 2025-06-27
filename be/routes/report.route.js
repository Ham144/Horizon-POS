import express from "express";
import Report from "../models/report.model.js";

const router = express.Router();

/*Report
Untuk membuat laporan BUG atau permintaan fitur
*/

router.post("/createReport", async (req, res) => {
  const { title, description, image } = req.body;

  if (!title) {
    return res.status(500).json({ message: "Title is required" });
  }

  const report = new Report({ title, description, image });
  await report.save();
  return res.status(200).json({ message: "Report created successfully" });
});

router.get("/getAllReport", async (req, res) => {
  try {
    const reports = await Report.find();
    return res.status(200).json({ reports });
  } catch (error) {
    return res.status(500).json({ message: "Failed to get reports" });
  }
});

router.put("/updateReport/:_id", async (req, res) => {
  const { _id } = req.params;
  const { resolved } = req.body;
  if (!_id) {
    return res.status(500).json({ message: "No _id" });
  }
  const report = await Report.findByIdAndUpdate(_id, {
    resolved: resolved,
  });
  return res.status(200).json({ message: "Report updated successfully" });
});

router.delete("/deleteReport/:_id", async (req, res) => {
  const { _id } = req.params;
  if (!_id) {
    return res.status(500).json({ message: "No _id" });
  }
  const report = await Report.findByIdAndDelete(_id);
  return res.status(200).json({ message: "Report deleted successfully" });
});

export default router;
