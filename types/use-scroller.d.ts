import * as React from 'react'
export declare const useScroller: <T extends HTMLElement = HTMLElement>(
  ref: Window | React.MutableRefObject<T | null>,
  options?: UseScrollerOptions
) => {
  scrollTop: number
  isScrolling: boolean
}
export interface UseScrollerOptions {
  offset?: number
  fps?: number
}
