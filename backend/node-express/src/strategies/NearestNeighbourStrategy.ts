import { RouteStrategy, MatchWithCity, OptimisedRoute, City } from './RouteStrategy';
import { buildRoute } from '../utils/buildRoute';
import { calculateDistance } from '../utils/haversine';

/**
 * NearestNeighbourStrategy — YOUR TASK #3
 *
 * Route optimisation using nearest-neighbour heuristic.
 *
 * ============================================================
 * WHAT YOU NEED TO IMPLEMENT:
 * ============================================================
 *
 * 1. optimise() method - The nearest-neighbour algorithm:
 *    - Sort matches by kickoff date
 *    - Group matches by date
 *    - For each date, pick the match nearest to your current city
 *    - Track your current city as you process each match
 *
 * 2. validateRoute() method - Validation checks:
 *    - Must have at least 5 matches
 *    - Must visit all 3 countries (USA, Mexico, Canada)
 *    - Set feasibility, warnings, and country coverage on the route
 *
 * ============================================================
 * HELPER METHODS PROVIDED (no changes needed):
 * ============================================================
 *
 * - buildRoute(orderedMatches, strategyName) - Builds the route from ordered matches
 * - calculateDistance(lat1, lon1, lat2, lon2) - Calculates distance between coordinates
 *
 * ============================================================
 */
export class NearestNeighbourStrategy implements RouteStrategy {
  private static readonly STRATEGY_NAME = 'nearest-neighbour';
  private static readonly REQUIRED_COUNTRIES = ['USA', 'Mexico', 'Canada'];
  private static readonly MINIMUM_MATCHES = 5;

  // ============================================================
  //  Nearest Neighbour Algorithm
  // ============================================================

  optimise(matches: MatchWithCity[], originCity?: City): OptimisedRoute {
    const orderedMatches: MatchWithCity[] = [];

    // Handle null/empty matches
    if (!matches || matches.length === 0) {
      return this.createEmptyRoute();
    }

    // Sort matches by kickoff date
    const sorted = [...matches].sort(
      (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
    );

    // Create lookup table for date -> list of matches
    const grouped: Record<string, MatchWithCity[]> = {};

    for (const match of sorted) {
      const date = match.kickoff.split('T')[0];

      if (!grouped[date]) {
        grouped[date] = [];
      }

      grouped[date].push(match);
    }

    // If no origin city is provided, start route selection from the earliest match city
    let currentCity = originCity ? { ...originCity } : sorted[0].city;

    // Add nearest match to current city to orderedMatches if multiple matches occur on same date
    for (const date of Object.keys(grouped)) {
      const matchesForDate = grouped[date];
      const chosenMatch = matchesForDate.length === 1
        ? matchesForDate[0]
        : [...matchesForDate].sort(
          (a, b) =>
            calculateDistance(
              a.city.latitude, 
              a.city.longitude, 
              currentCity.latitude, 
              currentCity.longitude
            ) -
            calculateDistance(
              b.city.latitude, 
              b.city.longitude, 
              currentCity.latitude, 
              currentCity.longitude
            )
        )[0];

      orderedMatches.push(chosenMatch);

      // Track currentCity after processing each match
      currentCity = chosenMatch.city;
    }

    // Build and validate route
    const route = this.buildRoute(orderedMatches, originCity);
    this.validateRoute(route, orderedMatches);
    return route;
  }

  // ============================================================
  //  Validation — YOUR TASK
  // ============================================================
  //
  // TODO: Implement route validation
  //
  // Check the following constraints:
  //   1. Minimum matches - must have at least MINIMUM_MATCHES (5)
  //   2. Country coverage - must visit all REQUIRED_COUNTRIES (USA, Mexico, Canada)
  //
  // Set on the route:
  //   - route.feasible = true/false
  //   - route.warnings = list of warning messages
  //   - route.countriesVisited = list of countries
  //   - route.missingCountries = list of missing countries
  //
  // ============================================================

  private validateRoute(route: OptimisedRoute, matches: MatchWithCity[]): void {
    route.warnings = [];
    route.feasible = true;

    const countriesVisited = new Set<string>();

    for (const stop of route.stops) {
      countriesVisited.add(stop.city.country);
    }

    route.countriesVisited = Array.from(countriesVisited);
    route.missingCountries = NearestNeighbourStrategy.REQUIRED_COUNTRIES.filter(
      country => !countriesVisited.has(country)
    );

    // Route must have at least MINIMUM_MATCHES (5)
    if (matches.length < NearestNeighbourStrategy.MINIMUM_MATCHES) {
      route.warnings.push(
        `Route must include at least ${NearestNeighbourStrategy.MINIMUM_MATCHES} matches`
      );
      route.feasible = false;
    }

    // Country coverage - must visit all REQUIRED_COUNTRIES (USA, Mexico, Canada)
    if (route.missingCountries.length > 0) {
      route.warnings.push(
        `Route does not visit all countries. Missing: ${route.missingCountries.join(', ')}`
      );
      route.feasible = false;
    }
  }

  // ============================================================
  //  Helper Methods (provided - no changes needed)
  // ============================================================

  /**
   * Creates an empty route with appropriate warnings.
   */
  private createEmptyRoute(): OptimisedRoute {
    return {
      stops: [],
      totalDistance: 0,
      strategy: NearestNeighbourStrategy.STRATEGY_NAME,
      feasible: false,
      warnings: ['No matches selected', `Must select at least ${NearestNeighbourStrategy.MINIMUM_MATCHES} matches`],
      countriesVisited: [],
      missingCountries: [...NearestNeighbourStrategy.REQUIRED_COUNTRIES],
    };
  }

  /**
   * Builds an optimised route from ordered matches, including origin city distance.
   */
  private buildRoute(orderedMatches: MatchWithCity[], originCity?: City): OptimisedRoute {
    const route = buildRoute(orderedMatches, NearestNeighbourStrategy.STRATEGY_NAME);

    // Add distance from origin city to first match
    if (originCity && route.stops.length > 0) {
      const firstStop = route.stops[0];
      const distanceFromOrigin = calculateDistance(
        originCity.latitude,
        originCity.longitude,
        firstStop.city.latitude,
        firstStop.city.longitude
      );
      firstStop.distanceFromPrevious = distanceFromOrigin;
      route.totalDistance += distanceFromOrigin;
    }

    return route;
  }
}
