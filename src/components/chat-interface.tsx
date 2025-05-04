'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { processChat, submitCollectedIncident, type ChatMessage, type IncidentChatOutput } from '@/ai/flows/incident-chat-flow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ThumbsUp, ThumbsDown } from 'lucide-react';


export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', content: "Hello! I'm here to help you report an environmental incident. Could you please tell me where it occurred and describe what happened?" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [collectedData, setCollectedData] = useState<{ zoneId?: string; description?: string }>({});
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Scroll to bottom when messages update
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = useCallback(async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;

    const newUserMessage: ChatMessage = { role: 'user', content: messageContent.trim() };
    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsComplete(false); // Reset completion state on new message
    setCollectedData({}); // Reset collected data

    try {
       // Prepare history in the correct format for the flow
       const flowHistory: ChatMessage[] = messages.map(msg => ({
          role: msg.role,
          content: msg.content,
       }));

       // Make sure history doesn't include the initial message if it was just added
       if (flowHistory.length > 0 && flowHistory[flowHistory.length - 1].role === 'user') {
         // This is redundant with how setMessages is called, but safe to double-check
         // flowHistory = flowHistory.slice(0, -1); // Use history before the new user message
       }


      // Use the correct input structure for the flow
      const result: IncidentChatOutput = await processChat({
        history: flowHistory, // Send the history BEFORE the current user message
        message: newUserMessage.content, // Send the current user message
      });

      const newModelMessage: ChatMessage = { role: 'model', content: result.response };
      setMessages(prev => [...prev, newModelMessage]);

      // Check if AI marked as complete and store data
      if (result.isComplete && result.zoneId && result.description) {
        setIsComplete(true);
        setCollectedData({ zoneId: result.zoneId, description: result.description });
      }

    } catch (error) {
      console.error('Chat processing error:', error);
      let errorMessageContent = 'Sorry, I encountered an error. Please try again.';
      if (error instanceof Error) {
        errorMessageContent = `Error: ${error.message}. Please try again.`;
      }
      const errorMessage: ChatMessage = { role: 'model', content: errorMessageContent };
      setMessages(prev => [...prev, errorMessage]);
      toast({
        title: "Error",
        description: "Could not process your message.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, toast]); // Removed flowHistory from dependencies

  const handleConfirmation = async (confirmed: boolean) => {
     if (!isComplete || !collectedData.zoneId || !collectedData.description) return;

     setIsLoading(true);
     setIsComplete(false); // Prevent further confirmations

     if (confirmed) {
        try {
            // Call the server action/function to submit the data
            const submissionResult = await submitCollectedIncident(collectedData.zoneId, collectedData.description);
            const confirmationMessage: ChatMessage = { role: 'model', content: submissionResult.message };
            setMessages(prev => [...prev, confirmationMessage]);
             toast({
                title: "Success",
                description: submissionResult.message,
             });
             // Optionally reset the chat or navigate away
             // setMessages([ { role: 'model', content: "Report submitted! Do you need help with anything else?" } ]);

        } catch (error) {
            console.error("Submission error:", error);
            const errorMessage: ChatMessage = { role: 'model', content: 'Sorry, there was an error submitting your report. Please try again later.' };
            setMessages(prev => [...prev, errorMessage]);
            toast({
                title: "Submission Failed",
                description: "Could not submit the incident report.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }

     } else {
        // User rejected the summary, ask for correction
        const correctionRequest: ChatMessage = { role: 'model', content: "Okay, what needs to be corrected in the report summary?" };
        setMessages(prev => [...prev, correctionRequest]);
        setIsLoading(false); // Allow user to respond
     }
     setCollectedData({}); // Clear collected data after confirmation attempt
  }


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-200px)] w-full max-w-2xl mx-auto bg-card border border-border rounded-lg shadow-lg overflow-hidden">
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] whitespace-pre-wrap shadow-sm ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground' // User message uses primary color
                    : 'bg-secondary text-secondary-foreground' // Model message uses secondary color
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-lg px-4 py-2 bg-secondary text-secondary-foreground flex items-center shadow-sm">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Thinking...
              </div>
            </div>
          )}
          {isComplete && collectedData.zoneId && collectedData.description && (
             <Alert variant="default" className="bg-accent/10 border-accent/30 text-accent-foreground"> {/* Use accent for confirmation */}
                <AlertTitle className="font-semibold">Confirm Report Details</AlertTitle>
                <AlertDescription>
                  Please review the information below:
                  <ul className="list-disc pl-5 mt-2">
                    <li><strong>Zone ID:</strong> {collectedData.zoneId}</li>
                    <li><strong>Description:</strong> {collectedData.description}</li>
                  </ul>
                  Is this correct?
                </AlertDescription>
                <div className="mt-4 flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => handleConfirmation(false)} disabled={isLoading} className="border-accent/50 text-accent-foreground hover:bg-accent/20">
                        <ThumbsDown className="mr-1 h-4 w-4" /> No, correct it
                    </Button>
                    <Button variant="default" size="sm" onClick={() => handleConfirmation(true)} disabled={isLoading} className="bg-accent text-accent-foreground hover:bg-accent/90">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsUp className="mr-1 h-4 w-4" />} Yes, submit
                    </Button>
                </div>
             </Alert>
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-border bg-card"> {/* Use card background */}
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Type your message..."
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isComplete} // Disable input when loading or confirmation pending
            className="flex-grow bg-input text-foreground placeholder:text-muted-foreground focus:ring-ring" // Use input/ring colors
            aria-label="Chat message input"
          />
          <Button
            onClick={() => handleSendMessage(inputValue)}
            disabled={isLoading || !inputValue.trim() || isComplete}
            aria-label="Send message"
            size="icon"
            variant="ghost" // Use ghost variant for send button
            className="text-primary hover:bg-primary/10 hover:text-primary"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
