import { Router } from "express";


const router = Router()

//kirim email
router.post("/kirimEmail", async (req, res) => {
    try {
        const { } = req.body


    } catch (error) {
        console.log(error)
        return res.status(400).json({ message: "gagal mengirim email", error })
    }
})

export default router