
import { ChatInterface } from '@/components/chat-interface';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReportIncidentPage() {
  return (
    <div className="flex-grow flex flex-col items-center justify-center p-4">
       <Card className="w-full max-w-2xl shadow-lg h-full max-h-[calc(100vh-150px)] flex flex-col"> {/* Adjust height as needed */}
        <CardHeader className="flex-shrink-0">
          <CardTitle className="text-2xl">Report an Incident via Chat</CardTitle>
          <CardDescription>
            Chat with our AI assistant to report an environmental incident.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden p-0"> {/* Remove padding and allow content to grow */}
          <ChatInterface />
        </CardContent>
      </Card>
    </div>
  );
}
