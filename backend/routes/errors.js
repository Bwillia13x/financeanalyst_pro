import express from 'express';

const router = express.Router();

router.post('/', (req, res) => {
  try {
    const payload = req.body || {};
    // Log minimal info in dev; avoid noisy logs in prod
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
      console.error('Client error report:', JSON.stringify(payload));
    }
    res.status(200).json({ ok: true });
  } catch (_e) {
    res.status(200).json({ ok: true });
  }
});

export default router;

