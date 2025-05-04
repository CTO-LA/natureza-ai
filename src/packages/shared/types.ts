// packages/shared/types.ts
export interface IncidentReport {
  zoneId: string; // Uber H3 Hexagon ID
  message: string;
  mediaUrl?: string; // Optional URL for associated media
  timestamp: string; // ISO 8601 format recommended
  reporterType?: 'citizen' | 'sensor' | 'verified_partner'; // Example types
}

// Added for the form, aligning with AI input but keeping IncidentReport as the core type
export interface IncidentReportInput {
   zoneId: string;
   message: string;
   timestamp: string; // ISO 8601 format
   // mediaUrl and reporterType are optional and handled separately if needed
}
