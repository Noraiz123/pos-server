import express from 'express';
import { deleteUser, getUsers, signin, signup, updateUser } from '../controllers/users.js';

const router = express.Router();

router.post('/sign_in', signin);
router.get('/', getUsers);
router.post('/add', signup);
router.put('/update/:id', updateUser);
router.delete('/delete/:id', deleteUser);

export default router;
