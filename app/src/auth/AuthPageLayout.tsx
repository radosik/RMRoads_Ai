import { ReactNode } from "react";

export function AuthPageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="rmr-grid-bg flex min-h-[calc(100vh-4rem)] flex-col justify-center bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full sm:max-w-md">
        <div className="rmr-panel bg-card px-4 py-8 text-foreground shadow-xl sm:rounded-lg sm:px-10">
          <div className="-mt-8 [&_input]:bg-background [&_input]:text-foreground [&_input]:border-border [&_label]:text-foreground [&_a]:text-secondary">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
