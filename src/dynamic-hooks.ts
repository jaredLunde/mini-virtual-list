import {useEffect, useState, useRef} from 'react'
import useLayoutEffect from '@react-hook/passive-layout-effect'
import type {ListItemProps} from './types'

export const useDynamicList = ({
  items,
  width,
  height,
  overscanBy = 2,
  scrollTop,
  itemHeightEstimate = 32,
  positioner,
}: UseDynamicListOptions) => {
  const itemCount = items.length
  const measuredCount = positioner.size()
  overscanBy = height * overscanBy
  const childProps: ListItemProps[] = []

  positioner.range(
    Math.max(0, scrollTop - overscanBy / 2),
    scrollTop + overscanBy,
    ({height, top}, index) =>
      childProps.push({
        index,
        data: items[index],
        width,
        height,
        style: {
          position: 'absolute',
          width: '100%',
          top,
          left: 0,
        },
      })
  )

  const currentHeight = positioner.height()
  const needsFreshBatch =
    currentHeight <= scrollTop + overscanBy && measuredCount < itemCount

  if (needsFreshBatch) {
    const batchSize =
      measuredCount +
      Math.min(
        itemCount - measuredCount,
        Math.ceil((scrollTop + overscanBy - currentHeight) / itemHeightEstimate)
      )

    for (let index = measuredCount; index < batchSize; index++)
      childProps.push({
        index,
        data: items[index],
        width,
        height: -1,
        style: prerenderItemStyle,
      })
  }

  return childProps
}

export interface UseDynamicListOptions {
  positioner: Positioner
  items: any[]
  width: number
  height: number
  itemHeightEstimate?: number
  overscanBy?: number
  scrollTop: number
}

const prerenderItemStyle: React.CSSProperties = {
  position: 'absolute',
  width: '100%',
  zIndex: -1000,
  visibility: 'hidden',
}

export const usePositioner = (
  itemGap = 0,
  deps: React.DependencyList = emptyArr
) => {
  const didMount = useRef(0)
  const initPositioner = () => createPositioner(itemGap)
  const [positioner, setPositioner] = useState(initPositioner)
  // Create a new positioner when the dependencies change
  useEffect(() => {
    if (didMount.current) setPositioner(initPositioner())
    didMount.current = 1
    // eslint-disable-next-line
  }, deps)
  // Sets a new item positioner if the row gutter changes
  useLayoutEffect(() => {
    if (didMount.current) {
      const cacheSize = positioner.size()
      const nextPositioner = initPositioner()
      let index = 0

      for (; index < cacheSize; index++) {
        const pos = positioner.get(index)
        nextPositioner.set(index, pos !== void 0 ? pos.height : 0)
      }

      setPositioner(nextPositioner)
      didMount.current = 1
    }
    // eslint-disable-next-line
  }, [itemGap])

  return positioner
}

const createPositioner = (itemGap = 0): Positioner => {
  let listHeight = 0
  const tops: number[] = []
  const items: PositionerItem[] = []

  return {
    set: (index, height = 0) => {
      items[index] = {top: tops[index] = listHeight, height}
      listHeight += height + itemGap
      return items[index]
    },
    // This only updates the items in the list that exist beyond the index
    // whose dimesions changed
    update: (index, height) => {
      const updatedItem = items[index++]
      const diff = height - updatedItem.height
      listHeight += diff
      updatedItem.height = height

      for (; index < items.length; ++index)
        tops[index] = items[index].top += diff
    },
    get: (index: number) => items[index],
    remove: (index: number) => {
      const removed = items.splice(index, 1)?.[0]
      if (removed) {
        tops.splice(index, 1)
        const diff = removed.height + itemGap
        listHeight -= diff

        for (; index < items.length; index++) {
          const item = items[index]
          tops[index] = item.top -= diff
        }
      }
    },
    est: (itemCount, defaultItemHeight) =>
      itemCount === 0
        ? 0
        : itemCount === items.length
        ? listHeight - itemGap
        : listHeight +
          Math.ceil(itemCount - items.length) * (defaultItemHeight + itemGap) -
          itemGap,
    range: (lo, hi, cb) => {
      const count = items.length
      if (count > 0) {
        let i = binarySearchGE(tops, lo)
        for (; i < count; i++) {
          const item = items[i]
          if (item.top > hi) break
          cb(item, i)
        }
      }
    },
    height: () => listHeight,
    size: () => tops.length,
  }
}

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

const emptyArr = []

const binarySearchGE = (a: number[], value: number, lo = 0) => {
  let hi = a.length - 1
  let i = hi + 1

  while (lo <= hi) {
    const m = (lo + hi) >>> 1
    const x = a[m]

    if (x >= value) {
      hi = m - 1
      i = m
    } else {
      lo = m + 1
    }
  }

  return i
}
