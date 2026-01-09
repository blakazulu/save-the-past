import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout';
import { MuseumGrid, MuseumEmpty } from '@/components/museum';
import { fetchMuseumArtifacts } from '@/lib/firebase/museumService';
import type { MuseumArtifact } from '@/types/museum';

export default function MuseumPage() {
  const { t } = useTranslation();
  const [artifacts, setArtifacts] = useState<MuseumArtifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  
  // Fetch museum artifacts
  useEffect(() => {
    let mounted = true;

    async function loadArtifacts() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchMuseumArtifacts();
        if (mounted) {
          setArtifacts(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadArtifacts();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-dvh flex flex-col">
      <PageHeader title={t('museum.title')} backTo="/" />

      <main className="flex-1 flex flex-col p-4 pb-20">
        <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
          {/* Description */}
          <p className="text-text-secondary mb-4 text-center">
            {t('museum.subtitle')}
          </p>

          {/* Virtual Tour Entry */}
          <div className="mb-6 flex justify-center">
            <Link
              to="/virtual-tour"
              className="inline-flex items-center gap-3 px-6 py-3 bg-terracotta hover:bg-clay text-sand rounded-xl font-medium transition-colors shadow-lg"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {t('virtualTour.enterTour', 'Enter Virtual Tour')}
            </Link>
          </div>

          {/* Content */}
          {loading ? (
            <MuseumEmpty variant="loading" />
          ) : error ? (
            <MuseumEmpty variant="error" error={error} />
          ) : artifacts.length === 0 ? (
            <MuseumEmpty variant="no-artifacts" />
          ) : (
            <MuseumGrid artifacts={artifacts} />
          )}
        </div>
      </main>
    </div>
  );
}
