import type { ReactNode } from 'react';

type PageShellProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  sidebar?: ReactNode;
  children: ReactNode;
  fullWidth?: boolean;
};

export default function PageShell({ 
  title, 
  description, 
  actions, 
  sidebar, 
  children,
  fullWidth = false 
}: PageShellProps) {
  const containerClass = fullWidth 
    ? "w-full px-4 sm:px-6 lg:px-8" 
    : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8";

  return (
    <div className={containerClass}>
      <div className="flex flex-col lg:flex-row lg:items-start gap-6 py-8">
        <main className="flex-1 space-y-6">
          {/* Only show header card if title or description exists */}
          {(title || description) && (
            <div className="bg-navy-800 shadow-lg rounded-lg border border-navy-600 p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold text-white">{title}</h1>
                  {description && <p className="mt-1 text-sm text-gray-400">{description}</p>}
                </div>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
              </div>
            </div>
          )}

          {children}
        </main>

        {sidebar && (
          <aside className="w-full lg:w-80">
            <div className="bg-navy-800 shadow-lg rounded-lg border border-navy-600 overflow-hidden">
              {sidebar}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
