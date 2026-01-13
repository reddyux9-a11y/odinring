import { Card, CardContent, CardHeader } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

export const LinkSkeletonLoader = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <Card key={i} className="animate-pulse">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-5 w-5" />
            <div className="flex-1">
              <Skeleton className="h-14 w-full rounded-md" />
              <div className="flex items-center space-x-4 mt-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export const AnalyticsSkeletonLoader = () => (
  <div className="space-y-6">
    {/* Overview Cards */}
    <div className="grid md:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-5 w-5" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Top Performing Link */}
    <Card className="animate-pulse">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Link Performance */}
    <Card className="animate-pulse">
      <CardHeader>
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-6 w-6" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-5 w-8" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

export const ProfileSkeletonLoader = () => (
  <div className="space-y-6">
    <Card className="animate-pulse">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
            <div className="flex items-center space-x-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>

    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="flex-1 h-10" />
      ))}
    </div>

    <LinkSkeletonLoader />
  </div>
);

export const PublicProfileSkeletonLoader = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="max-w-sm mx-auto bg-white min-h-screen shadow-lg">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-gray-900 to-black p-6 text-white">
        <div className="text-center pt-4 animate-pulse">
          <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4 bg-white/20" />
          <Skeleton className="h-6 w-32 mx-auto mb-2 bg-white/20" />
          <Skeleton className="h-4 w-48 mx-auto mb-6 bg-white/20" />
          <div className="flex justify-center space-x-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-8 bg-white/20" />
            ))}
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="p-6 space-y-4 animate-pulse">
        <Skeleton className="h-16 w-full" />
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  </div>
);

export const ChartSkeletonLoader = ({ height = "h-64 sm:h-80" }) => {
  // Generate consistent heights for skeleton bars
  const barHeights = [65, 45, 75, 55, 85, 40, 70].map(h => `${h}%`);
  
  return (
    <div className={`w-full ${height} relative overflow-hidden rounded-lg`}>
      {/* Chart container skeleton */}
      <div className="absolute inset-0 flex flex-col justify-end p-4">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-4 bottom-12 flex flex-col justify-between w-8 pr-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-3 w-6" />
          ))}
        </div>
        
        {/* Chart area with animated bars */}
        <div className="flex-1 ml-10 mr-2 mb-8 flex items-end justify-between gap-2">
          {barHeights.map((height, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2">
              {/* Bar/Area representation with shimmer */}
              <div 
                className="w-full rounded-t-md bg-gradient-to-t from-primary/30 via-primary/20 to-primary/10 relative overflow-hidden animate-pulse"
                style={{ height }}
              >
                {/* Shimmer overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent shimmer-animation" />
              </div>
              {/* X-axis label */}
              <Skeleton className="h-2.5 w-8" />
            </div>
          ))}
        </div>
        
        {/* Grid lines */}
        <div className="absolute inset-0 ml-10 mr-2 mb-8 flex flex-col justify-between pointer-events-none">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-full border-t border-dashed border-muted/50" />
          ))}
        </div>
      </div>
      
    </div>
  );
};