import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/services/api';

/**
 * Hook for managing form drafts automatically.
 * 
 * @param {Object} options 
 * @param {string} options.workflowType - Workflow ID (e.g. 'peer_feedback')
 * @param {string|null} options.referenceId - Optional ID (e.g. target employee)
 * @param {Object} options.initialData - The default form state
 * @param {number} options.debounceMs - Auto-save debounce (default: 3000ms)
 */
export function useFormDraft({ workflowType, referenceId = null, initialData, debounceMs = 3000, enabled = true }) {
  const [data, setData] = useState(initialData);
  const [draftStatus, setDraftStatus] = useState('idle'); // idle, loading, saving, saved, error
  const [lastSaved, setLastSaved] = useState(null);
  
  const isInitialLoad = useRef(true);
  const debounceTimer = useRef(null);
  const currentDataRef = useRef(data);

  // Keep ref up to date for unmount save
  useEffect(() => {
    currentDataRef.current = data;
  }, [data]);

  // Load draft on mount or when referenceId changes
  useEffect(() => {
    let isMounted = true;
    const fetchDraft = async () => {
      if (!enabled) {
        setDraftStatus('idle');
        return;
      }

      setDraftStatus('loading');
      setData(initialData);
      try {
        const query = referenceId ? `?workflowType=${workflowType}&referenceId=${referenceId}` : `?workflowType=${workflowType}`;
        const res = await api.get(`/drafts${query}`);
        if (res.data.success && isMounted) {
          setData(res.data.data.data);
          setLastSaved(new Date(res.data.data.updatedAt));
          setDraftStatus('saved');
        }
      } catch (err) {
        if (err.response?.status === 404) {
          // No draft exists, just use initialData
          if (isMounted) setDraftStatus('idle');
        } else {
          console.error('Failed to load draft:', err);
          if (isMounted) setDraftStatus('error');
        }
      } finally {
        isInitialLoad.current = false;
      }
    };

    fetchDraft();

    return () => {
      isMounted = false;
      isInitialLoad.current = true; // reset for next mount if referenceId changes
      setData(initialData); // reset data when changing targets
      setDraftStatus('idle');
      setLastSaved(null);
    };
  }, [workflowType, referenceId, enabled]);

  // Auto-save logic
  const saveDraft = useCallback(async (draftData) => {
    setDraftStatus('saving');
    try {
      const res = await api.put('/drafts', {
        workflowType,
        referenceId,
        data: draftData
      });
      if (res.data.success) {
        setLastSaved(new Date(res.data.data.updatedAt));
        setDraftStatus('saved');
      }
    } catch (err) {
      console.error('Failed to save draft:', err);
      setDraftStatus('error');
    }
  }, [workflowType, referenceId]);

  // Trigger debounced save when data changes
  useEffect(() => {
    if (!enabled || isInitialLoad.current) return;

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      saveDraft(data);
    }, debounceMs);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [data, saveDraft, debounceMs, enabled]);

  // Explicit unmount save (e.g. navigating away before debounce fires)
  useEffect(() => {
    return () => {
      // We can't easily await api.put here if component unmounts fully, 
      // but navigator.sendBeacon is better for reliable unmount.
      // For simplicity, we just clear timer. 
      // If a critical explicit unmount save is needed, one should use beforeunload.
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const clearDraft = useCallback(async () => {
    try {
      const query = referenceId ? `?workflowType=${workflowType}&referenceId=${referenceId}` : `?workflowType=${workflowType}`;
      await api.delete(`/drafts${query}`);
    } catch (err) {
      console.error('Failed to delete draft:', err);
    }
    setData(initialData);
    setDraftStatus('idle');
    setLastSaved(null);
  }, [workflowType, referenceId, initialData]);

  const discardDraft = useCallback(() => {
    clearDraft();
  }, [clearDraft]);

  return {
    data,
    setData,
    draftStatus,
    lastSaved,
    clearDraft,
    discardDraft
  };
}
