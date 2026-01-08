import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ArtifactMetadata } from '@/types';

interface MetadataFormProps {
  metadata: ArtifactMetadata;
  onSave: (metadata: ArtifactMetadata) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
  showCancel?: boolean;
}

export function MetadataForm({
  metadata,
  onSave,
  onCancel,
  isLoading = false,
  submitLabel,
  showCancel = true,
}: MetadataFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<ArtifactMetadata>({
    name: metadata.name || '',
    discoveryLocation: metadata.discoveryLocation || '',
    siteName: metadata.siteName || '',
    notes: metadata.notes || '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-base font-medium text-text-secondary mb-1">
          {t('infoCard.metadata.name')}
        </label>
        <input
          type="text"
          name="name"
          value={formData.name || ''}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-white border border-sand rounded-lg focus:outline-none focus:border-terracotta"
          placeholder={t('infoCard.metadata.namePlaceholder')}
        />
      </div>

      {/* Site Name */}
      <div>
        <label className="block text-base font-medium text-text-secondary mb-1">
          {t('infoCard.metadata.siteName')}
        </label>
        <input
          type="text"
          name="siteName"
          value={formData.siteName || ''}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-white border border-sand rounded-lg focus:outline-none focus:border-terracotta"
          placeholder={t('infoCard.metadata.siteNamePlaceholder')}
        />
      </div>

      {/* Discovery Location */}
      <div>
        <label className="block text-base font-medium text-text-secondary mb-1">
          {t('infoCard.metadata.location')}
        </label>
        <input
          type="text"
          name="discoveryLocation"
          value={formData.discoveryLocation || ''}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-white border border-sand rounded-lg focus:outline-none focus:border-terracotta"
          placeholder={t('infoCard.metadata.locationPlaceholder')}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-base font-medium text-text-secondary mb-1">
          {t('infoCard.metadata.notes')}
        </label>
        <textarea
          name="notes"
          value={formData.notes || ''}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 bg-white border border-sand rounded-lg focus:outline-none focus:border-terracotta resize-none"
          placeholder={t('infoCard.metadata.notesPlaceholder')}
        />
      </div>

      {/* Actions */}
      <div className={`flex gap-3 pt-4 ${!showCancel ? 'justify-center' : ''}`}>
        {showCancel && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-sand text-earth rounded-xl font-medium hover:bg-sand transition-colors"
            disabled={isLoading}
          >
            {t('common.cancel')}
          </button>
        )}
        <button
          type="submit"
          className={`px-4 py-3 bg-terracotta text-white rounded-xl font-semibold hover:bg-clay transition-colors disabled:opacity-50 ${showCancel ? 'flex-1' : 'w-full'}`}
          disabled={isLoading}
        >
          {isLoading ? t('common.loading') : (submitLabel || t('common.save'))}
        </button>
      </div>
    </form>
  );
}
