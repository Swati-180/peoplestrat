import React from 'react';
import { Loader2, CheckCircle2, Clock, Trash2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';

export function DraftStatus({ status, lastSaved, onDiscard }) {
  if (status === 'idle' && !lastSaved) return null;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 border border-slate-200 p-3 rounded-lg w-full">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        {status === 'loading' && (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
            <span>Loading draft...</span>
          </>
        )}
        
        {status === 'saving' && (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <span>Saving draft...</span>
          </>
        )}
        
        {status === 'saved' && (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>
              Draft saved {lastSaved && `· ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            </span>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span className="text-rose-600">Failed to save draft</span>
          </>
        )}

        {status === 'idle' && lastSaved && (
          <>
            <Clock className="w-4 h-4 text-slate-500" />
            <span>
              Continue your draft {lastSaved && `from ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            </span>
          </>
        )}
      </div>

      {(status === 'saved' || (status === 'idle' && lastSaved) || status === 'error') && onDiscard && (
        <Button 
          type="button"
          variant="outline" 
          size="sm" 
          onClick={onDiscard}
          className="text-slate-500 hover:text-rose-600 border-slate-300"
        >
          <Trash2 className="w-4 h-4 mr-1.5" />
          Discard
        </Button>
      )}
    </div>
  );
}
