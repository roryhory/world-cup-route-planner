import { NearestNeighbourStrategy } from '../src/strategies/NearestNeighbourStrategy';
import { City, MatchWithCity } from '../src/strategies/RouteStrategy';
import { createCity, createMatch, createKickoff } from './helpers/testFactories';

/**
 * Unit tests for NearestNeighbourStrategy.
 *
 * Covers:
 * - happy path route generation across multiple matches
 * - empty input handling
 * - single-match edge case
 * - nearest-city selection when multiple matches occur on the same day
 *
 * Note:
 * The single-match test is kept from the provided scaffold for completeness.
 * An additional same-day nearest-city test was added to align with CHALLENGE.md.
 */

const REQUIRED_COUNTRIES = ['USA', 'Mexico', 'Canada'];

// Arbitrary lat and long coord increment value
const DISTANCE_INCREASE = 50;


describe('NearestNeighbourStrategy', () => {
  let strategy: NearestNeighbourStrategy;

  beforeEach(() => {
    strategy = new NearestNeighbourStrategy();
  });

  it('should return a valid route for multiple matches (happy path)', () => {
    // Arrange: Create an array of matches across different cities and dates
    const matches: MatchWithCity[] = [];
    const cities: City[] = [];

    // All countries visited to satisfy feasibility constraint
    const n = 5;
    const countries: string[] = [];
    for (let i = 0; i < n; i++) {
      countries.push(REQUIRED_COUNTRIES[(i % REQUIRED_COUNTRIES.length)]);
    }

    let latitude = 0;
    let longitude = 0;

    for (let i = 0; i < n; i++) {
      const cityId = 'city-' + (i + 1);
      const cityName = 'City ' + (i + 1);
      cities.push(createCity(cityId, cityName, countries[i], {
        latitude,
        longitude,
      }));

      latitude += DISTANCE_INCREASE;
      longitude += DISTANCE_INCREASE;

      const matchId = 'match-' + (i + 1);
      const kickoff = createKickoff(i + 1);
      matches.push(createMatch(matchId, cities[i], kickoff));
    }

    // Act: Call strategy.optimise(matches)
    const result = strategy.optimise(matches);

    // Assert: Verify the result has stops, totalDistance > 0, and strategy = 'nearest-neighbour'
    expect(result.feasible).toBe(true);
    expect(result.stops.length).toBe(n);
    expect(result.totalDistance).toBeGreaterThan(0);
    expect(result.strategy).toBe('nearest-neighbour');
  });

  it('should return an empty route for empty matches', () => {
    // Arrange: Create an empty array of matches
    const matches: MatchWithCity[] = [];

    // Act: Call strategy.optimise([])
    const result = strategy.optimise(matches);

    // Assert: Verify the result has empty stops and totalDistance = 0
    expect(result.stops.length).toBe(0);
    expect(result.totalDistance).toBe(0);
    expect(result.feasible).toBe(false);
  });

  // Kept this scaffolded test for completeness.
  // Added a same-day nearest-city test to cover the CHALLENGE.md requirement.
  it('should return zero distance for a single match', () => {
    // Arrange: Create an array with a single match
    const city = createCity('city-1', 'City 1', 'USA');
    const match = createMatch('match-1', city, createKickoff(1));

    const matches: MatchWithCity[] = [match];

    // Act: Call strategy.optimise(matches)
    const result = strategy.optimise(matches);

    // Assert: Verify totalDistance = 0 and stops.length = 1
    expect(result.stops.length).toBe(1);
    expect(result.totalDistance).toBe(0);
    expect(result.feasible).toBe(false);
  });

  it('should pick the nearest city first when multiple matches occur on the same day', () => {
    // Arrange: Create an array of matches across different cities occurring on the same day
    const matches: MatchWithCity[] = [];
    const cities: City[] = [];

    const n = 5;
    let latitude = 0;
    let longitude = 0;

    // Create n cities
    for (let i = 0; i < n; i++) {
      const cityId = 'city-' + (i + 1);
      const cityName = 'City ' + (i + 1);
      cities.push(createCity(cityId, cityName, 'USA', {
        latitude,
        longitude,
      }));

      latitude += DISTANCE_INCREASE;
      longitude += DISTANCE_INCREASE;
    }
    
    // Ensure originCity is not the first city in the array
    const originCity = cities[n - 1];

    for (let i = 0; i < n; i++) {
      const matchId = 'match-' + (i + 1);
      matches.push(createMatch(matchId, cities[i], createKickoff(1)));
    }

    // Act: Call strategy.optimise(matches, originCity)
    const result = strategy.optimise(matches, originCity);

    // Assert: Verify stops.city.id = originCity.id and totalDistance = 0
    expect(result.stops.length).toBe(1);
    expect(result.stops[0].city.id).toBe(originCity.id);
    expect(result.totalDistance).toBe(0);
  });
});
