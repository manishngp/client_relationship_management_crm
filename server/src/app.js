import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res)=>{
    res.json({
        message : "Server is Statred on port 3000"
    })
})

export default app;
