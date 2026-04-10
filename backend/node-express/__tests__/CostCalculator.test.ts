import { calculate } from '../src/utils/CostCalculator';
import { City, MatchWithCity, FlightPrice, Team } from '../src/strategies/RouteStrategy';
import { createCity, createMatch, createKickoff, createFlightPrice, createTeam } from './helpers/testFactories';

/**
 * Unit tests for CostCalculator.
 *
 * Covers:
 * - happy path cost calculation for a valid multi-country itinerary
 * - empty match list handling with zero-cost breakdown
 * - over-budget suggestion logic for removing the most expensive match
 *
 * Verifies:
 * - cost breakdown totals (tickets, flights, accommodation, total)
 * - feasibility checks against budget and country coverage
 * - route generation for budget-optimised itineraries
 * - suggestion generation for invalid itineraries
 */

const REQUIRED_COUNTRIES = ['USA', 'Mexico', 'Canada'];
const COSTS = {
  ACCOMMODATION_PER_NIGHT: 200, 
  MATCH_TICKET: 250, 
  FLIGHT_TICKET: 300 
};

const expensiveHomeTeam: Team = createTeam(
  'expensive-home-team', 
  'Expensive Home Team',
  'EHT',
);
const expensiveAwayTeam: Team = createTeam(
  'expensive-away-team',
  'Expensive Away Team',
  'EAT',
);
const expensiveOverride = {
  ticketPrice: 3 * COSTS.MATCH_TICKET,
  homeTeam: expensiveHomeTeam,
  awayTeam: expensiveAwayTeam,
};

describe('CostCalculator', () => {
  
  it('should calculate a feasible trip cost breakdown for a valid multi-country itinerary within budget', () => {
    // Arrange: Create an array of matches across different cities and dates with flights between consecutive cities
    const matches: MatchWithCity[] = [];
    const cities: City[] = [];
    const flightPrices: FlightPrice[] = [];
    const budget = 10000;

    // All countries visited to satisfy feasibility constraint
    const n = 5;
    const countries: string[] = [];
    for (let i = 0; i < n; i++) {
      countries.push(REQUIRED_COUNTRIES[(i % REQUIRED_COUNTRIES.length)]);
    }

    let accommodationTotal = 0;
    let ticketsTotal = 0;
    let flightsTotal = 0;

    for (let i = 0; i < n; i++) {
      const cityId = 'city-' + (i + 1);
      const cityName = 'City ' + (i + 1);
      cities.push(createCity(cityId, cityName, countries[i], { accommodation_per_night: COSTS.ACCOMMODATION_PER_NIGHT }));

      const matchId = 'match-' + (i + 1);
      const kickoff = createKickoff(i + 1);
      matches.push(createMatch(matchId, cities[i], kickoff, { ticketPrice: COSTS.MATCH_TICKET }));
      ticketsTotal += COSTS.MATCH_TICKET;

      // Add expected flight and accommodation costs between consecutive matches
      if (i > 0) {
        accommodationTotal += COSTS.ACCOMMODATION_PER_NIGHT;

        const flightId = 'flight-' + (flightPrices.length + 1);
        const origin_city_id = cities[i - 1].id;
        const destination_city_id = cities[i].id;

        flightPrices.push(createFlightPrice(flightId, origin_city_id, destination_city_id, { price_usd: COSTS.FLIGHT_TICKET }));
        flightsTotal += COSTS.FLIGHT_TICKET;
      }

      // Add one final night of accommodation for the last match
      if (i === n - 1) {
        accommodationTotal += COSTS.ACCOMMODATION_PER_NIGHT;
      }
    }

    const totalCost = accommodationTotal + ticketsTotal + flightsTotal;

    // Act: Calculate the trip cost and feasibility
    const result = calculate(matches, budget, flightPrices, cities[0]);

    // Assert: Verify feasible = true, route is defined with n stops, minimumBudgetRequired is <= budget,
    // and costBreakdown matches expected values
    expect(result.feasible).toBe(true);
    expect(result.route).toBeDefined();
    expect(result.route!.stops.length).toBe(n);
    expect(result.minimumBudgetRequired).toBe(totalCost);
    expect(result.costBreakdown.accommodation).toBe(accommodationTotal);
    expect(result.costBreakdown.tickets).toBe(ticketsTotal);
    expect(result.costBreakdown.flights).toBe(flightsTotal);
    expect(result.costBreakdown.total).toBe(totalCost);
    expect(result.missingCountries).toEqual([]);
    expect(result.suggestions).toEqual([]);
  })

  it('should return zero costs and an infeasible result for an empty match list', () => {
    // Arrange: Create an empty array of matches
    const matches: MatchWithCity[] = [];
    const budget = 10000;
    const flightPrices: FlightPrice[] = [];
    const originCity: City = createCity('city-1', 'City 1', 'USA');

    // Act: Calculate the trip cost and feasibility
    const result = calculate(matches, budget, flightPrices, originCity);

    // Assert: Verify result is not feasible, has no stops, cost is zero and all countries are missing
    expect(result.feasible).toBe(false);
    expect(result.route).toBeDefined();
    expect(result.route!.stops.length).toBe(0);
    expect(result.costBreakdown.accommodation).toBe(0);
    expect(result.costBreakdown.tickets).toBe(0);
    expect(result.costBreakdown.flights).toBe(0);
    expect(result.costBreakdown.total).toBe(0);

    expect(result.missingCountries).toEqual(REQUIRED_COUNTRIES);
  })

  it('should suggest removing the most expensive match when the itinerary is over budget', () => {
    // Arrange: Create an array of matches that goes over the budget
    const matches: MatchWithCity[] = [];
    let originCity: City | undefined;
    const flightPrices: FlightPrice[] = [];
    const budget = 2000;
    const n = 5;

    const expensiveTicketPrice = 3 * COSTS.MATCH_TICKET;
    const suggestionRemoveMatch = `Consider removing Expensive Home Team vs Expensive Away Team to save $${expensiveTicketPrice.toFixed(2)} on tickets`;

    for (let i = 0; i < n; i++) {
      const firstMatch = i === 0;

      const cityId = 'city-' + (i + 1);
      const cityName = 'City ' + (i + 1);
      const city: City = createCity(cityId, cityName, 'USA');

      if (firstMatch) {
        originCity = city;
      }
      
      const matchId = 'match-' + (i + 1);
      const kickoff = createKickoff(i + 1);
      const expensiveMatch = i === n - 1;
      const override = expensiveMatch ? expensiveOverride : {};

      matches.push(createMatch(matchId, city, kickoff, override));
    }

    // Act: Calculate the trip cost and feasibility
    const result = calculate(matches, budget, flightPrices, originCity!);

    // Assert: Verify suggestions includes most expensive match
    expect(result.suggestions).toContain(suggestionRemoveMatch);
  })
});