import * as React from 'react'
import type {ListPropsBase} from './types'
export declare const useDynamicList: ({
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
  itemHeightEstimate,
  itemKey,
  overscanBy,
  scrollTop,
  isScrolling,
  render,
}: UseDynamicListOptions) => JSX.Element
export interface UseDynamicListOptions extends Omit<ListPropsBase, 'itemGap'> {
  readonly positioner: Positioner
  readonly containerRef?:
    | ((element: HTMLElement) => void)
    | React.MutableRefObject<HTMLElement | null>
    | null
  readonly itemHeightEstimate?: number
  readonly render: React.ComponentType<DynamicListRenderProps>
}
export declare const DynamicList: React.ForwardRefExoticComponent<
  DynamicListProps & React.RefAttributes<any>
>
export interface DynamicListProps extends ListPropsBase {
  readonly itemHeightEstimate?: number
  readonly render: React.ComponentType<DynamicListRenderProps>
}
export interface DynamicListRenderProps {
  index: number
  data: any
  width: number
  measure: () => void
  [prop: string]: any
}
export declare const usePositioner: (
  itemGap?: number,
  deps?: React.DependencyList
) => Positioner
interface Positioner {
  set: (index: number, height: number) => PositionerItem
  get: (index: number | undefined) => PositionerItem
  remove: (index: number) => void
  update: (index: number, height: number) => void
  est: (itemCount: number, defaultItemHeight: number) => number
  range: (
    lo: number,
    hi: number,
    cb: (item: PositionerItem, i: number) => void
  ) => void
  height: () => number
  size: () => number
}
interface PositionerItem {
  top: number
  height: number
}
export {}
