import { Router } from 'express';
import * as MatchModel from '../models/Match';

const router = Router();

// ============================================================
// GET /api/matches
// Returns matches with optional city and date filters.
// ============================================================

router.get('/', (req, res) => {
  const city = typeof req.query.city === 'string' ? req.query.city : undefined;
  const date = typeof req.query.date === 'string' ? req.query.date : undefined;

  try {
    const matches = MatchModel.getAll({ city, date });
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// ============================================================
// GET /api/matches/:id
// Returns a single match by ID, or 404 if not found.
// ============================================================

router.get('/:id', (req, res) => {
  const id = req.params.id;

  try {
    const match = MatchModel.getById(id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found'});
    }

    res.json(match);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch match' });
  }
});

export default router;
