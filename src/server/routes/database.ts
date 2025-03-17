
import { Router } from 'express';
import { db } from '../db';

const router = Router();

// Clear database (only for testing/development)
router.post('/clear', (req, res) => {
  db.run('DELETE FROM sensor_readings', (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true });
  });
});

export default router;
