import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import JSZip from 'jszip';
import { db } from '@/lib/db';
import { UploadIcon } from '@/components/icons';
import type { Artifact, ArtifactImage, Model3D, InfoCard } from '@/types';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportDialog({ isOpen, onClose }: ImportDialogProps) {
  const { t } = useTranslation();
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

      onClose();
    } catch (error) {
      console.error('Import failed:', error);
      alert(t('dataManagement.importError', 'Import failed. Please check the file and try again.'));
    } finally {
      setIsImporting(false);
      setProgress(0);
      setSelectedFile(null);
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
          {t('dataManagement.importTitle', 'Import Data')}
        </h2>

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
            className="w-full p-6 border-2 border-dashed border-sand rounded-xl hover:border-terracotta transition-colors flex flex-col items-center gap-2"
          >
            <UploadIcon className="w-8 h-8 text-text-secondary" />
            <span className="text-sm text-text-secondary">
              {selectedFile
                ? selectedFile.name
                : t('dataManagement.selectFile', 'Select ZIP file')}
            </span>
          </button>
        </div>

        {isImporting && (
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
            disabled={isImporting}
            className="flex-1 py-3 border border-sand text-earth rounded-xl font-medium hover:bg-sand transition-colors disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleImport}
            disabled={isImporting || !selectedFile}
            className="flex-1 py-3 bg-terracotta text-white rounded-xl font-semibold hover:bg-clay transition-colors disabled:opacity-50"
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
