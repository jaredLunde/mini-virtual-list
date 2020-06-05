import * as React from 'react'
export declare const useSize: <T extends HTMLElement = HTMLElement>(
  ref: React.MutableRefObject<T | null>
) => {
  width: number
  height: number
}
