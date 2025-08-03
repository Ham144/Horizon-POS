const generateUniqueKodeKasir = async (username) => {
    // Extract first 2 characters from username and capitalize them
    let baseCode = username.substring(0, 2).toUpperCase();

    // Add a random digit or letter to make it 3 characters
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let isUnique = false;
    let kodeKasir = "";
    let attempts = 0;

    while (!isUnique && attempts < 50) {
        const randomChar = chars.charAt(Math.floor(Math.random() * chars.length));
        kodeKasir = baseCode + randomChar;

        // Check if this code already exists
        const existingUser = await UserRefrensi.findOne({ kodeKasir });
        if (!existingUser) {
            isUnique = true;
        } else {
            attempts++;
            // If we've tried many times with the first 2 chars, try with different base
            if (attempts > 20) {
                baseCode =
                    username.substring(0, 1).toUpperCase() +
                    chars.charAt(Math.floor(Math.random() * chars.length));
            }
        }
    }

    // If we couldn't find a unique code after many attempts, generate a completely random one
    if (!isUnique) {
        while (!isUnique) {
            kodeKasir = "";
            for (let i = 0; i < 3; i++) {
                kodeKasir += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            const existingUser = await UserRefrensi.findOne({ kodeKasir });
            if (!existingUser) {
                isUnique = true;
            }
        }
    }

    return kodeKasir;
};
export default generateUniqueKodeKasir