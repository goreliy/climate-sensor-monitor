
import { Router } from 'express';
import os from 'os';

const router = Router();

// Get system info
router.get('/os', (req, res) => {
  res.json({ os: os.platform(), type: os.type(), release: os.release() });
});

export default router;
