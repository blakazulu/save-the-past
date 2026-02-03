import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '@/lib/db';
import { TrashIcon } from '@/components/icons';
import { logger } from '@/lib/utils/logger';
import { useToast } from '@/hooks/useToast';
import type { Artifact } from '@/types';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  artifacts: Artifact[];
  onDeleted: () => void;
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  artifacts,
  onDeleted,
}: DeleteConfirmDialogProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || artifacts.length === 0) return null;

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      for (const artifact of artifacts) {
        // Delete related images
        await db.images.where('artifactId').equals(artifact.id).delete();

        // Delete 3D model if exists
        if (artifact.model3DId) {
          await db.models.delete(artifact.model3DId);
        }

        // Delete info card if exists
        if (artifact.infoCardId) {
          await db.infoCards.delete(artifact.infoCardId);
        }

        // Delete artifact
        await db.artifacts.delete(artifact.id);
      }

      onDeleted();
      onClose();
      toast.success(t('dataManagement.deleteSuccess', 'Deleted successfully'));
    } catch (error) {
      logger.error('Delete failed:', error);
      toast.error(t('dataManagement.deleteError', 'Delete failed. Please try again.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const count = artifacts.length;
  const isMultiple = count > 1;

  return (
    <div
      className="fixed inset-0 bg-burnt/60 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="parchment-card p-6 w-full max-w-md animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with warning icon */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-error/15 flex items-center justify-center border border-error/30">
            <TrashIcon className="w-6 h-6 text-error" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-earth">
              {isMultiple
                ? t('dataManagement.deleteMultipleTitle', 'Delete {{count}} Artifacts?', { count })
                : t('dataManagement.deleteTitle', 'Delete Artifact?')}
            </h2>
          </div>
        </div>

        <p className="text-text-secondary mb-6">
          {isMultiple
            ? t(
                'dataManagement.deleteMultipleDescription',
                'This will permanently delete {{count}} artifacts and all their photos, 3D models, and info cards. This action cannot be undone.',
                { count }
              )
            : t(
                'dataManagement.deleteDescription',
                'This will permanently delete "{{name}}" and all its photos, 3D models, and info cards. This action cannot be undone.',
                { name: artifacts[0].metadata.name || t('artifact.defaultName', { date: '' }) }
              )}
        </p>

        {/* Warning banner */}
        <div className="mb-6 p-3 bg-error/10 border border-error/20 rounded">
          <p className="text-base text-error font-medium">
            {t('dataManagement.deleteWarning', 'This action cannot be undone.')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="btn-parchment flex-1 disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 py-3 bg-error text-white rounded font-display font-medium text-base uppercase tracking-wider hover:bg-error/80 transition-colors disabled:opacity-50"
          >
            {isDeleting
              ? t('dataManagement.deleting', 'Deleting...')
              : t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
