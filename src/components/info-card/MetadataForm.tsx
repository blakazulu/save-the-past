import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ArtifactMetadata } from '@/types';

interface MetadataFormProps {
  metadata: ArtifactMetadata;
  onSave: (metadata: ArtifactMetadata) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function MetadataForm({
  metadata,
  onSave,
  onCancel,
  isLoading = false,
}: MetadataFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<ArtifactMetadata>({
    name: metadata.name || '',
    discoveryLocation: metadata.discoveryLocation || '',
    excavationLayer: metadata.excavationLayer || '',
    siteName: metadata.siteName || '',
    notes: metadata.notes || '',
    tags: metadata.tags || [],
  });
  const [tagInput, setTagInput] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tag) || [],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
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
        <label className="block text-sm font-medium text-text-secondary mb-1">
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
        <label className="block text-sm font-medium text-text-secondary mb-1">
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

      {/* Excavation Layer */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          {t('infoCard.metadata.layer')}
        </label>
        <input
          type="text"
          name="excavationLayer"
          value={formData.excavationLayer || ''}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-white border border-sand rounded-lg focus:outline-none focus:border-terracotta"
          placeholder={t('infoCard.metadata.layerPlaceholder')}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
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

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          {t('infoCard.metadata.tags')}
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            className="flex-1 px-3 py-2 bg-white border border-sand rounded-lg focus:outline-none focus:border-terracotta"
            placeholder={t('infoCard.metadata.tagsPlaceholder')}
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-4 py-2 bg-sand text-earth rounded-lg hover:bg-clay hover:text-white transition-colors"
          >
            {t('infoCard.metadata.addTag')}
          </button>
        </div>
        {formData.tags && formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 bg-terracotta/10 text-terracotta rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="w-4 h-4 flex items-center justify-center hover:bg-terracotta hover:text-white rounded-full"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 border border-sand text-earth rounded-xl font-medium hover:bg-sand transition-colors"
          disabled={isLoading}
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-3 bg-terracotta text-white rounded-xl font-semibold hover:bg-clay transition-colors disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? t('common.loading') : t('common.save')}
        </button>
      </div>
    </form>
  );
}
