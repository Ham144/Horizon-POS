import { Router } from "express";
import InventoryRefrensi from "../models/InventoryRefrensi.model.js";
import ImteLibraryThumbnail from "../models/itemLibraryThumbnail.model.js";
import multer from "multer";

const router = Router()

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Maksimum ukuran file 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

router.post("/upload/:sku", upload.single('image'), async (req, res) => {
    const { sku } = req.params
    const { buffer, originalname } = req.file
    try {
        const inventoryDB = await InventoryRefrensi.findOne({ sku })
        if (!inventoryDB) {
            return res.status({ message: "tidak ditemukan item yang akan di attach thumbnail" })
        }
        else {
            await ImteLibraryThumbnail.findOneAndUpdate({ sku }, {
                $set: {
                    sku: sku,
                    buffer: buffer,
                    originalName: originalname
                }
            }, { upsert: true, new: true })
        }
        //ga perlu hapus file di uploads/ krn storage = multer.memoryStorage
    } catch (error) {
        console.log(error)
        return res.status(400).json({ message: "terjadi kesalahan mengupload", error })
    }
})

router.get("/get/:sku", async (req, res) => {
    const { sku } = req.params
    try {
        if (!sku) {
            return res.status(200).json({ message: "sku diperlukan" })
        }
        const thumbnailDB = await ImteLibraryThumbnail.findOne({ sku })
        if (!thumbnailDB) {
            return res.status(404).json({ message: "tidak ditemukan thumbnail" })
        }
        else {
            const base64 = `data:image/jpeg;base64,${Buffer.from(thumbnailDB.buffer).toString('base64')}`
            const data = {
                base64,
                originalName: thumbnailDB.originalName,
                externalLinkAlternatif: thumbnailDB?.externalLinkAlternatif,
            }
            return res.status(200).json({ message: "thumbnail ditemukan", data })
        }
    } catch (error) {
        return res.status(500).json({ message: "thumbnail tidak ditemukan" })
    }
})



export default router