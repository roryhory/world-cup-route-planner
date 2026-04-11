import { City, MatchWithCity, Team, FlightPrice } from '../../src/strategies/RouteStrategy';

/**
 * Test factory helpers for backend unit tests.
 *
 * Provides reusable builders for:
 * - teams
 * - cities
 * - matches with default ticket and match-day values
 * - kickoff timestamps
 * - flight prices
 *
 * Supports per-test overrides so fixtures can stay minimal
 * while still allowing specific properties to be customised
 * for edge cases and scenario-based assertions.
 */

const homeTeam: Team = {
  id: 'home-team',
  name: 'Home Team',
  code: 'HT',
  group: 'A',
};

const awayTeam: Team = {
  id: 'away-team',
  name: 'Away Team',
  code: 'AT',
  group: 'A',
};

type CityOverrides = Partial<City>;
type MatchOverrides = Partial<MatchWithCity>;
type FlightPriceOverrides = Partial<FlightPrice>;

export const createTeam = (
  id: string,
  name: string,
  code: string,
): Team => ({
  id,
  name,
  code,
  group: 'A',
});

export const createCity = (
  id: string,
  name: string,
  country: string,
  overrides: CityOverrides = {}
): City => ({
  id,
  name,
  country,
  latitude: 0,
  longitude: 0,
  accommodation_per_night: 200,
  stadium: 'Test Stadium',
  ...overrides,
});

export const createMatch = (
  id: string, 
  city: City, 
  kickoff: string,
  overrides: MatchOverrides = {}
): MatchWithCity => ({
  id,
  homeTeam,
  awayTeam,
  city,
  kickoff,
  group: 'A',
  ticketPrice: 250,
  matchDay: 1,
  ...overrides,
});

export const createKickoff = (day: number): string =>
  `2026-06-${String(day).padStart(2, '0')}T17:00:00Z`;

export const createFlightPrice = (
  id: string, 
  origin_city_id: string, 
  destination_city_id: string,
  overrides: FlightPriceOverrides = {}
): FlightPrice => ({
  id,
  origin_city_id,
  destination_city_id,
  price_usd: 300,
  ...overrides,
});
