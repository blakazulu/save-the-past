import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
