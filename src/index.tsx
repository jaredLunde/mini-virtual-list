import React, {useEffect, useState, useRef} from 'react'
import memoizeOne from '@essentials/memoize-one'
import useLayoutEffect from '@react-hook/passive-layout-effect'
import useThrottle, {useThrottleCallback} from '@react-hook/throttle'
import {requestTimeout, clearRequestTimeout} from '@essentials/request-timeout'

export const useList = ({
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
  itemHeight,
  itemHeightEstimate = 32,
  itemKey = defaultGetItemKey,
  overscanBy = 2,

  scrollTop,
  isScrolling,

  render,
}: UseListOptions) => {
  const forceUpdate_ = useForceUpdate()
  const forceUpdate = useThrottleCallback(forceUpdate_, 8, true)
  let startIndex = 0
  let stopIndex: undefined | number
  const {size, estimateHeight, range, get, listHeight} = positioner
  const itemCount = items.length
  const measuredCount = size()
  const itemHeightOrEstimate = itemHeight || itemHeightEstimate
  const estimatedHeight = estimateHeight(itemCount, itemHeightOrEstimate)
  const children: React.ReactElement[] = []
  const itemRole = `${role}item`
  const createListItem = (
    index: number,
    data: any,
    width: number,
    style: React.CSSProperties
  ) => (
    <ListItem
      as={itemAs}
      key={itemKey(data, index)}
      role={itemRole}
      index={index}
      data={data}
      width={width}
      height={itemHeight}
      measured={itemHeight ? noop : forceUpdate}
      positioner={positioner}
      style={style}
      render={render}
    />
  )

  overscanBy = height * overscanBy
  const r = range(
    Math.max(0, scrollTop - overscanBy / 2),
    scrollTop + overscanBy
  )
  let index = r[0]

  for (; index < r[1]; index++) {
    if (stopIndex === void 0) {
      startIndex = index
      stopIndex = index
    } else {
      startIndex = Math.min(startIndex, index)
      stopIndex = Math.max(stopIndex, index)
    }

    const data = items[index]
    const {top, height} = get(index)

    children.push(
      createListItem(
        index,
        data,
        width,
        getCachedItemStyle(itemHeight || height, top)
      )
    )
  }

  let currentHeight = listHeight()
  const needsFreshBatch =
    currentHeight <= scrollTop + overscanBy && measuredCount < itemCount

  if (needsFreshBatch) {
    const batchSize = Math.min(
      itemCount - measuredCount,
      Math.ceil((scrollTop + overscanBy - currentHeight) / itemHeightOrEstimate)
    )

    index = measuredCount

    for (; index < measuredCount + batchSize; index++) {
      const data = items[index]
      if (itemHeight) currentHeight += itemHeight
      const cachedItemStyle = getCachedItemStyle(itemHeight, currentHeight)

      children.push(
        createListItem(
          index,
          data,
          width,
          itemHeight ? cachedItemStyle : prerenderItemStyle
        )
      )
    }
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

let didEverMount = '0'

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

export type RenderComponent = React.FC<{
  index: number
  data: any
  width: number
  measure: () => void
  [prop: string]: any
}>

export const List: React.FC<ListProps> = (props) => {
  const positioner = usePositioner(props.rowGutter)
  return useList(Object.assign({positioner}, props))
}

export interface ListProps extends Omit<UseListOptions, 'positioner'> {
  rowGutter?: number
}

const ListItem: React.FC<
  ListItemProps & {as: keyof JSX.IntrinsicElements | React.ComponentType<any>}
> = ({
  render: RenderComponent,
  as: WrapperComponent,
  role,
  style,
  index,
  positioner,
  measured,
  data,
  width,
  height,
}) => {
  const ref = useRef<HTMLElement | null>(null)
  const [cursor, setCursor] = useState(emptyObj)

  useLayoutEffect(() => {
    const {current} = ref

    if (current && cursor !== emptyObj) {
      measured()
      positioner.update(index, height || current.offsetHeight)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, positioner, index])

  return (
    <WrapperComponent
      role={role}
      style={style}
      ref={(el: HTMLElement | null) => {
        ref.current = el
        if (el && positioner.get(index) === void 0)
          positioner.set(index, height || el.offsetHeight)
      }}
    >
      <RenderComponent
        index={index}
        data={data}
        width={width}
        measure={useRef(() => setCursor({})).current}
      />
    </WrapperComponent>
  )
}

interface ListItemProps {
  as: UseListOptions['itemAs']
  role: string
  style: React.CSSProperties
  index: number
  data: any
  width: number
  height?: number
  positioner: Positioner
  measured: () => void
  render: RenderComponent
}

const useForceUpdate = (): (() => void) => {
  const setState = useState({})[1]
  return useRef(() => setState({})).current
}

export const usePositioner = (
  rowGutter = 0,
  deps: React.DependencyList = []
) => {
  const didMount = useRef(0)
  const initPositioner = () => createPositioner(rowGutter)
  const [positioner, setPositioner] = useState(initPositioner)

  // Creates a new positioner if the dependencies change
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
    }
    // eslint-disable-next-line
  }, [rowGutter])

  return positioner
}

