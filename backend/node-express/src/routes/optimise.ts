import { Router } from 'express';
import * as MatchModel from '../models/Match';
import * as CityModel from '../models/City';
import { NearestNeighbourStrategy } from '../strategies/NearestNeighbourStrategy';

const router = Router();

/**
 * Route Optimisation Routes — YOUR TASKS #3 and #5
 */

// ============================================================
// POST /api/route/optimise
// Optimises a travel route for the selected matches using the nearest-neighbour strategy.
// ============================================================

router.post('/optimise', (req, res) => {
  try {
    const matchIds = req.body.matchIds;

    if (!Array.isArray(matchIds) || matchIds.length === 0) {
      return res.status(400).json({ error: 'matchIds must be a non-empty array'});
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
    res.status(500).json({error: 'Failed to optimise route'});
  }
});

// ============================================================
//  POST /api/route/budget — YOUR TASK #5
// ============================================================
//
// TODO: Implement this endpoint
//
// Request body:
// {
//   "budget": 5000.00,
//   "matchIds": ["match-1", "match-5", "match-12", ...],
//   "originCityId": "city-atlanta"
// }
//
// Steps:
//   1. Extract budget, matchIds, and originCityId from req.body
//   2. Fetch matches by IDs: MatchModel.getByIds(matchIds)
//   3. Fetch origin city: CityModel.getById(originCityId)
//   4. Fetch all flight prices from the database
//   5. Use the CostCalculator to calculate the budget result
//   6. Return the BudgetResult as JSON
//
// Hint: Import and use the CostCalculator from '../utils/CostCalculator'
//
// IMPORTANT CONSTRAINTS:
//   - User MUST attend at least 1 match in each country (USA, Mexico, Canada)
//   - If the budget is insufficient, return feasible=false with:
//     - minimumBudgetRequired: the actual cost
//     - suggestions: ways to reduce cost
//   - If countries are missing, return feasible=false with:
//     - missingCountries: list of countries not covered
//
// ============================================================

router.post('/budget', (req, res) => {
  // TODO: Replace with your implementation
  res.status(200).json({});
});

// ============================================================
//  POST /api/route/best-value — BONUS CHALLENGE #1
// ============================================================
//
// TODO: Implement this endpoint (BONUS)
//
// Request body:
// {
//   "budget": 5000.00,
//   "originCityId": "city-atlanta"
// }
//
// Steps:
//   1. Extract budget and originCityId from req.body
//   2. Fetch all matches: MatchModel.getAll()
//   3. Fetch origin city: CityModel.getById(originCityId)
//   4. Fetch all flight prices from the database
//   5. Use the BestValueFinder to find the best combination
//   6. Return the BestValueResult as JSON
//
// Hint: Import and use the BestValueFinder from '../bonus/BestValueFinder'
//
// ============================================================

router.post('/best-value', (req, res) => {
  // TODO: Replace with your implementation (BONUS)
  res.status(200).json({});
});

export default router;
