import jwt from "jsonwebtoken"

const generateTokenJWT = async (userId) => {

    try {
        const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
            expiresIn: "7d"
        })
        return token
    } catch (error) {
        return null
    }
}

export default generateTokenJWT 