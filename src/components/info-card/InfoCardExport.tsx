import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { InfoCard, ArtifactMetadata } from '@/types';

type ExportFormat = 'json' | 'markdown' | 'text';

interface InfoCardExportProps {
  isOpen: boolean;
  onClose: () => void;
  infoCard: InfoCard;
  metadata?: ArtifactMetadata;
}

export function InfoCardExport({
  isOpen,
  onClose,
  infoCard,
  metadata,
}: InfoCardExportProps) {
  const { t } = useTranslation();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('markdown');

  if (!isOpen) return null;

  const generateExport = (format: ExportFormat): string => {
    const name = metadata?.name || 'Artifact';

    switch (format) {
      case 'json':
        return JSON.stringify(
          {
            name,
            metadata: metadata || {},
            analysis: {
              material: infoCard.material,
              estimatedAge: infoCard.estimatedAge,
              possibleUse: infoCard.possibleUse,
              culturalContext: infoCard.culturalContext,
              similarArtifacts: infoCard.similarArtifacts,
              preservationNotes: infoCard.preservationNotes,
            },
            aiInfo: {
              model: infoCard.aiModel,
              confidence: infoCard.aiConfidence,
              humanEdited: infoCard.isHumanEdited,
              disclaimer: infoCard.disclaimer,
            },
            exportedAt: new Date().toISOString(),
          },
          null,
          2
        );

      case 'markdown':
        return `# ${name}

## Material
${infoCard.material}

## Estimated Age
**${infoCard.estimatedAge.range}** (${infoCard.estimatedAge.confidence} confidence)
${infoCard.estimatedAge.reasoning ? `\n_${infoCard.estimatedAge.reasoning}_` : ''}

## Possible Use
${infoCard.possibleUse}

## Cultural Context
${infoCard.culturalContext}

${infoCard.similarArtifacts.length > 0 ? `## Similar Artifacts
${infoCard.similarArtifacts.map((a) => `- ${a}`).join('\n')}` : ''}

${infoCard.preservationNotes ? `## Preservation Notes
${infoCard.preservationNotes}` : ''}

---
*${infoCard.disclaimer}*
${infoCard.isHumanEdited ? '\n✓ Human verified' : ''}
`;

      case 'text':
      default:
        return `${name}
${'='.repeat(name.length)}

Material: ${infoCard.material}

Estimated Age: ${infoCard.estimatedAge.range} (${infoCard.estimatedAge.confidence} confidence)
${infoCard.estimatedAge.reasoning ? `Reasoning: ${infoCard.estimatedAge.reasoning}` : ''}

Possible Use: ${infoCard.possibleUse}

Cultural Context: ${infoCard.culturalContext}

${infoCard.similarArtifacts.length > 0 ? `Similar Artifacts:\n${infoCard.similarArtifacts.map((a) => `  - ${a}`).join('\n')}` : ''}

${infoCard.preservationNotes ? `Preservation Notes: ${infoCard.preservationNotes}` : ''}

---
${infoCard.disclaimer}
${infoCard.isHumanEdited ? '✓ Human verified' : ''}
`;
    }
  };

  const handleDownload = () => {
    const content = generateExport(selectedFormat);
    const mimeType =
      selectedFormat === 'json' ? 'application/json' : 'text/plain';
    const extension = selectedFormat === 'markdown' ? 'md' : selectedFormat;
    const filename = `${metadata?.name || 'artifact'}-info.${extension}`;

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  const handleCopy = async () => {
    const content = generateExport(selectedFormat);
    await navigator.clipboard.writeText(content);
    onClose();
  };

  const formats: { id: ExportFormat; label: string }[] = [
    { id: 'markdown', label: 'Markdown' },
    { id: 'json', label: 'JSON' },
    { id: 'text', label: t('infoCard.exportFormats.text') },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end"
      onClick={onClose}
    >
      <div
        className="bg-white w-full rounded-t-2xl p-4 safe-area-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-earth mb-4 text-center">
          {t('infoCard.exportTitle')}
        </h3>

        {/* Format selector */}
        <div className="mb-4">
          <p className="text-sm text-text-secondary mb-2">
            {t('infoCard.selectFormat')}
          </p>
          <div className="flex gap-2">
            {formats.map((format) => (
              <button
                key={format.id}
                onClick={() => setSelectedFormat(format.id)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  selectedFormat === format.id
                    ? 'bg-terracotta text-white'
                    : 'bg-sand text-earth hover:bg-clay hover:text-white'
                }`}
              >
                {format.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="mb-4">
          <p className="text-sm text-text-secondary mb-2">
            {t('infoCard.preview')}
          </p>
          <pre className="bg-sand p-3 rounded-lg text-xs text-text-primary overflow-x-auto max-h-40 overflow-y-auto">
            {generateExport(selectedFormat).slice(0, 500)}
            {generateExport(selectedFormat).length > 500 && '...'}
          </pre>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 py-3 border border-sand text-earth rounded-xl font-medium hover:bg-sand transition-colors"
          >
            {t('infoCard.copyToClipboard')}
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 py-3 bg-terracotta text-white rounded-xl font-semibold hover:bg-clay transition-colors"
          >
            {t('infoCard.downloadFile')}
          </button>
        </div>
      </div>
    </div>
  );
}
