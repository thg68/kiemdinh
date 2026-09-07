"use client";

import { useCallback, useMemo, useRef } from "react";

type RequestToken = {
  channel: string;
  generation: number;
  scopeKey: string;
};

/**
 * Bảo đảm response bất đồng bộ chỉ được ghi vào state khi vẫn thuộc đúng
 * cơ sở, năm học và cấp học mà người dùng đang xem.
 */
export function useScopedRequest(scopeKey: string) {
  const generationsRef = useRef(new Map<string, number>());

  const begin = useCallback((channel = "default"): RequestToken => {
    const generation = (generationsRef.current.get(channel) ?? 0) + 1;
    generationsRef.current.set(channel, generation);
    return { channel, generation, scopeKey };
  }, [scopeKey]);

  const isCurrent = useCallback((token: RequestToken) => (
    token.scopeKey === scopeKey
      && token.generation === generationsRef.current.get(token.channel)
  ), [scopeKey]);

  const invalidate = useCallback((channel?: string) => {
    if (channel) {
      generationsRef.current.set(channel, (generationsRef.current.get(channel) ?? 0) + 1);
      return;
    }
    generationsRef.current.clear();
  }, []);

  return useMemo(() => ({ begin, invalidate, isCurrent }), [begin, invalidate, isCurrent]);
}
