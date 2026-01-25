'use client';

import { useRef } from 'react';

/**
 * Hook that returns a ref which always contains the latest value.
 * Useful for accessing current values in callbacks without adding them to dependency arrays.
 *
 * @param value - The value to keep current
 * @returns A ref object with the current value
 */
export function useLatest<T>(value: T): { readonly current: T } {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
