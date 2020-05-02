import {getCachedItemStyle} from './utils'
import type {ListItemProps} from './types'

export const useList = ({
  items,
  width,
  height,
  overscanBy = 2,
  scrollTop,
  itemHeight,
  itemGap = 0,
}: UseListOptions) => {
  const itemCount = items.length
  const totalItemHeight = itemHeight + itemGap
  const childProps: ListItemProps[] = []

  overscanBy = height * overscanBy

  let index = Math.floor(
    Math.max(0, scrollTop - overscanBy / 2) / totalItemHeight
  )
  const stopIndex = Math.min(
    itemCount,
    Math.ceil((scrollTop + overscanBy) / totalItemHeight)
  )

  for (; index < stopIndex; index++) {
    childProps.push({
      index,
      data: items[index],
      width,
      height,
      style: getCachedItemStyle(
        itemHeight,
        itemGap * index + index * itemHeight
      ),
    })
  }

  return childProps
}

export interface UseListOptions {
  items: any[]
  width: number
  height: number
  itemHeight: number
  itemGap?: number
  overscanBy?: number
  scrollTop: number
}
