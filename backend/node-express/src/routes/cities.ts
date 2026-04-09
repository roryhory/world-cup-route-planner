import { Router } from 'express';
import * as CityModel from '../models/City';

const router = Router();


// ============================================================
// GET /api/cities
// Returns all 16 host cities as a JSON array.
// Resonse: [{ id, name, country, latitude, longitude, stadium, accommodation_per_night }, ...]
// ============================================================

router.get('/', (_req, res) => {
  try {
    const cities = CityModel.getAll();
    res.json(cities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

export default router;
