import { Router } from 'express';
import * as MatchModel from '../models/Match';
import * as CityModel from '../models/City';
import * as FlightPriceModel from '../models/FlightPrice';
import { NearestNeighbourStrategy } from '../strategies/NearestNeighbourStrategy';
import { calculate } from '../utils/CostCalculator';
import { findBestValue } from '../bonus/BestValueFinder';

const router = Router();

/**
 * Route planning and cost analysis endpoints.
 *
 * Provides API routes for:
 * - optimising a selected itinerary
 * - calculating trip cost feasibility against a budget
 * - finding the best-value match combination for a given budget
 */

// ============================================================
// POST /api/route/optimise
// Optimises a travel route for the selected matches using
// the nearest-neighbour strategy.
// ============================================================

router.post('/optimise', (req, res) => {
  try {
    const matchIds = req.body.matchIds;

    if (!Array.isArray(matchIds) || matchIds.length === 0) {
      return res.status(400).json({ error: 'matchIds must be a non-empty array' });
    }

    const matches = MatchModel.getByIds(matchIds);

    const originCity = req.body.originCityId
      ? CityModel.getById(req.body.originCityId)
      : undefined;
    
    if (req.body.originCityId && !originCity) {
      return res.status(400).json({ error: 'Invalid originCityId' });
    }

    const strategy = new NearestNeighbourStrategy();
    const route = strategy.optimise(matches, originCity);

    res.json(route);
  } catch (error) {
    res.status(500).json({ error: 'Failed to optimise route' });
  }
});

// ============================================================
// POST /api/route/budget
// Calculate trip cost feasibility for a selected itinerary.
// ============================================================

router.post('/budget', (req, res) => {
  try {
    const budget = req.body.budget;
    if (!budget || typeof budget !== 'number' || budget <= 0) {
      return res.status(400).json({ error: 'budget must be a positive number' });
    }

    const matchIds = req.body.matchIds;
    if (!Array.isArray(matchIds) || matchIds.length === 0) {
      return res.status(400).json({ error: 'matchIds must be a non-empty array' });
    }
    const matches = MatchModel.getByIds(matchIds);
    if (matches.length === 0) {
      return res.status(404).json({ error: 'No matches found for the provided matchIds' });
    }

    const originCityId = req.body.originCityId;
    if (!originCityId) {
      return res.status(400).json({ error: 'originCityId is required' });
    }

    const originCity = CityModel.getById(originCityId);
    if (!originCity) {
      return res.status(400).json({ error: 'Invalid originCityId' });
    }

    const flightPrices = FlightPriceModel.getAll();
    const result = calculate(matches, budget, flightPrices, originCity);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate cost' });
  }
});

// ============================================================
// POST /api/route/best-value
// Finds the best-value combination of matches for a given budget.
// ============================================================

router.post('/best-value', (req, res) => {
  try {
    const budget = req.body.budget;
    if (!budget || typeof budget !== 'number' || budget <= 0) {
      return res.status(400).json({ error: 'budget must be a positive number' });
    }

    const allMatches = MatchModel.getAll();
    if (allMatches.length === 0) {
      return res.status(404).json({ error: 'No matches found' });
    }

    const originCityId = req.body.originCityId;
    if (!originCityId) {
      return res.status(400).json({ error: 'originCityId is required' });
    }

    const originCity = CityModel.getById(originCityId);
    if (!originCity) {
      return res.status(400).json({ error: 'Invalid originCityId' });
    }

    const flightPrices = FlightPriceModel.getAll();

    const result = findBestValue(allMatches, budget, originCityId, flightPrices, originCity);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to find best value' });
  }
});

export default router;
