"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Something went wrong!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={reset}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

