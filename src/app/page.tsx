
import { MapComponent } from '@/components/map-component';

export default function Home() {
  return (
    <div className="flex-grow flex flex-col">
      {/* Section 3: Live Map */}
      <section className="flex-grow bg-card rounded-lg shadow-sm border overflow-hidden relative">
         {/* Map container takes full height and width of its parent */}
         <div id="map-container" className="absolute inset-0">
             <MapComponent />
         </div>
         {/* Map Legend (Positioned absolutely or relatively as needed) */}
         <div className="absolute bottom-4 left-4 z-10 bg-card/80 p-2 rounded shadow border backdrop-blur-sm">
             <div className="flex items-center gap-4 text-sm text-muted-foreground">
                 <div className="flex items-center gap-2">
                     <span className="h-3 w-3 rounded-full bg-primary"></span> Verified
                 </div>
                 <div className="flex items-center gap-2">
                     <span className="h-3 w-3 rounded-full bg-accent"></span> Unverified
                 </div>
             </div>
         </div>
      </section>
    </div>
  );
}
