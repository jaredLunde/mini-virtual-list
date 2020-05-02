import type {ListItemProps} from './types'
export declare const useList: ({
  items,
  width,
  height,
  overscanBy,
  scrollTop,
  itemHeight,
  itemGap,
}: UseListOptions) => ListItemProps[]
export interface UseListOptions {
  items: any[]
  width: number
  height: number
  itemHeight: number
  itemGap?: number
  overscanBy?: number
  scrollTop: number
}
