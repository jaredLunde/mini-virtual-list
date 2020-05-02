import * as React from 'react'
export declare const useSize: <T extends HTMLElement = HTMLElement>(
  ref: React.MutableRefObject<T | null>,
  deps?: React.DependencyList
) => {
  width: number
  height: number
}
