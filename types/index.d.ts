import React from 'react'
export declare const List: React.FC<ListProps>
export interface ListProps {
  readonly rowGutter?: number
  readonly width: number
  readonly height: number
  readonly scrollTop: number
  readonly isScrolling?: boolean
  readonly as?: any
  readonly id?: string
  readonly className?: string
  readonly style?: React.CSSProperties
  readonly role?: string
  readonly tabIndex?: number | string
  readonly items: any[]
  readonly itemAs?: any
  readonly itemStyle?: React.CSSProperties
  readonly itemHeight?: number
  readonly itemHeightEstimate?: number
  readonly itemKey?: (data: any, index: number) => string | number
  readonly overscanBy?: number
  readonly onRender?: (
    startIndex: number,
    stopIndex: number | undefined,
    items: any[]
  ) => void
  readonly render: React.FC<{
    index: number
    data: any
    width: number
    measure: () => void
    [prop: string]: any
  }>
}
export declare const useSize: <T extends HTMLElement = HTMLElement>(
  ref: React.MutableRefObject<T | null>,
  deps?: any[]
) => [number, number]
export declare const useScroller: <T extends HTMLElement = HTMLElement>(
  ref: React.MutableRefObject<T | null>
) => [number, boolean]
