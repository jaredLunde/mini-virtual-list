import type {ListItemProps} from './types'
export declare function useList<Item>({
  items,
  width,
  height,
  overscanBy,
  scrollTop,
  itemHeight,
  itemGap,
}: UseListOptions<Item>): ListItemProps<Item>[]
export interface UseListOptions<Item> {
  items: Item[]
  width: number
  height: number
  itemHeight: number
  itemGap?: number
  overscanBy?: number
  scrollTop: number
}
