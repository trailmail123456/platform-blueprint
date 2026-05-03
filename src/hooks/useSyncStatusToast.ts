import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { SyncStatus } from "@/hooks/useRealtimeSync";

/**
 * Surfaces a non-blocking toast when sync status changes meaningfully:
 *  - going live after a non-live state
 *  - falling back to polling after being live
 *  - returning to live from polling
 *
 * No toast on first mount.
 */
export function useSyncStatusToast(status: SyncStatus, label = "Realtime sync") {
  const prev = useRef<SyncStatus | null>(null);

  useEffect(() => {
    const previous = prev.current;
    prev.current = status;
    if (previous === null) return; // skip initial mount

    if (status === "live" && previous !== "live") {
      toast.success(`${label} is live`, { description: "Updates will appear instantly." });
    } else if (status === "polling" && previous !== "polling") {
      toast.warning(`${label} fell back to polling`, {
        description: "Realtime is unavailable. We'll keep refreshing in the background.",
      });
    } else if (status === "error") {
      toast.error(`${label} offline`, { description: "Trying to reconnect…" });
    }
  }, [status, label]);
}
