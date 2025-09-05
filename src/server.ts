import "dotenv/config";
import express from "express";
import cors from "cors";
import { makeGolemClient } from "./config/golemdb";

const app = express();
app.use(cors());
app.use(express.json());

const client = makeGolemClient();


const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`API running on :${port}`));
