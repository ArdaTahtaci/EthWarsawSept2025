import { Router } from 'express';
import { civicAuth } from '../middleware/civicAuth';
import { upsertAuth, me } from '../controller/auth.controller';

const r = Router();

// Civic token zorunlu
r.post('/upsert', civicAuth, upsertAuth);
r.get('/me', civicAuth, me);

export default r;
