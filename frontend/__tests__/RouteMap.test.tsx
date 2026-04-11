import { render, screen } from '@testing-library/react';
import RouteMap from '../src/components/RouteMap';
import { OptimisedRoute, ItineraryStop, City, Match, Team  } from '../src/types';

const testTeam: Team = {
  id: 'test-team',
  name:'Test Team',
  code: 'TT',
  group: 'A',
};

const cityAtlanta: City = {
  "id": "city-atlanta",
  "name": "Atlanta",
  "country": "USA",
  "latitude": 33.7553,
  "longitude": -84.4006,
  "stadium": "Mercedes-Benz Stadium",
  "accommodation_per_night": 180
};

const cityBoston: City = {
  "id": "city-boston",
  "name": "Boston",
  "country": "USA",
  "latitude": 42.0909,
  "longitude": -71.2643,
  "stadium": "Gillette Stadium",
  "accommodation_per_night": 220
};

const cityDallas: City = {
  "id": "city-dallas",
  "name": "Dallas",
  "country": "USA",
  "latitude": 32.7473,
  "longitude": -97.0945,
  "stadium": "AT&T Stadium",
  "accommodation_per_night": 160
};

const testCities: City[] = [
  cityAtlanta,
  cityBoston,
  cityDallas,
];

const createMatch = (
  id: string,
  city: City,
): Match => ({
  id,
  city,
  homeTeam: testTeam,
  awayTeam: testTeam,
  kickoff: '2026-06-01T17:00:00Z',
  ticketPrice: 250,
});

const createStop = (
  stopNumber: number,
  city: City,
  match: Match,
): ItineraryStop => ({
  stopNumber,
  city,
  match,
  distanceFromPrevious: 0,
});

const createRoute = (
  stops: ItineraryStop[],
): OptimisedRoute => ({
  stops,
  totalDistance: 0,
  strategy: 'budget-optimised',
  feasible: false,
  warnings: [],
  countriesVisited: ['USA'],
  missingCountries: ['Mexico', 'Canada'],
});

/**
 * Mock react-leaflet components for unit tests.
 *
 * Prevents Jest from loading the real Leaflet ESM package,
 * which causes transform errors in the test environment.
 *
 * Replaces map components with lightweight div-based mocks
 * so RouteMap rendering logic can be tested independently
 * of Leaflet internals and browser-specific map behavior.
 */
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div />,
  Marker: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="marker">{children}</div>
  ),
  Popup: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Polyline: () => <div />,
}));

describe('RouteMap', () => {
  it('should render placeholder message when route is null', () => {
    // Arrange: Render RouteMap with route={null}
    render(<RouteMap route={null} originCity={null} />);

    // Assert: Verify placeholder message is displayed
    expect(screen.getByText('Validate a route to see it displayed on the map.')).toBeInTheDocument();
  });

  it('should render a map container when route is provided', () => {
    // Arrange: Create a mock route with stops
    const n = 3;
    const stops: ItineraryStop[] = [];
    for (let i = 0; i < n; i++) {
      const matchId = 'match-' + (i + 1);
      const match = createMatch(matchId, testCities[i]);
      const stop = createStop(i + 1, testCities[i], match);
      stops.push(stop);
    }

    const route = createRoute(stops);
    const originCity = testCities[0];

    // Act: Render RouteMap with the route
    render(<RouteMap route={route} originCity={originCity} />);

    // Assert: Verify MapContainer is rendered
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('should render a marker for each stop in the route', () => {
    // Arrange: Create a mock route with 3 stops
    const n = 3;
    const stops: ItineraryStop[] = [];
    for (let i = 0; i < n; i++) {
      const matchId = 'match-' + (i + 1);
      const match = createMatch(matchId, testCities[i]);
      const stop = createStop(i + 1, testCities[i], match);
      stops.push(stop);
    }

    const route = createRoute(stops);

    // Act: Render RouteMap with the route
    render(<RouteMap route={route} originCity={null} />);

    // Assert: Verify 3 markers are rendered
    expect(screen.getAllByTestId('marker')).toHaveLength(n);
  });

  it('should handle route with empty stops array', () => {
    // Arrange: Create a mock route with empty stops array
    const stops: ItineraryStop[] = [];
    const route = createRoute(stops);

    // Act: Render RouteMap with the route
    render(<RouteMap route={route} originCity={null} />);

    // Assert: Verify component handles edge case gracefully
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.queryAllByTestId('marker')).toHaveLength(0);
  });
});
