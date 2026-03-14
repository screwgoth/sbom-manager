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
    ? "w-full px-6 sm:px-8 lg:px-10" 
    : "max-w-7xl mx-auto px-6 sm:px-8 lg:px-10";

  return (
    <div className={containerClass}>
      <div className="flex flex-col lg:flex-row lg:items-start gap-8 py-10">
        <main className="flex-1 space-y-8">
          {/* Only show header card if title or description exists */}
          {(title || description) && (
            <div className="bg-bg-card shadow-lg rounded-xl border border-border p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <h1 className="text-3xl font-semibold text-text-primary">{title}</h1>
                  {description && <p className="mt-2 text-base text-text-secondary">{description}</p>}
                </div>
                {actions && <div className="flex items-center gap-3">{actions}</div>}
              </div>
            </div>
          )}

          {children}
        </main>

        {sidebar && (
          <aside className="w-full lg:w-96">
            <div className="bg-bg-card shadow-lg rounded-xl border border-border overflow-hidden">
              {sidebar}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
