import {
  MatchWithCity,
  FlightPrice,
  BudgetResult,
  CostBreakdown,
  City,
} from '../strategies/RouteStrategy';
import { buildRoute } from './buildRoute';
import { calculateDistance } from './haversine';

/**
 * Budget calculation utilities for itinerary feasibility.
 *
 * Computes ticket, flight, and accommodation costs,
 * checks country coverage constraints, and returns
 * suggestions when the trip exceeds the available budget.
 */

const REQUIRED_COUNTRIES = ['USA', 'Mexico', 'Canada'];

/**
 * Calculate whether a selected itinerary is feasible within budget.
 *
 * Matches are processed in chronological order to estimate
 * flights, accommodation nights, and total ticket spend.
 * Also validates country coverage across USA, Mexico, and Canada.
 */
export function calculate(
  matches: MatchWithCity[],
  budget: number,
  flightPrices: FlightPrice[],
  originCity: City
): BudgetResult {
  const sortedMatches = [...matches].sort(
    (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
  );

  const countriesVisitedSet = new Set<string>();
  for (const match of sortedMatches) {
    countriesVisitedSet.add(match.city.country);
  }
  const countriesVisited = Array.from(countriesVisitedSet);

  const missingCountries = REQUIRED_COUNTRIES.filter(
    country => !countriesVisitedSet.has(country)
  );

  // Calculate cost breakdown
  const ticketsCost = calculateTicketsCost(sortedMatches);
  const flightsCost = calculateFlightsCost(originCity, sortedMatches, flightPrices);
  const accommodationCost = calculateAccommodationCost(sortedMatches);
  const totalCost = ticketsCost + flightsCost + accommodationCost;

  const costBreakdown = {
    flights: flightsCost, 
    accommodation: accommodationCost, 
    tickets: ticketsCost, 
    total: totalCost 
  };
  
  // Check feasibility (visit all three countries and totalCost within budget)
  const feasible = missingCountries.length === 0 && totalCost <= budget;
  let suggestions: string[] = [];

  if (!feasible) {
    suggestions = generateSuggestions(
      missingCountries,
      totalCost,
      budget,
      sortedMatches
    );
  }

  const route = buildRoute(sortedMatches, 'budget-optimised');

  return {
    feasible,
    route,
    costBreakdown,
    countriesVisited,
    missingCountries,
    minimumBudgetRequired: totalCost,
    suggestions
  };
}

// ============================================================
//  Helper Methods (provided - no changes needed)
// ============================================================

/**
 * Generate helpful suggestions when the trip is not feasible.
 */
function generateSuggestions(
  missingCountries: string[],
  totalCost: number,
  budget: number,
  matches: MatchWithCity[]
): string[] {
  const suggestions: string[] = [];

  if (missingCountries.length > 0) {
    suggestions.push(`Add matches in: ${missingCountries.join(', ')}`);
  }

  if (totalCost > budget) {
    suggestions.push(`You need $${(totalCost - budget).toFixed(2)} more to complete this trip`);

    // Find most expensive match
    const sortedByPrice = [...matches].sort(
      (a, b) => getMatchTicketPrice(b) - getMatchTicketPrice(a)
    );
    if (sortedByPrice.length > 0) {
      const mostExpensive = sortedByPrice[0];
      const price = getMatchTicketPrice(mostExpensive);
      suggestions.push(
        `Consider removing ${mostExpensive.homeTeam.name} vs ${mostExpensive.awayTeam.name} to save $${price.toFixed(2)} on tickets`
      );
    }
  }

  return suggestions;
}

function calculateTicketsCost(matches: MatchWithCity[]): number {
  return matches.reduce((sum, match) => sum + getMatchTicketPrice(match), 0);
}

function getMatchTicketPrice(match: MatchWithCity): number {
  return match.ticketPrice ?? 150.0; // Default if not set
}

function calculateFlightsCost(
  originCity: City,
  matches: MatchWithCity[],
  flightPrices: FlightPrice[]
): number {
  if (matches.length === 0) return 0;

  let totalFlightCost = 0;

  // Flight from origin to first match
  const firstMatchCity = matches[0].city;
  totalFlightCost += getFlightPrice(originCity, firstMatchCity, flightPrices);

  // Flights between consecutive matches
  for (let i = 0; i < matches.length - 1; i++) {
    const fromCity = matches[i].city;
    const toCity = matches[i + 1].city;
    if (fromCity.id !== toCity.id) {
      totalFlightCost += getFlightPrice(fromCity, toCity, flightPrices);
    }
  }

  return totalFlightCost;
}

function getFlightPrice(from: City, to: City, flightPrices: FlightPrice[]): number {
  if (from.id === to.id) return 0;

  // Look for exact price in flight prices
  const exactPrice = flightPrices.find(
    (fp) => fp.origin_city_id === from.id && fp.destination_city_id === to.id
  );

  if (exactPrice) {
    return exactPrice.price_usd;
  }

  // Estimate based on distance if not found (roughly $0.10 per km)
  const distance = calculateDistance(from.latitude, from.longitude, to.latitude, to.longitude);
  return Math.round(distance * 0.1 * 100) / 100;
}

function calculateAccommodationCost(matches: MatchWithCity[]): number {
  if (matches.length < 2) {
    // At least one night for a single match
    if (matches.length === 1) {
      return matches[0].city.accommodation_per_night;
    }
    return 0;
  }

  let totalAccommodation = 0;

  for (let i = 0; i < matches.length - 1; i++) {
    const currentMatch = matches[i];
    const nextMatch = matches[i + 1];

    const currentDate = new Date(currentMatch.kickoff);
    const nextDate = new Date(nextMatch.kickoff);
    let nights = Math.ceil(
      (nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Ensure at least 1 night
    nights = Math.max(1, nights);

    const nightlyRate = currentMatch.city.accommodation_per_night;
    totalAccommodation += nights * nightlyRate;
  }

  // Add one night for the last city
  totalAccommodation += matches[matches.length - 1].city.accommodation_per_night;

  return totalAccommodation;
}