export const useSize = <T extends HTMLElement = HTMLElement>(
  ref: React.MutableRefObject<T | null>,
  deps: React.DependencyList = []
): {width: number; height: number} => {
  const getSize = () => {
    const {current} = ref
    if (current) {
      const computedStyle = getComputedStyle(current)
      const float = parseFloat
      return {
        width:
          current.clientWidth -
          float(computedStyle.paddingTop) -
          float(computedStyle.paddingBottom),
        height:
          current.clientHeight -
          float(computedStyle.paddingLeft) -
          float(computedStyle.paddingRight),
      }
    }

    return {width: 0, height: 0}
  }
  const [size, setSize] = useState<{width: number; height: number}>(getSize)

  useLayoutEffect(() => {
    const handleResize = () => setSize(getSize())
    handleResize()
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return size
}

export const useScroller = <T extends HTMLElement = HTMLElement>(
  ref: React.MutableRefObject<T | null> | Window,
  offset = 0,
  fps = 12
): {scrollTop: number; isScrolling: boolean} => {
  const current = 'current' in ref ? ref.current : ref
  const getScrollPos = () =>
    !current
      ? 0
      : 'scrollTop' in current
      ? current.scrollTop
      : current.pageYOffset || current.scrollY
  const [scrollTop, setScrollTop] = useThrottle(getScrollPos, fps)
  const [isScrolling, setIsScrolling] = useState(false)

  useLayoutEffect(() => {
    if (current) {
      let to: ReturnType<typeof requestTimeout> | undefined
      const handleScroll = () => {
        setScrollTop(getScrollPos())
        setIsScrolling(true)
        to && clearRequestTimeout(to)
        to = requestTimeout(() => {
          // This is here to prevent premature bail outs while maintaining high resolution
          // unsets. Without it there will always bee a lot of unnecessary DOM writes to style.
          setIsScrolling(false)
        }, 1000 / fps)
      }

      current.addEventListener('scroll', handleScroll)
      return () => {
        current.removeEventListener('scroll', handleScroll)
        to && clearRequestTimeout(to)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, fps])

  return {scrollTop: Math.max(0, scrollTop - offset), isScrolling}
}

const createPositioner = (rowGutter = 0): Positioner => {
  let listHeight = 0
  const tops: number[] = []
  const items: PositionerItem[] = []

  return {
    set: (index, height = 0) => {
      const top = listHeight
      listHeight += height + rowGutter
      items[index] = {top, height}
      tops[index] = top
    },
    get: (index: number): any => items[index],
    // This only updates the items in the list that exist beyond the index
    // whose dimesions changed
    update: (index, height) => {
      const updatedItem = items[index]
      const originalListHeight = listHeight
      listHeight -= updatedItem.height
      updatedItem.height = height
      listHeight += updatedItem.height
      const difference = listHeight - originalListHeight
      index++

      for (; index < tops.length; index++) {
        const item = items[index]
        item.top = item.top + difference
        tops[index] = item.top
      }
    },
    estimateHeight: (itemCount, defaultItemHeight) =>
      itemCount === tops.length
        ? listHeight
        : listHeight + Math.ceil(itemCount - tops.length) * defaultItemHeight,
    range: (lo, hi) => {
      const startIndex = binarySearchGE(tops, lo)
      return [
        startIndex,
        items.length - 1 > startIndex
          ? binarySearchGE(tops, hi, startIndex + 1)
          : startIndex,
      ]
    },
    listHeight: () => listHeight,
    size: () => tops.length,
  }
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

const cmp2 = (a, b) => a[0] === b[0] && a[1] === b[1]

const getContainerStyle = memoizeOne(
  (isScrolling: boolean | undefined, estimatedHeight: number) => ({
    position: 'relative',
    width: '100%',
    maxWidth: '100%',
    height: Math.ceil(estimatedHeight),
    maxHeight: Math.ceil(estimatedHeight),
    willChange: isScrolling ? 'contents, height' : void 0,
    pointerEvents: isScrolling ? 'none' : void 0,
  }),
  cmp2
)

const defaultGetItemKey = (_: any[], i: number): number => i

const getCachedItemStyle = memoizeOne(
  (height: number | undefined, top: number): React.CSSProperties => ({
    top,
    height,
    left: 0,
    width: '100%',
    writingMode: 'horizontal-tb',
    position: 'absolute',
  }),
  cmp2
)

const prerenderItemStyle: React.CSSProperties = {
  width: '100%',
  zIndex: -1000,
  visibility: 'hidden',
  position: 'absolute',
  writingMode: 'horizontal-tb',
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {}
const emptyObj = {}

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

//if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
//  List.displayName = 'List'
//}
