import type {ListItemProps} from './types'

export function useList<Item>({
  items,
  width,
  height,
  overscanBy = 2,
  scrollTop,
  itemHeight,
  itemGap = 0,
}: UseListOptions<Item>) {
  const totalItemHeight = itemHeight + itemGap
  overscanBy = height * overscanBy
  let index = Math.floor(
    Math.max(0, scrollTop - overscanBy / 2) / totalItemHeight
  )
  const stopIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + overscanBy) / totalItemHeight)
  )
  const childProps: ListItemProps<Item>[] = []

  for (; index < stopIndex; index++) {
    childProps.push({
      index,
      data: items[index],
      width,
      height,
      style: {
        position: 'absolute',
        width: '100%',
        top: itemGap * index + index * itemHeight,
        left: 0,
      },
    })
  }

  return childProps
}

export interface UseListOptions<Item> {
  items: Item[]
  width: number
  height: number
  itemHeight: number
  itemGap?: number
  overscanBy?: number
  scrollTop: number
}
