import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HomeIcon, CameraIcon, GalleryIcon, MuseumIcon, LanguageIcon } from '@/components/icons';

export function BottomNav() {
  const { t, i18n } = useTranslation();
  const location = useLocation();

  // Hide nav on fullscreen pages
  if (location.pathname === '/virtual-tour') {
    return null;
  }

  const toggleLanguage = () => {
    const newLang = i18n.language === 'he' ? 'en' : 'he';
    i18n.changeLanguage(newLang);
  };

  // Get short language code for display
  const langLabel = i18n.language === 'he' ? 'עב' : 'EN';

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 safe-area-bottom z-40 transform-gpu"
      role="navigation"
      aria-label={t('nav.mainNavigation', 'Main navigation')}
    >
      {/* Centered container for tablet max-width */}
      <div className="max-w-3xl mx-auto">
        {/* Top decorative border */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sepia/40 to-transparent" />

        {/* Navigation background - journal tabs style */}
        <div className="glass-parchment border-t border-sepia/10 md:border-x md:border-sepia/10">
          <div className="flex justify-around items-stretch h-16">
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
              to="/museum"
              icon={<MuseumIcon />}
              label={t('nav.museum')}
              active={location.pathname === '/museum' || location.pathname.startsWith('/museum/')}
            />
            <LanguageToggle
              icon={<LanguageIcon />}
              label={langLabel}
              onClick={toggleLanguage}
            />
          </div>
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

interface LanguageToggleProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function LanguageToggle({ icon, label, onClick }: LanguageToggleProps) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center justify-center gap-1 px-4 py-2 transition-all duration-200 text-text-muted hover:text-earth"
      aria-label="Toggle language"
    >
      {/* Icon container */}
      <span className="relative p-1.5 rounded-lg transition-all duration-200" aria-hidden="true">
        <span className="block w-5 h-5 transition-transform">
          {icon}
        </span>
      </span>

      {/* Language code label */}
      <span className="text-md font-semibold tracking-wide">
        {label}
      </span>
    </button>
  );
}
