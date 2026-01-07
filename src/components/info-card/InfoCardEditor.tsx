import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { InfoCard } from '@/types';

interface InfoCardEditorProps {
  infoCard: InfoCard;
  onSave: (updates: Partial<InfoCard>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function InfoCardEditor({
  infoCard,
  onSave,
  onCancel,
  isLoading = false,
}: InfoCardEditorProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    material: infoCard.material,
    ageRange: infoCard.estimatedAge.range,
    ageConfidence: infoCard.estimatedAge.confidence,
    ageReasoning: infoCard.estimatedAge.reasoning || '',
    possibleUse: infoCard.possibleUse,
    culturalContext: infoCard.culturalContext,
    similarArtifacts: infoCard.similarArtifacts.join('\n'),
    preservationNotes: infoCard.preservationNotes,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      material: formData.material,
      estimatedAge: {
        range: formData.ageRange,
        confidence: formData.ageConfidence as 'high' | 'medium' | 'low',
        reasoning: formData.ageReasoning || undefined,
      },
      possibleUse: formData.possibleUse,
      culturalContext: formData.culturalContext,
      similarArtifacts: formData.similarArtifacts
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      preservationNotes: formData.preservationNotes,
      isHumanEdited: true,
      updatedAt: new Date(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Material */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          {t('infoCard.fields.material')}
        </label>
        <input
          type="text"
          name="material"
          value={formData.material}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-white border border-sand rounded-lg focus:outline-none focus:border-terracotta"
        />
      </div>

      {/* Estimated Age */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            {t('infoCard.fields.estimatedAge')}
          </label>
          <input
            type="text"
            name="ageRange"
            value={formData.ageRange}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-white border border-sand rounded-lg focus:outline-none focus:border-terracotta"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            {t('infoCard.confidenceLabel')}
          </label>
          <select
            name="ageConfidence"
            value={formData.ageConfidence}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-white border border-sand rounded-lg focus:outline-none focus:border-terracotta"
          >
            <option value="high">{t('infoCard.confidence.high')}</option>
            <option value="medium">{t('infoCard.confidence.medium')}</option>
            <option value="low">{t('infoCard.confidence.low')}</option>
          </select>
        </div>
      </div>

      {/* Age Reasoning */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          {t('infoCard.fields.ageReasoning')}
        </label>
        <textarea
          name="ageReasoning"
          value={formData.ageReasoning}
          onChange={handleChange}
          rows={2}
          className="w-full px-3 py-2 bg-white border border-sand rounded-lg focus:outline-none focus:border-terracotta resize-none"
        />
      </div>

      {/* Possible Use */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          {t('infoCard.fields.possibleUse')}
        </label>
        <textarea
          name="possibleUse"
          value={formData.possibleUse}
          onChange={handleChange}
          rows={2}
          className="w-full px-3 py-2 bg-white border border-sand rounded-lg focus:outline-none focus:border-terracotta resize-none"
        />
      </div>

      {/* Cultural Context */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          {t('infoCard.fields.culturalContext')}
        </label>
        <textarea
          name="culturalContext"
          value={formData.culturalContext}
          onChange={handleChange}
          rows={2}
          className="w-full px-3 py-2 bg-white border border-sand rounded-lg focus:outline-none focus:border-terracotta resize-none"
        />
      </div>

      {/* Similar Artifacts */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          {t('infoCard.fields.similarArtifacts')}
          <span className="font-normal text-md ml-1">
            ({t('infoCard.onePerLine')})
          </span>
        </label>
        <textarea
          name="similarArtifacts"
          value={formData.similarArtifacts}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 bg-white border border-sand rounded-lg focus:outline-none focus:border-terracotta resize-none"
        />
      </div>

      {/* Preservation Notes */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          {t('infoCard.fields.preservationNotes')}
        </label>
        <textarea
          name="preservationNotes"
          value={formData.preservationNotes}
          onChange={handleChange}
          rows={2}
          className="w-full px-3 py-2 bg-white border border-sand rounded-lg focus:outline-none focus:border-terracotta resize-none"
        />
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
