import type { ReactNode } from 'react';

type PageShellProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  sidebar?: ReactNode;
  children: ReactNode;
};

export default function PageShell({ title, description, actions, sidebar, children }: PageShellProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        <main className="flex-1 space-y-6">
          <div className="bg-white shadow rounded-lg border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
                {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          </div>

          {children}
        </main>

        {sidebar && (
          <aside className="w-full lg:w-80">
            <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
              {sidebar}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
