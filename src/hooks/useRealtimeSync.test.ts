import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Mock the supabase client BEFORE importing the hook
let subscribeCb: ((status: string) => void) | null = null;
const onMock = vi.fn().mockReturnThis();
const subscribeMock = vi.fn(function (cb: (s: string) => void) {
  subscribeCb = cb;
  return this;
});
const channelMock = { on: onMock, subscribe: subscribeMock };
const removeChannelMock = vi.fn();
const channelFactory = vi.fn((_name: string) => channelMock);

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    channel: (name: string) => channelFactory(name),
    removeChannel: (c: any) => removeChannelMock(c),
  },
}));

import { useRealtimeSync } from "./useRealtimeSync";

describe("useRealtimeSync", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    subscribeCb = null;
    onMock.mockClear();
    subscribeMock.mockClear();
    channelFactory.mockClear();
    removeChannelMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts in 'connecting' state", () => {
    const { result } = renderHook(() =>
      useRealtimeSync({ filters: [{ table: "ideas" }], onChange: vi.fn() })
    );
    expect(result.current).toBe("connecting");
  });

  it("transitions to 'live' when channel SUBSCRIBED", () => {
    const { result } = renderHook(() =>
      useRealtimeSync({ filters: [{ table: "ideas" }], onChange: vi.fn() })
    );
    act(() => subscribeCb?.("SUBSCRIBED"));
    expect(result.current).toBe("live");
  });

  it("transitions to 'polling' on CHANNEL_ERROR or TIMED_OUT", () => {
    const { result } = renderHook(() =>
      useRealtimeSync({ filters: [{ table: "ideas" }], onChange: vi.fn() })
    );
    act(() => subscribeCb?.("CHANNEL_ERROR"));
    expect(result.current).toBe("polling");
  });

  it("invokes onChange immediately on mount, then on each poll tick", async () => {
    const onChange = vi.fn();
    renderHook(() =>
      useRealtimeSync({ filters: [{ table: "ideas" }], onChange, pollIntervalMs: 1000 })
    );
    // initial fetch
    expect(onChange).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(onChange).toHaveBeenCalledTimes(2);

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(onChange).toHaveBeenCalledTimes(4);
  });

  it("invokes onChange when WS event fires", () => {
    const onChange = vi.fn();
    renderHook(() =>
      useRealtimeSync({ filters: [{ table: "ideas" }], onChange, pollIntervalMs: 60000 })
    );
    onChange.mockClear();
    // Pull the postgres_changes handler registered via .on(...)
    const handler = onMock.mock.calls[0][2] as () => void;
    act(() => handler());
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("registers one subscription per filter", () => {
    renderHook(() =>
      useRealtimeSync({
        filters: [{ table: "ideas" }, { table: "team_members", filter: "user_id=eq.1" }],
        onChange: vi.fn(),
      })
    );
    expect(onMock).toHaveBeenCalledTimes(2);
    expect(onMock.mock.calls[1][1]).toMatchObject({
      table: "team_members",
      filter: "user_id=eq.1",
    });
  });

  it("removes channel and clears polling on unmount", () => {
    const onChange = vi.fn();
    const { unmount } = renderHook(() =>
      useRealtimeSync({ filters: [{ table: "ideas" }], onChange, pollIntervalMs: 500 })
    );
    unmount();
    expect(removeChannelMock).toHaveBeenCalledTimes(1);
    onChange.mockClear();
    vi.advanceTimersByTime(2000);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does nothing when enabled=false", () => {
    const onChange = vi.fn();
    renderHook(() =>
      useRealtimeSync({ filters: [{ table: "ideas" }], onChange, enabled: false })
    );
    expect(channelFactory).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
