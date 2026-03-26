import { queryDb } from "../../db/client.js";

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
}

export async function updateProviderLocation(
  organizationId: string,
  staffMemberId: string,
  payload: {
    latitude: number;
    longitude: number;
    accuracy_meters?: number | null;
    speed_kph?: number | null;
    heading_degrees?: number | null;
    source?: string | null;
  }
) {
  await queryDb(
    `INSERT INTO staff_locations (
      organization_id, staff_member_id, latitude, longitude, accuracy_meters, speed_kph, heading_degrees, source
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      organizationId,
      staffMemberId,
      payload.latitude,
      payload.longitude,
      payload.accuracy_meters ?? null,
      payload.speed_kph ?? null,
      payload.heading_degrees ?? null,
      payload.source ?? "mobile"
    ]
  );

  const [latest] = await queryDb<{
    latitude: number | null;
    longitude: number | null;
    recorded_at: string;
  }>(
    `SELECT latitude, longitude, recorded_at::text
     FROM staff_locations
     WHERE organization_id = $1 AND staff_member_id = $2
     ORDER BY recorded_at DESC
     LIMIT 1`,
    [organizationId, staffMemberId]
  );

  return latest;
}

export async function getBookingTracking(organizationId: string, bookingId: string) {
  const [booking] = await queryDb<{
    id: string;
    staff_member_id: string | null;
    address_line1: string | null;
    city: string | null;
  }>(
    `SELECT b.id::text, b.staff_member_id::text, vp.address_line1, vp.city
     FROM bookings b
     LEFT JOIN venue_profiles vp ON vp.organization_id = b.organization_id
     WHERE b.organization_id = $1 AND b.id = $2
     LIMIT 1`,
    [organizationId, bookingId]
  );

  if (!booking?.staff_member_id) return null;

  const [latest] = await queryDb<{
    latitude: number | null;
    longitude: number | null;
    recorded_at: string;
    speed_kph: number | null;
  }>(
    `SELECT latitude, longitude, recorded_at::text, speed_kph
     FROM staff_locations
     WHERE organization_id = $1 AND staff_member_id = $2
     ORDER BY recorded_at DESC
     LIMIT 1`,
    [organizationId, booking.staff_member_id]
  );

  const destinationLat = 6.5244;
  const destinationLng = 3.3792;
  let eta_minutes: number | null = null;
  if (latest?.latitude != null && latest?.longitude != null) {
    const distanceKm = haversineKm(latest.latitude, latest.longitude, destinationLat, destinationLng);
    const speed = latest.speed_kph && latest.speed_kph > 5 ? latest.speed_kph : 30;
    eta_minutes = Math.max(2, Math.round((distanceKm / speed) * 60));
  }

  return {
    booking_id: booking.id,
    staff_member_id: booking.staff_member_id,
    location: latest
      ? { lat: latest.latitude, lng: latest.longitude, last_seen_at: latest.recorded_at }
      : null,
    eta_minutes,
    destination: {
      label: [booking.address_line1, booking.city].filter(Boolean).join(", ") || "Destination pending"
    }
  };
}

export async function createGeofence(
  organizationId: string,
  userId: string | null,
  payload: {
    name: string;
    center_latitude: number;
    center_longitude: number;
    radius_meters: number;
    target_type?: string | null;
    target_id?: string | null;
  }
) {
  const [geofence] = await queryDb<{
    id: string;
    name: string;
    center_latitude: number;
    center_longitude: number;
    radius_meters: number;
    target_type: string;
    target_id: string | null;
    created_at: string;
  }>(
    `INSERT INTO geofences (
      organization_id, name, center_latitude, center_longitude, radius_meters, target_type, target_id, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id::text, name, center_latitude, center_longitude, radius_meters, target_type, target_id::text, created_at::text`,
    [
      organizationId,
      payload.name,
      payload.center_latitude,
      payload.center_longitude,
      payload.radius_meters,
      payload.target_type ?? "provider",
      payload.target_id ?? null,
      userId
    ]
  );

  return geofence;
}

export async function getProviderRoute(organizationId: string, staffMemberId: string) {
  const history = await queryDb<{
    latitude: number | null;
    longitude: number | null;
    recorded_at: string;
  }>(
    `SELECT latitude, longitude, recorded_at::text
     FROM staff_locations
     WHERE organization_id = $1 AND staff_member_id = $2
     ORDER BY recorded_at DESC
     LIMIT 20`,
    [organizationId, staffMemberId]
  );

  const route_points = history
    .filter((row) => row.latitude != null && row.longitude != null)
    .reverse()
    .map((row) => ({
      lat: row.latitude,
      lng: row.longitude,
      recorded_at: row.recorded_at
    }));

  return {
    staff_member_id: staffMemberId,
    route_points,
    optimized: route_points.length > 1,
    eta_minutes: route_points.length > 1 ? 8 : null
  };
}
