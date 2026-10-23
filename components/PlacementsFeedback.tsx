import type { PlacementsState } from './usePlacements';
import './placements-api.css';

export default function PlacementsFeedback({ state }: { state: PlacementsState }) {
  if (state.status === 'disabled' || state.status === 'ready' && state.data?.students.length) return null;
  return <div className="placements-api-feedback" role="status" aria-live="polite">
    <p>{state.status === 'loading' ? 'Loading placements…'
      : state.status === 'scope-unverified' ? 'School-specific placements are currently unavailable.'
      : state.status === 'error' ? 'Placements are temporarily unavailable.' : 'No placements are available yet.'}</p>
    {state.status === 'error' && <button className="text-link" type="button" onClick={state.retry}>Try again</button>}
  </div>;
}
