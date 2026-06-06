/**
 * Mobile Field Workforce Geospatial Dispatch Service
 * 
 * Manages dispatch states, coordinates mapping, ETA countdowns, and GeoJSON payload generation
 * supporting home nursing specialists, physical trainers, or styling crews.
 */

export interface DispatchJob {
  id: string;
  bookingId: string;
  workerName: string;
  jobType: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  etaMinutes: number;
  status: 'Ready' | 'Dispatched' | 'En Route' | 'On Site' | 'Completed';
  lastUpdated: string;
}

export const DISPATCH_JOBS_STORE: DispatchJob[] = [
  {
    id: 'dsp-801',
    bookingId: 'bk-101',
    workerName: 'Adeola Benson',
    jobType: '💍 Aesthetics Hairstyle & Post-natal Check',
    address: 'Plot 14, Penthouse W, Victoria Island, Lagos',
    coordinates: { lat: 6.4281, lng: 3.4219 },
    etaMinutes: 18,
    status: 'En Route',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'dsp-802',
    bookingId: 'bk-xyz',
    workerName: 'Dr. Chidi Obi',
    jobType: '🩺 Geriatric Cardiovascular Home Visit',
    address: '89 Alfred Rewane Rd, Ikoyi, Lagos',
    coordinates: { lat: 6.4474, lng: 3.4475 },
    etaMinutes: 0,
    status: 'On Site',
    lastUpdated: new Date().toISOString()
  }
];

export class DispatchService {
  /**
   * List all current tracking dispatches
   */
  public static getAllJobs(): DispatchJob[] {
    return DISPATCH_JOBS_STORE;
  }

  /**
   * Initializes a dispatch job for an assignment
   */
  public static createDispatch(job: Omit<DispatchJob, 'id' | 'status' | 'lastUpdated'>): DispatchJob {
    const newJob: DispatchJob = {
      id: `dsp-${Math.floor(800 + Math.random() * 199)}`,
      status: 'Dispatched',
      lastUpdated: new Date().toISOString(),
      ...job
    };
    DISPATCH_JOBS_STORE.push(newJob);
    return newJob;
  }

  /**
   * Updates state coordinates and counts down ETA
   */
  public static updateLocation(id: string, lat: number, lng: number, etaDelta: number): boolean {
    const job = DISPATCH_JOBS_STORE.find(j => j.id === id);
    if (!job) return false;

    job.coordinates = { lat, lng };
    job.etaMinutes = Math.max(0, job.etaMinutes - etaDelta);
    job.lastUpdated = new Date().toISOString();
    return true;
  }

  /**
   * Sets dispatch state
   */
  public static updateStatus(id: string, status: DispatchJob['status']): boolean {
    const job = DISPATCH_JOBS_STORE.find(j => j.id === id);
    if (!job) return false;

    job.status = status;
    if (status === 'Completed' || status === 'On Site') {
      job.etaMinutes = 0;
    }
    job.lastUpdated = new Date().toISOString();
    return true;
  }

  /**
   * Exports full standard lightweight GeoJSON representation to power client tracking dashboards
   */
  public static getGeoJsonPayload(id: string) {
    const job = DISPATCH_JOBS_STORE.find(j => j.id === id);
    if (!job) return null;

    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [job.coordinates.lng, job.coordinates.lat] // GeoJSON standard: [Longitude, Latitude]
      },
      properties: {
        jobId: job.id,
        worker: job.workerName,
        task: job.jobType,
        destination: job.address,
        estimatedTimeArrivalMinutes: job.etaMinutes,
        status: job.status,
        updatedAt: job.lastUpdated
      }
    };
  }
}
