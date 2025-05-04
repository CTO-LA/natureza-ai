
import { IncidentForm } from '@/components/incident-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReportIncidentPage() {
  return (
    <div className="flex justify-center items-start pt-8 md:pt-12 px-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Report an Incident</CardTitle>
          <CardDescription>
            Help map community resilience by submitting an incident report. Your privacy is protected through decentralized and encrypted data handling.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IncidentForm />
        </CardContent>
      </Card>
    </div>
  );
}
