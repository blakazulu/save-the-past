import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HomeIcon, CameraIcon, GalleryIcon, SettingsIcon } from '@/components/icons';

export function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <nav
      className="safe-area-bottom bg-white border-t border-sand"
      role="navigation"
      aria-label={t('nav.mainNavigation', 'Main navigation')}
    >
      <div className="flex justify-around items-center h-16">
        <NavLink
          to="/"
          icon={<HomeIcon />}
          label={t('nav.home')}
          active={location.pathname === '/'}
        />
        <NavLink
          to="/capture"
          icon={<CameraIcon />}
          label={t('nav.capture')}
          active={location.pathname === '/capture'}
        />
        <NavLink
          to="/gallery"
          icon={<GalleryIcon />}
          label={t('nav.gallery')}
          active={location.pathname === '/gallery' || location.pathname.startsWith('/artifact/')}
        />
        <NavLink
          to="/settings"
          icon={<SettingsIcon />}
          label={t('nav.settings')}
          active={location.pathname === '/settings'}
        />
      </div>
    </nav>
  );
}

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

function NavLink({ to, icon, label, active }: NavLinkProps) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
        active ? 'text-terracotta' : 'text-text-secondary hover:text-clay'
      }`}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
    >
      <span aria-hidden="true">{icon}</span>
      <span className="text-xs">{label}</span>
    </Link>
  );
}
