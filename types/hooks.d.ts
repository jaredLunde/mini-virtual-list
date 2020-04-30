import * as React from 'react'
export declare const useSize: <T extends HTMLElement = HTMLElement>(
  ref: React.MutableRefObject<T | null>,
  deps?: React.DependencyList
) => {
  width: number
  height: number
}
export declare const useScroller: <T extends HTMLElement = HTMLElement>(
  ref: Window | React.MutableRefObject<T | null>,
  offset?: number,
  fps?: number
) => {
  scrollTop: number
  isScrolling: boolean
}
