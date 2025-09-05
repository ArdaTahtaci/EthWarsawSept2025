import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { makeGolemClient } from "./config/golemdb";

const app = express();
app.use(helmet());
app.use(cors({
    origin: [
        // Civic Dashboard’a eklediğin domain(ler)
        'http://localhost:5173',
        /\.vercel\.app$/ // prod preview
    ],
    credentials: true,
}));
app.use(express.json());

const client = makeGolemClient();


app.get('/healthz', (_req, res) => res.json({ ok: true }));


// global error handler vs... (ops.)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API listening on :${PORT}`);
});
