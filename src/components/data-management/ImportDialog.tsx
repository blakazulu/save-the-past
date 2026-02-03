import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import JSZip from 'jszip';
import { db } from '@/lib/db';
import { UploadIcon } from '@/components/icons';
import { logger } from '@/lib/utils/logger';
import { useToast } from '@/hooks/useToast';
import type { Artifact, ArtifactImage, Model3D, InfoCard } from '@/types';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportDialog({ isOpen, onClose }: ImportDialogProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.zip')) {
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setProgress(0);

    try {
      const zip = await JSZip.loadAsync(selectedFile);
      const folders = Object.keys(zip.files)
        .filter((path) => path.includes('/artifact.json'))
        .map((path) => path.split('/')[0]);

      const totalItems = folders.length;
      let processedItems = 0;

      for (const folderName of folders) {
        const folder = zip.folder(folderName);
        if (!folder) continue;

        // Read artifact metadata
        const artifactJsonFile = folder.file('artifact.json');
        if (!artifactJsonFile) continue;

        const artifactJson = await artifactJsonFile.async('string');
        const artifactData = JSON.parse(artifactJson) as Artifact;

        // Convert date strings back to Date objects
        artifactData.createdAt = new Date(artifactData.createdAt);
        artifactData.updatedAt = new Date(artifactData.updatedAt);

        // Check if artifact already exists
        const existingArtifact = await db.artifacts.get(artifactData.id);
        if (existingArtifact) {
          // Skip or update - for now we skip duplicates
          processedItems++;
          setProgress((processedItems / totalItems) * 100);
          continue;
        }

        // Import images
        const imagesJsonFile = folder.file('images.json');
        if (imagesJsonFile) {
          const imagesJson = await imagesJsonFile.async('string');
          const imagesData = JSON.parse(imagesJson) as ArtifactImage[];

          for (const imageData of imagesData) {
            // Find the image file
            const imageFiles = Object.keys(folder.files).filter(
              (path) => path.includes(`images/${imageData.id}`)
            );

            if (imageFiles.length > 0) {
              const imageFile = folder.file(imageFiles[0].replace(`${folderName}/`, ''));
              if (imageFile) {
                const imageBlob = await imageFile.async('blob');
                await db.images.add({
                  ...imageData,
                  createdAt: new Date(imageData.createdAt),
                  blob: imageBlob,
                });
              }
            }
          }
        }

        // Import 3D model
        const modelJsonFile = folder.file('model.json');
        if (modelJsonFile && artifactData.model3DId) {
          const modelJson = await modelJsonFile.async('string');
          const modelData = JSON.parse(modelJson) as Model3D;

          const modelFile = folder.file(`model.${modelData.format}`);
          if (modelFile) {
            const modelBlob = await modelFile.async('blob');
            await db.models.add({
              ...modelData,
              createdAt: new Date(modelData.createdAt),
              blob: modelBlob,
            });
          }
        }

        // Import info card
        const infoCardFile = folder.file('infocard.json');
        if (infoCardFile && artifactData.infoCardId) {
          const infoCardJson = await infoCardFile.async('string');
          const infoCardData = JSON.parse(infoCardJson) as InfoCard;
          await db.infoCards.add({
            ...infoCardData,
            createdAt: new Date(infoCardData.createdAt),
            updatedAt: new Date(infoCardData.updatedAt),
          });
        }

        // Import artifact
        await db.artifacts.add(artifactData);

        processedItems++;
        setProgress((processedItems / totalItems) * 100);
      }

      toast.success(t('dataManagement.importSuccess', 'Import completed successfully'));
      onClose();
    } catch (error) {
      logger.error('Import failed:', error);
      toast.error(t('dataManagement.importError', 'Import failed. Please check the file and try again.'));
    } finally {
      setIsImporting(false);
      setProgress(0);
      setSelectedFile(null);
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
            <UploadIcon className="w-5 h-5 text-parchment-light" />
          </div>
          <h2 className="font-display text-xl font-semibold text-earth">
            {t('dataManagement.importTitle', 'Import Data')}
          </h2>
        </div>

        <p className="text-text-secondary mb-6">
          {t(
            'dataManagement.importDescription',
            'Import artifacts from a previously exported ZIP file.'
          )}
        </p>

        {/* File selector */}
        <div className="mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className={`w-full p-6 border-2 border-dashed rounded transition-all duration-200 flex flex-col items-center gap-2 ${
              selectedFile
                ? 'border-terracotta bg-terracotta/5'
                : 'border-sepia/30 hover:border-terracotta hover:bg-sand/30'
            }`}
          >
            <UploadIcon className={`w-8 h-8 ${selectedFile ? 'text-terracotta' : 'text-text-muted'}`} />
            <span className={`text-base ${selectedFile ? 'text-terracotta font-medium' : 'text-text-muted'}`}>
              {selectedFile
                ? selectedFile.name
                : t('dataManagement.selectFile', 'Select ZIP file')}
            </span>
          </button>
        </div>

        {/* Progress bar */}
        {isImporting && (
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
            disabled={isImporting}
            className="btn-parchment flex-1 disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleImport}
            disabled={isImporting || !selectedFile}
            className="btn-seal flex-1 text-base disabled:opacity-50"
          >
            {isImporting
              ? t('dataManagement.importing', 'Importing...')
              : t('dataManagement.import', 'Import')}
          </button>
        </div>
      </div>
    </div>
  );
}
