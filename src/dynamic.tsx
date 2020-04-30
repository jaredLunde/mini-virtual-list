import * as React from 'react'
import {useCallback, useRef, useState, useEffect} from 'react'
import useLayoutEffect from '@react-hook/passive-layout-effect'
import {getContainerStyle, getCachedItemStyle, defaultGetItemKey} from './utils'
import type {ListPropsBase} from './types'

export const useDynamicList = ({
  positioner,
  containerRef,

  items,
  width,
  height,
  onRender,

  as: Container = 'div',
  id,
  className,
  style,
  role = 'list',
  tabIndex = 0,
  itemAs = 'div',
  itemHeightEstimate = 32,
  itemKey = defaultGetItemKey,
  overscanBy = 2,

  scrollTop,
  isScrolling,

  render,
}: UseDynamicListOptions) => {
  const forceUpdate_ = useForceUpdate()
  const updating = useRef(false)
  // batches calls to force update
  updating.current = false
  const forceUpdate = () => {
    if (!updating.current) {
      updating.current = true
      forceUpdate_()
    }
  }
  const itemCount = items.length
  const measuredCount = positioner.size()
  const estimatedHeight = positioner.est(itemCount, itemHeightEstimate)
  const children: React.ReactElement[] = []
  const itemRole = `${role}item`
  const createListItem = (
    index: number,
    data: any,
    width: number,
    style: React.CSSProperties
  ) => (
    <DynamicListItem
      as={itemAs}
      key={itemKey(data, index)}
      role={itemRole}
      index={index}
      data={data}
      width={width}
      meas={forceUpdate}
      pos={positioner}
      style={style}
      render={render}
    />
  )

  let startIndex = 0
  let stopIndex: number | undefined
  overscanBy = height * overscanBy
  positioner.range(
    Math.max(0, scrollTop - overscanBy / 2),
    scrollTop + overscanBy,
    ({height, top}, i) => {
      startIndex = stopIndex === void 0 ? i : startIndex
      stopIndex = i
      children.push(
        createListItem(i, items[i], width, getCachedItemStyle(height, top))
      )
    }
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
      children.push(
        createListItem(index, items[index], width, prerenderItemStyle)
      )
  }

  // If we needed a fresh batch we should reload our components with the measured
  // sizes
  useEffect(() => {
    if (needsFreshBatch) forceUpdate()
    // eslint-disable-next-line
  }, [needsFreshBatch])
  // Calls the onRender callback if the rendered indices changed
  useEffect(() => {
    if (typeof onRender === 'function' && stopIndex !== void 0) {
      onRender(startIndex, stopIndex, items)
    }

    didEverMount = '1'
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRender, items, startIndex, stopIndex])

  const containerStyle = getContainerStyle(isScrolling, estimatedHeight)

  return (
    <Container
      ref={containerRef}
      id={id}
      key={didEverMount}
      role={role}
      className={className}
      tabIndex={tabIndex}
      style={
        style !== void 0
          ? Object.assign({}, containerStyle, style)
          : containerStyle
      }
      children={children}
    />
  )
}

export interface UseDynamicListOptions extends Omit<ListPropsBase, 'itemGap'> {
  readonly positioner: Positioner
  readonly containerRef?:
    | ((element: HTMLElement) => void)
    | React.MutableRefObject<HTMLElement | null>
    | null
  readonly itemHeightEstimate?: number
  readonly render: React.ComponentType<DynamicListRenderProps>
}

export const DynamicList = React.forwardRef<any, DynamicListProps>(
  (props, containerRef) => {
    const positioner = usePositioner(props.itemGap)
    return useDynamicList(Object.assign({positioner, containerRef}, props))
  }
)

let didEverMount = '0'

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

const DynamicListItem: React.FC<
  DynamicListItemProps & {
    as: keyof JSX.IntrinsicElements | React.ComponentType<any>
  }
> = ({
  render: RenderComponent,
  as: WrapperComponent,
  role,
  style,
  index,
  pos,
  meas,
  data,
  width,
}) => {
  const ref = useRef<HTMLElement | null>(null)
  const measure = useCallback(() => {
    const current = ref.current
    if (current) {
      pos.update(index, current.offsetHeight)
      meas()
    }
    // eslint-disable-next-line
  }, [pos])

  return (
    <WrapperComponent
      role={role}
      style={style}
      ref={(el: HTMLElement | null) => {
        if (el) {
          ref.current = el.firstChild as HTMLElement
          pos.get(index) === void 0 && pos.set(index, el.offsetHeight)
        }
      }}
    >
      <RenderComponent
        index={index}
        data={data}
        width={width}
        measure={measure}
      />
    </WrapperComponent>
  )
}

interface DynamicListItemProps {
  as: DynamicListProps['itemAs']
  role: string
  style: React.CSSProperties
  index: number
  data: any
  width: number
  render: React.ComponentType<DynamicListRenderProps>
  pos: Positioner
  meas: () => void
}

const useForceUpdate = (): (() => void) => {
  const setState = useState(emptyObj)[1]
  return useRef(() => setState({})).current
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

const prerenderItemStyle: React.CSSProperties = {
  width: '100%',
  zIndex: -1000,
  visibility: 'hidden',
  position: 'absolute',
  writingMode: 'horizontal-tb',
}

const emptyObj = {}
const emptyArr = []

const binarySearchGE = (a: number[], value: number, lo = 0) => {
  let hi = a.length - 1
  let i = hi + 1

  while (lo <= hi) {
    const m = (lo + hi) >>> 1
    const x = a[m]

    if (x >= value) {
      i = m
      hi = m - 1
    } else {
      lo = m + 1
    }
  }

  return i
}

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
  DynamicList.displayName = 'DynamicList'
}
