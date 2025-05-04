
'use client';

import React, { useState, useEffect } from 'react'; // Added useEffect
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as h3 from 'h3-js';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// Define Zod schema for form validation (matching IncidentReportInput)
const incidentSchema = z.object({
  zoneId: z.string().refine(h3.isValidCell, { // Use h3-js for validation
    message: 'Invalid H3 Zone ID format.',
  }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters long.' }).max(500, { message: 'Message cannot exceed 500 characters.' }),
  // Timestamp will be generated automatically
});

type IncidentFormValues = z.infer<typeof incidentSchema>;

export const IncidentForm: React.FC = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false); // State for location fetching

  const {
    register,
    handleSubmit,
    reset,
    setValue, // Use setValue to update form field
    formState: { errors },
    setError,
  } = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      zoneId: '',
      message: '',
    },
  });

  // Get current location (example using browser geolocation)
  const getCurrentLocationH3 = () => {
    if (!navigator.geolocation) {
       toast({ title: "Geolocation Not Supported", description: "Your browser doesn't support geolocation.", variant: "destructive" });
       return;
    }

    setIsFetchingLocation(true); // Start loading state
    navigator.geolocation.getCurrentPosition(
      (position) => {
        try {
            // Use resolution 2 to match the large hexagons on the map
            const h3Index = h3.latLngToCell(position.coords.latitude, position.coords.longitude, 2);
            setValue('zoneId', h3Index, { shouldValidate: true }); // Update form field using setValue
             toast({ title: "Location Fetched", description: `H3 Zone ID (Res 2): ${h3Index}` });
        } catch (error) {
            console.error("Error converting coordinates to H3:", error);
            toast({ title: "Error", description: "Could not determine H3 Zone ID.", variant: "destructive" });
        } finally {
            setIsFetchingLocation(false); // End loading state
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
         toast({ title: "Geolocation Error", description: "Could not get current location. Check browser permissions.", variant: "destructive" });
         setIsFetchingLocation(false); // End loading state on error
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // Options for better accuracy
    );
  };


  const onSubmit: SubmitHandler<IncidentFormValues> = async (data) => {
    setIsSubmitting(true);
    const timestamp = new Date().toISOString(); // Generate current timestamp

    const reportData = {
      ...data,
      timestamp,
    };

    console.log('Submitting report:', reportData);

    try {
      const response = await fetch('/api/submitReport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit report');
      }

      console.log('API Response:', result);
      toast({
        title: 'Report Submitted Successfully',
        description: result.message,
      });
      reset(); // Clear the form on success
    } catch (error: any) {
      console.error('Submission error:', error);
      toast({
        title: 'Submission Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
      // Optionally set form-level errors if the API provides specific field issues
      // setError('root.serverError', { type: response.status, message: error.message })
    } finally {
      setIsSubmitting(false);
    }
  };

  // Avoid hydration mismatch for navigator.geolocation check
  const [geolocationSupported, setGeolocationSupported] = useState<boolean | null>(null);
  useEffect(() => {
      setGeolocationSupported(typeof window !== 'undefined' && 'geolocation' in navigator);
  }, []);


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="zoneId">H3 Zone ID (Resolution 2)</Label>
         <div className="flex items-center gap-2">
            <Input
                id="zoneId"
                {...register('zoneId')}
                placeholder="e.g., 82801ffffffffff"
                className={errors.zoneId ? 'border-destructive' : ''}
                aria-invalid={errors.zoneId ? 'true' : 'false'}
            />
             {geolocationSupported !== null && ( // Only render button after check
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={getCurrentLocationH3}
                    className="shrink-0"
                    disabled={!geolocationSupported || isFetchingLocation} // Disable if not supported or fetching
                >
                    {isFetchingLocation ? (
                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        'Use Current Location'
                    )}
                </Button>
             )}
         </div>

        {errors.zoneId && (
          <p className="text-sm text-destructive mt-1">{errors.zoneId.message}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          The Uber H3 hexagon ID for the incident location (using resolution 2).
          <a href="https://h3geo.org/docs/core-library/overview/" target="_blank" rel="noopener noreferrer" className="underline ml-1">Learn more</a>.
        </p>
      </div>

      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          {...register('message')}
          placeholder="Describe the incident..."
          className={`min-h-[100px] ${errors.message ? 'border-destructive' : ''}`}
          aria-invalid={errors.message ? 'true' : 'false'}
        />
        {errors.message && (
          <p className="text-sm text-destructive mt-1">{errors.message.message}</p>
        )}
      </div>

      {/* Optional: Add fields for mediaUrl or reporterType if needed */}

      {errors.root?.serverError && (
          <p className="text-sm font-medium text-destructive">{errors.root.serverError.message}</p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
          </>
        ) : (
          'Submit Report'
        )}
      </Button>
    </form>
  );
};
