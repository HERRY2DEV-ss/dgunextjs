import type { PlacementsState } from './usePlacements';
import './placements-api.css';

export default function PlacementsFeedback({ state }: { state: PlacementsState }) {
  if (state.status === 'idle' || state.status === 'success' && state.data?.students.length) return null;
  return <div className="placements-api-feedback" role="status" aria-live="polite">
    <p>{state.status === 'loading' ? 'Loading placements…'
      : state.status === 'error' ? 'Placements are temporarily unavailable.' : 'No placements are available yet.'}</p>
  </div>;
}
