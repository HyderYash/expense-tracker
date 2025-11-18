import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function TableSkeleton() {
  return (
    <Card className="shadow-lg border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl">
      <CardHeader className="pb-4">
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 flex-1 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function CardSkeleton() {
  return (
    <Card className="border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl">
      <CardHeader>
        <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-2" />
      </CardHeader>
      <CardContent>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </CardContent>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      <TableSkeleton />
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

