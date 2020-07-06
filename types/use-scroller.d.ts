import * as React from 'react'
export declare function useScroller<T extends HTMLElement>(
  ref: Window | React.MutableRefObject<T | null> | T | null,
  options?: UseScrollerOptions
): {
  scrollTop: number
  isScrolling: boolean
}
export interface UseScrollerOptions {
  offset?: number
  fps?: number
}
