import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingScreen() {
  return (
    <div className="animate-fade-in">
      {/* Filter skeleton */}
      <div className="mb-4">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
      
      {/* Course cards grid skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border rounded-lg p-3 space-y-3">
            {/* Course title */}
            <Skeleton className="h-4 w-3/4" />
            
            {/* Full title */}
            <Skeleton className="h-3 w-full" />
            
            {/* Course details */}
            <div className="space-y-2">
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            
            {/* Rating */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-8" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Workload overview skeleton */}
      <div className="mt-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="text-center space-y-2">
              <Skeleton className="h-4 w-16 mx-auto" />
              <Skeleton className="h-8 w-12 mx-auto rounded" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Export button skeleton */}
      <div className="mt-6">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}