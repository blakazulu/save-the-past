import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HomeIcon, CameraIcon, GalleryIcon, SettingsIcon } from '@/components/icons';

export function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 safe-area-bottom z-40"
      role="navigation"
      aria-label={t('nav.mainNavigation', 'Main navigation')}
    >
      {/* Top decorative border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sepia/40 to-transparent" />

      {/* Navigation background - journal tabs style */}
      <div className="glass-parchment border-t border-sepia/10">
        <div className="flex justify-around items-stretch h-16 max-w-lg mx-auto">
          <NavTab
            to="/"
            icon={<HomeIcon />}
            label={t('nav.home')}
            active={location.pathname === '/'}
          />
          <NavTab
            to="/capture"
            icon={<CameraIcon />}
            label={t('nav.capture')}
            active={location.pathname === '/capture'}
          />
          <NavTab
            to="/gallery"
            icon={<GalleryIcon />}
            label={t('nav.gallery')}
            active={location.pathname === '/gallery' || location.pathname.startsWith('/artifact/')}
          />
          <NavTab
            to="/settings"
            icon={<SettingsIcon />}
            label={t('nav.settings')}
            active={location.pathname === '/settings'}
          />
        </div>
      </div>
    </nav>
  );
}

interface NavTabProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

function NavTab({ to, icon, label, active }: NavTabProps) {
  return (
    <Link
      to={to}
      className={`relative flex flex-col items-center justify-center gap-1 px-4 py-2 transition-all duration-200 ${active
          ? 'text-terracotta'
          : 'text-text-muted hover:text-earth'
        }`}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
    >
      {/* Active indicator - tab fold effect */}
      {active && (
        <div className="absolute -top-px left-2 right-2 h-0.5 bg-terracotta rounded-b-full" />
      )}

      {/* Icon container with subtle background when active */}
      <span
        className={`relative p-1.5 rounded-lg transition-all duration-200 ${active ? 'bg-terracotta/10' : ''
          }`}
        aria-hidden="true"
      >
        <span className={`block w-5 h-5 ${active ? 'scale-110' : ''} transition-transform`}>
          {icon}
        </span>
      </span>

      {/* Label */}
      <span className={`text-md font-medium tracking-wide ${active ? 'font-semibold' : ''
        }`}>
        {label}
      </span>
    </Link>
  );
}
