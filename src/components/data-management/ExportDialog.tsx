import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import JSZip from 'jszip';
import { db } from '@/lib/db';
import { DownloadIcon } from '@/components/icons';
import { logger } from '@/lib/utils/logger';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportDialog({ isOpen, onClose }: ExportDialogProps) {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const artifacts = useLiveQuery(() => db.artifacts.toArray());

  if (!isOpen) return null;

  const handleExport = async () => {
    if (!artifacts || artifacts.length === 0) return;

    setIsExporting(true);
    setProgress(0);

    try {
      const zip = new JSZip();
      const totalItems = artifacts.length;
      let processedItems = 0;

      // Export each artifact
      for (const artifact of artifacts) {
        const artifactFolder = zip.folder(`artifact-${artifact.id}`);
        if (!artifactFolder) continue;

        // Export artifact metadata
        const artifactData = {
          ...artifact,
          thumbnailBlob: undefined, // Don't include thumbnail in JSON
        };
        artifactFolder.file('artifact.json', JSON.stringify(artifactData, null, 2));

        // Export images
        const images = await db.images
          .where('artifactId')
          .equals(artifact.id)
          .toArray();

        for (const image of images) {
          const extension = getImageExtension(image.blob.type);
          artifactFolder.file(
            `images/${image.id}-${image.angle}.${extension}`,
            image.blob
          );
        }

        // Export image metadata
        const imagesData = images.map((img) => ({
          ...img,
          blob: undefined, // Don't include blob in JSON
        }));
        artifactFolder.file('images.json', JSON.stringify(imagesData, null, 2));

        // Export 3D model if exists
        if (artifact.model3DId) {
          const model = await db.models.get(artifact.model3DId);
          if (model) {
            artifactFolder.file(`model.${model.format}`, model.blob);
            const modelData = { ...model, blob: undefined };
            artifactFolder.file('model.json', JSON.stringify(modelData, null, 2));
          }
        }

        // Export info card if exists
        if (artifact.infoCardId) {
          const infoCard = await db.infoCards.get(artifact.infoCardId);
          if (infoCard) {
            artifactFolder.file('infocard.json', JSON.stringify(infoCard, null, 2));
          }
        }

        processedItems++;
        setProgress((processedItems / totalItems) * 100);
      }

      // Generate the ZIP file
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      // Download the ZIP file
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `save-the-past-export-${new Date().toISOString().split('T')[0]}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      logger.error('Export failed:', error);
      alert(t('dataManagement.exportError', 'Export failed. Please try again.'));
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-burnt/60 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="parchment-card corners-decorated p-6 w-full max-w-md animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-terracotta to-clay flex items-center justify-center">
            <DownloadIcon className="w-5 h-5 text-parchment-light" />
          </div>
          <h2 className="font-display text-xl font-semibold text-earth">
            {t('dataManagement.exportTitle', 'Export Data')}
          </h2>
        </div>

        <p className="text-text-secondary mb-4">
          {t(
            'dataManagement.exportDescription',
            'Export all artifacts, photos, 3D models, and info cards to a ZIP file.'
          )}
        </p>

        {artifacts && (
          <p className="text-base text-text-muted font-manuscript italic mb-4">
            {t('dataManagement.artifactCount', '{{count}} artifacts will be exported', {
              count: artifacts.length,
            })}
          </p>
        )}

        {/* Progress bar */}
        {isExporting && (
          <div className="mb-6">
            <div className="h-2 bg-sand/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-terracotta to-clay rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-base text-text-secondary text-center mt-2 font-manuscript">
              {Math.round(progress)}%
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="btn-parchment flex-1 disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || !artifacts || artifacts.length === 0}
            className="btn-seal flex-1 text-base disabled:opacity-50"
          >
            {isExporting
              ? t('dataManagement.exporting', 'Exporting...')
              : t('dataManagement.export', 'Export')}
          </button>
        </div>
      </div>
    </div>
  );
}

function getImageExtension(mimeType: string): string {
  const types: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  };
  return types[mimeType] || 'jpg';
}
