import { useEffect, useState } from 'react';
import { requestPlacements, type PlacementsData } from './placements-api';

export type PlacementsState = {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: PlacementsData | null;
  error: Error | null;
};

export default function usePlacements(url: string | null, isProgram: boolean = false): PlacementsState {
  const [state, setState] = useState<PlacementsState>({
    status: url !== null ? 'loading' : 'idle',
    data: null,
    error: null,
  });

  useEffect(() => {
    if (url === null) {
      setState({ status: 'idle', data: null, error: null });
      return;
    }

    let active = true;
    setState({ status: 'loading', data: null, error: null });

    requestPlacements(url, isProgram)
      .then(data => {
        if (active) setState({ status: 'success', data, error: null });
      })
      .catch(error => {
        if (active) setState({ status: 'error', data: null, error: error instanceof Error ? error : new Error('Fetch failed') });
      });

    return () => { active = false; };
  }, [url, isProgram]);

  return state;
}