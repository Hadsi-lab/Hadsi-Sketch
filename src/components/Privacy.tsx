import { ShieldCheck } from 'lucide-react';

export function Privacy({ compact }: { compact?: boolean }) {
  return (
    <p className={`privacy ${compact ? 'privacy-compact' : ''}`}>
      <ShieldCheck size={16} aria-hidden />
      <span>Your photos and drawings stay 100% private on this device. Nothing is ever uploaded to a server.</span>
    </p>
  );
}
