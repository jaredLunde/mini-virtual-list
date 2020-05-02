/// <reference types="react" />
import type {ListItemProps} from './types'
export declare const useDynamicList: ({
  items,
  width,
  height,
  overscanBy,
  scrollTop,
  itemHeightEstimate,
  positioner,
}: UseDynamicListOptions) => ListItemProps[]
export interface UseDynamicListOptions {
  positioner: Positioner
  items: any[]
  width: number
  height: number
  itemHeightEstimate?: number
  overscanBy?: number
  scrollTop: number
}
export declare const usePositioner: (
  itemGap?: number,
  deps?: import('react').DependencyList
) => Positioner
export interface Positioner {
  set: (index: number, height: number) => PositionerItem
  update: (index: number, height: number) => void
  get: (index: number | undefined) => PositionerItem
  remove: (index: number) => void
  est: (itemCount: number, defaultItemHeight: number) => number
  range: (
    lo: number,
    hi: number,
    cb: (item: PositionerItem, i: number) => void
  ) => void
  height: () => number
  size: () => number
}
export interface PositionerItem {
  top: number
  height: number
}
