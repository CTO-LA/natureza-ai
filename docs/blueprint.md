# **App Name**: Natureza AI Prototype

## Core Features:

- Hexagon Map Visualization: Display a Mapbox GL JS map with H3 hexagon overlays, styled to represent different incident statuses. The map is centered on a default location and uses mock data for the hexagon overlays.
- Mock Incident Report Submission: Implement a mock HTTP Cloud Function endpoint `/submitReport` that receives incident reports, performs basic validation, and logs the data. Returns success or error messages in JSON format.
- AI-Powered Verification Tool: Use an AI tool to analyze incoming incident reports and autonomously determine the level of verification needed based on the report's content and source.

## Style Guidelines:

- Primary color: Use a calming green (#4CAF50) to represent nature and safety.
- Secondary color: A neutral light gray (#F5F5F5) for backgrounds and subtle elements.
- Accent: A muted orange (#FF9800) for interactive elements and highlights to draw attention without being alarming.
- Clean and minimalist layout to ensure ease of navigation and readability.
- Use simple, intuitive icons to represent different incident types and statuses on the map.