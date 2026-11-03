import { Router } from 'express';
import { upload, uploadFile, getUserFiles, deleteUserFile } from '../controllers/fileController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// All file routes are protected with JWT auth
router.use(authMiddleware);

router.post('/upload', upload.single('file'), uploadFile);
router.get('/', getUserFiles);
router.delete('/:fileId', deleteUserFile);

export default router;

