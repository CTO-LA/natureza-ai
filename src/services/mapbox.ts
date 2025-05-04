/**
 * Represents a geographical coordinate.
 */
export interface Coordinate {
  /**
   * The latitude of the coordinate.
   */
  latitude: number;
  /**
   * The longitude of the coordinate.
   */
  longitude: number;
}

/**
 * Represents a bounding box with southwest and northeast coordinates.
 */
export interface BoundingBox {
  /**
   * The southwest coordinate of the bounding box.
   */
  southwest: Coordinate;
  /**
   * The northeast coordinate of the bounding box.
   */
  northeast: Coordinate;
}

/**
 * Represents the result of a geocoding request.
 */
export interface GeocodingResult {
  /**
   * The name of the location.
   */
  name: string;
  /**
   * The coordinates of the location.
   */
  coordinate: Coordinate;
  /**
   * The bounding box of the location.
   */
  boundingBox: BoundingBox;
}

/**
 * Asynchronously performs geocoding for a given location name.
 *
 * @param locationName The name of the location to geocode.
 * @returns A promise that resolves to a GeocodingResult object, or undefined if no result is found.
 */
export async function geocodeLocation(locationName: string): Promise<GeocodingResult | undefined> {
  // TODO: Implement this by calling an API.

  return {
    name: 'Golden Gate Bridge',
    coordinate: {
      latitude: 37.8199,
      longitude: -122.4783,
    },
    boundingBox: {
      southwest: {
        latitude: 37.802,
        longitude: -122.522,
      },
      northeast: {
        latitude: 37.833,
        longitude: -122.435,
      },
    },
  };
}
