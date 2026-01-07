import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import JSZip from 'jszip';
import { db } from '@/lib/db';

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
      console.error('Export failed:', error);
      alert(t('dataManagement.exportError', 'Export failed. Please try again.'));
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-earth mb-4">
          {t('dataManagement.exportTitle', 'Export Data')}
        </h2>

        <p className="text-text-secondary mb-6">
          {t(
            'dataManagement.exportDescription',
            'Export all artifacts, photos, 3D models, and info cards to a ZIP file.'
          )}
        </p>

        {artifacts && (
          <p className="text-sm text-text-secondary mb-4">
            {t('dataManagement.artifactCount', '{{count}} artifacts will be exported', {
              count: artifacts.length,
            })}
          </p>
        )}

        {isExporting && (
          <div className="mb-6">
            <div className="h-2 bg-sand rounded-full overflow-hidden">
              <div
                className="h-full bg-terracotta rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-text-secondary text-center mt-2">
              {Math.round(progress)}%
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="flex-1 py-3 border border-sand text-earth rounded-xl font-medium hover:bg-sand transition-colors disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || !artifacts || artifacts.length === 0}
            className="flex-1 py-3 bg-terracotta text-white rounded-xl font-semibold hover:bg-clay transition-colors disabled:opacity-50"
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
