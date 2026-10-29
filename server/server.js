
import dotenv from "dotenv";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
dotenv.config();

import dns from "dns";
dns.setServers(["1.1.1.1"]);;
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`MiniCRM server running on port ${PORT}`);
    })
}

startServer()

