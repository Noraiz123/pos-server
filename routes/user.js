import express from 'express';
import { signin, signup } from '../controllers/users.js';

const router = express.Router();

router.post('/sign_in', signin);
router.post('/sign_up', signup);

export default router;




























