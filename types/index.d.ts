import React from 'react'
export declare const useList: ({
  positioner,
  containerRef,
  items,
  width,
  height,
  onRender,
  as: Container,
  id,
  className,
  style,
  role,
  tabIndex,
  itemAs,
  itemHeight,
  itemHeightEstimate,
  itemKey,
  overscanBy,
  scrollTop,
  isScrolling,
  render,
}: UseListOptions) => JSX.Element
export interface UseListOptions {
  readonly positioner: Positioner
  /**
   * Forwards a React ref to the grid container.
   */
  readonly containerRef?:
    | ((element: HTMLElement) => void)
    | React.MutableRefObject<HTMLElement | null>
  readonly width: number
  readonly height: number
  readonly scrollTop: number
  readonly isScrolling?: boolean
  readonly as?: keyof JSX.IntrinsicElements | React.ComponentType<any>
  readonly id?: string
  readonly className?: string
  readonly style?: React.CSSProperties
  readonly role?: string
  readonly tabIndex?: number | string
  readonly items: any[]
  readonly itemAs?: keyof JSX.IntrinsicElements | React.ComponentType<any>
  readonly itemHeight?: number
  readonly itemHeightEstimate?: number
  readonly itemKey?: (data: any, index: number) => string | number
  readonly overscanBy?: number
  readonly onRender?: (
    startIndex: number,
    stopIndex: number | undefined,
    items: any[]
  ) => void
  readonly render: RenderComponent
}
export declare type RenderComponent = React.FC<{
  index: number
  data: any
  width: number
  measure: () => void
  [prop: string]: any
}>
export declare const List: React.FC<ListProps>
export interface ListProps extends Omit<UseListOptions, 'positioner'> {
  rowGutter?: number
}
export declare const usePositioner: (
  rowGutter?: number,
  deps?: React.DependencyList
) => Positioner
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
interface Positioner {
  set: (index: number, height: number) => void
  get: (index: number | undefined) => PositionerItem
  update: (index: number, height: number) => void
  estimateHeight: (itemCount: number, defaultItemHeight: number) => number
  range: (lo: number, hi: number) => [number, number]
  listHeight: () => number
  size: () => number
}
interface PositionerItem {
  top: number
  height: number
}
export {}
