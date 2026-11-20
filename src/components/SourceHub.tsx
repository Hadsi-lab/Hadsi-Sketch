import { useState, type ReactNode } from 'react';
import { Camera, ImagePlus, Lightbulb } from 'lucide-react';
import { Modal } from './Modal';
import { GeneratePanel } from './GeneratePanel';
import { CameraPanel } from './CameraPanel';
import { ImportPanel } from './ImportPanel';
import { Privacy } from './Privacy';
import type { SketchSource } from '../lib/types';
import type { GenSpec } from '../generator';

export type HubTab = 'generate' | 'camera' | 'import';

interface Props {
  tab: HubTab;
  importImage?: string | null;
  lastSpec?: GenSpec;
  onClose: () => void;
  onUse: (s: SketchSource, spec?: GenSpec) => void;
  onOpenKey: () => void;
}

const TABS: { id: HubTab; label: string; icon: ReactNode }[] = [
  { id: 'generate', label: 'Generate Idea', icon: <Lightbulb size={20} /> },
  { id: 'camera', label: 'Take a Photo', icon: <Camera size={20} /> },
  { id: 'import', label: 'Import Image', icon: <ImagePlus size={20} /> },
];

export function SourceHub({ tab: initialTab, importImage, lastSpec, onClose, onUse, onOpenKey }: Props) {
  const [tab, setTab] = useState<HubTab>(initialTab);
  return (
    <Modal title="Start a new sketch" onClose={onClose} wide>
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={`tab ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)}>
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>
      <div className="tab-body">
        {tab === 'generate' && <GeneratePanel initial={lastSpec} onUse={onUse} onOpenKey={onOpenKey} />}
        {tab === 'camera' && <CameraPanel onUse={onUse} />}
        {tab === 'import' && <ImportPanel onUse={onUse} initial={importImage} />}
      </div>
      <Privacy />
    </Modal>
  );
}
