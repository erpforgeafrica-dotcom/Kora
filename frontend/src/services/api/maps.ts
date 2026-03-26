export interface GeoLocation {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  type: "provider" | "user" | "incident" | "facility";
  heading?: number;
  speed?: number;
  accuracy?: number;
  lastUpdated: Date;
}

export interface NearbyProvider {
  id: string;
  name: string;
  type: string;
  rating: number;
  distance: number;
  eta: number;
  location: GeoLocation;
  availability: "available" | "busy" | "offline";
}

export interface Route {
  id: string;
  origin: GeoLocation;
  destination: GeoLocation;
  distance: number;
  duration: number;
  polyline: string;
  steps: RouteStep[];
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  location: GeoLocation;
}

export interface GeofenceEvent {
  id: string;
  providerId: string;
  geofenceId: string;
  type: "enter" | "exit";
  timestamp: Date;
  location: GeoLocation;
}

export class MapService {
  private baseUrl = "/api/maps";

  async updateLocation(location: Omit<GeoLocation, "id">): Promise<GeoLocation> {
    const response = await fetch(`${this.baseUrl}/location`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(location)
    });
    if (!response.ok) throw new Error("Failed to update location");
    return response.json();
  }

  async getMyLocation(): Promise<GeoLocation> {
    const response = await fetch(`${this.baseUrl}/location`);
    if (!response.ok) throw new Error("Failed to get location");
    return response.json();
  }

  async getNearbyProviders(
    latitude: number,
    longitude: number,
    radiusKm: number = 5,
    type?: string
  ): Promise<NearbyProvider[]> {
    const url = `${this.baseUrl}/nearby?lat=${latitude}&lon=${longitude}&radius=${radiusKm}${
      type ? `&type=${type}` : ""
    }`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to get nearby providers");
    return response.json();
  }

  async startTracking(entityId: string, type: "provider" | "incident"): Promise<void> {
    const response = await fetch(`${this.baseUrl}/tracking/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityId, type })
    });
    if (!response.ok) throw new Error("Failed to start tracking");
  }

  async stopTracking(entityId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/tracking/stop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityId })
    });
    if (!response.ok) throw new Error("Failed to stop tracking");
  }

  async getTrackedEntity(entityId: string): Promise<GeoLocation> {
    const response = await fetch(`${this.baseUrl}/tracking/${entityId}`);
    if (!response.ok) throw new Error("Failed to get tracked entity");
    return response.json();
  }

  async getRoute(
    originLat: number,
    originLon: number,
    destLat: number,
    destLon: number,
    transportMode: "driving" | "walking" | "bicycling" = "driving"
  ): Promise<Route> {
    const url = `${this.baseUrl}/route?originLat=${originLat}&originLon=${originLon}&destLat=${destLat}&destLon=${destLon}&mode=${transportMode}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to get route");
    return response.json();
  }

  async getETA(
    originLat: number,
    originLon: number,
    destLat: number,
    destLon: number
  ): Promise<{ duration: number; distance: number }> {
    const url = `${this.baseUrl}/eta?originLat=${originLat}&originLon=${originLon}&destLat=${destLat}&destLon=${destLon}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to get ETA");
    return response.json();
  }

  async createGeofence(
    name: string,
    latitude: number,
    longitude: number,
    radiusMeters: number
  ): Promise<{ id: string }> {
    const response = await fetch(`${this.baseUrl}/geofence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        location: { latitude, longitude },
        radiusMeters
      })
    });
    if (!response.ok) throw new Error("Failed to create geofence");
    return response.json();
  }

  async deleteGeofence(geofenceId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/geofence/${geofenceId}`, {
      method: "DELETE"
    });
    if (!response.ok) throw new Error("Failed to delete geofence");
  }

  async getGeofenceEvents(
    geofenceId?: string,
    limit: number = 50
  ): Promise<GeofenceEvent[]> {
    const url = geofenceId
      ? `${this.baseUrl}/geofence-events?geofenceId=${geofenceId}&limit=${limit}`
      : `${this.baseUrl}/geofence-events?limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to get geofence events");
    return response.json();
  }

  async getLiveHeatmap(
    type: "providers" | "incidents" | "demand"
  ): Promise<{ locations: GeoLocation[] }> {
    const response = await fetch(`${this.baseUrl}/heatmap?type=${type}`);
    if (!response.ok) throw new Error("Failed to get heatmap");
    return response.json();
  }
}

export const mapService = new MapService();
