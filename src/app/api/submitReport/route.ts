import { type NextRequest, NextResponse } from 'next/server';
import { type IncidentReportInput } from '@/packages/shared/types'; // Use the input type
import { verifyIncidentReport } from '@/ai/flows/verify-incident-report'; // Import the AI flow

// Basic validation function
function validateReport(report: any): report is IncidentReportInput {
  return (
    report &&
    typeof report.zoneId === 'string' && report.zoneId.trim() !== '' &&
    typeof report.message === 'string' && report.message.trim() !== '' &&
    typeof report.timestamp === 'string' && !isNaN(Date.parse(report.timestamp)) // Basic ISO 8601 check
  );
}

export async function POST(request: NextRequest) {
  try {
    const reportData: IncidentReportInput = await request.json();

    // Log received data (optional, for debugging)
    console.log('Received report data:', reportData);

    // Basic mock validation
    if (!validateReport(reportData)) {
      console.error('Invalid report data:', reportData);
      return NextResponse.json(
        { status: 'error', message: 'Invalid report data.' },
        { status: 400 }
      );
    }

    // --- AI Verification Step ---
    try {
        // Prepare input for the AI flow
        const aiInput = {
            report: {
                zoneId: reportData.zoneId,
                message: reportData.message,
                timestamp: reportData.timestamp,
                // reporterType and mediaUrl can be added here if available/needed
                // reporterType: 'citizen', // Example default
            },
        };

        console.log('Sending report to AI for verification:', aiInput);
        const verificationResult = await verifyIncidentReport(aiInput);
        console.log('AI Verification Result:', verificationResult);

        // You can now use the verificationResult (e.g., store it with the report)
        // For this prototype, we just log it.

    } catch (aiError) {
        console.error('AI verification failed:', aiError);
        // Decide how to handle AI errors. Maybe proceed without verification or return an error.
        // For now, log the error and continue.
    }
    // --- End AI Verification Step ---


    // Simulate successful processing (e.g., saving to a database)
    console.log('Mock report processed successfully:', reportData);

    // Respond with success
    return NextResponse.json(
      { status: 'success', message: 'Mock report received and verified (mock).' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error processing report:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
