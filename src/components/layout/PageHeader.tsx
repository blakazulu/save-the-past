import { Link } from 'react-router-dom';
import { BackIcon } from '@/components/icons';

interface PageHeaderProps {
  title: string;
  backTo?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, backTo, action }: PageHeaderProps) {
  return (
    <header className="safe-area-top bg-terracotta text-white p-4">
      <div className="max-w-4xl mx-auto flex items-center gap-4">
        {backTo && (
          <Link
            to={backTo}
            className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <BackIcon />
          </Link>
        )}
        <h1 className="text-xl font-bold flex-1">{title}</h1>
        {action}
      </div>
    </header>
  );
}
