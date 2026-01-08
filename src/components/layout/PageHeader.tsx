import { Link } from 'react-router-dom';
import { BackIcon } from '@/components/icons';

interface PageHeaderProps {
  title: string;
  backTo?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, backTo, action }: PageHeaderProps) {
  return (
    <header className="safe-area-top relative transform-gpu">
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-burnt/15 to-transparent pointer-events-none" />

      {/* Main header content */}
      <div className="relative glass-parchment border-b border-sepia/20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          {backTo && (
            <Link
              to={backTo}
              className="p-2 -ml-2 rounded-lg hover:bg-sand/50 transition-colors group"
              aria-label="Go back"
            >
              <BackIcon className="w-5 h-5 text-earth group-hover:text-terracotta transition-colors" />
            </Link>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="font-display text-lg font-semibold text-earth tracking-wide truncate">
              {title}
            </h1>
          </div>

          {action && (
            <div className="flex-shrink-0">
              {action}
            </div>
          )}
        </div>

        {/* Bottom decorative line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sepia/30 to-transparent" />
      </div>
    </header>
  );
}
