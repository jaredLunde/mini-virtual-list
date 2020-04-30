<<<<<<< HEAD
import React, {
  memo,
  createElement,
  forwardRef,
  useCallback,
  useEffect,
  useState,
  useRef,
} from 'react'
import memoize from 'trie-memoize'
=======
import React, {useEffect, useState, useRef} from 'react'
import trieMemoize from 'trie-memoize'
>>>>>>> Light refactor
import OneKeyMap from '@essentials/one-key-map'
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
  itemStyle,
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
      measured={itemHeight ? noop : forceUpdate}
      positioner={positioner}
      style={itemStyle !== void 0 ? Object.assign({}, style, itemStyle) : style}
      render={render}
    />
  )

<<<<<<< HEAD
const binarySearchGE = (
  a: {top: number; height: number}[],
  value: number,
  lo = 0
) => {
  let hi = a.length - 1
  let index = hi + 1

  while (lo <= hi) {
    const mid = (lo + hi) >>> 1
    const top = a[mid].top

    if (top >= value) {
      index = mid
      hi = mid - 1
    } else {
      lo = mid + 1
=======
  overscanBy = height * overscanBy
  const r = range(Math.max(0, scrollTop - overscanBy), scrollTop + overscanBy)
  let index = r[0]

  for (; index < r[1]; index++) {
    if (stopIndex === void 0) {
      startIndex = index
      stopIndex = index
    } else {
      startIndex = Math.min(startIndex, index)
      stopIndex = Math.max(stopIndex, index)
>>>>>>> Light refactor
    }

    const data = items[index]
    const cachedItemStyle = getCachedItemStyle(itemHeight, get(index).top)

    children.push(
      createListItem(
        index,
        data,
        width,
        itemStyle !== void 0
          ? Object.assign({}, cachedItemStyle, itemStyle)
          : cachedItemStyle
      )
    )
  }

<<<<<<< HEAD
  return index
}

const createPositioner = (rowGutter = 0): Positioner => {
  let listHeight = 0
  const items: PositionerItem[] = []

  return {
    set: (index, height) => {
      const top = listHeight
      listHeight += height + rowGutter
      items[index] = {top, height}
    },
    get: (index) => items[index],
    // This only updates the items in the list that exist beyond the index
    // whose dimesions changed
    update: (index, height) => {
      const updatedItem = items[index++]
      const originalListHeight = listHeight
      listHeight -= updatedItem.height - rowGutter
      updatedItem.height = height
      listHeight += updatedItem.height + rowGutter
      const difference = listHeight - originalListHeight
      for (; index < items.length; index++) items[index].top += difference
    },
    estimateHeight: (itemCount, defaultItemHeight) =>
      listHeight + (itemCount - items.length) * defaultItemHeight,
    range: (lo, hi) => {
      const startIndex = binarySearchGE(items, lo)
      return [startIndex, binarySearchGE(items, hi, startIndex + 1)]
    },
    height: () => listHeight,
    size: () => items.length,
=======
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
>>>>>>> Light refactor
  }

<<<<<<< HEAD
interface Positioner {
  set: (index: number, height: number) => void
  get: (index: number) => PositionerItem
  update: (index: number, height: number) => void
  estimateHeight: (itemCount: number, defaultItemHeight: number) => number
  range: (lo: number, hi: number) => [number, number]
  height: () => number
  size: () => number
}

interface PositionerItem {
  top: number
  height: number
}

const getContainerStyle = memoize(
  [OneKeyMap, OneKeyMap, OneKeyMap],
  (
    itemHeight: number | undefined,
    estimatedHeight: number,
    isScrolling: boolean | undefined
  ) => ({
    position: 'relative',
    width: '100%',
    height: Math.ceil(estimatedHeight),
    willChange:
      isScrolling && !itemHeight
        ? 'contents, height'
        : isScrolling
        ? 'contents'
        : void 0,
    pointerEvents: isScrolling ? 'none' : void 0,
  })
)

const defaultGetItemKey = (_: any, i: number): number => i

const getCachedItemStyle = memoize(
  [OneKeyMap, {}],
  (height: number | undefined, top: number): React.CSSProperties => {
    const style: React.CSSProperties = {
      top,
      left: 0,
      width: '100%',
      writingMode: 'horizontal-tb',
      position: 'absolute',
    }
    if (height) style.height = height
    return style
  }
)

const prerenderItemStyle: React.CSSProperties = {
  width: '100%',
  visibility: 'hidden',
  position: 'absolute',
  writingMode: 'horizontal-tb',
=======
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
  readonly itemStyle?: React.CSSProperties
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

// ~5.33x faster than createElement without the memo
const createRenderElement = trieMemoize(
  [OneKeyMap, {}, WeakMap, OneKeyMap, OneKeyMap],
  (
    RenderComponent: keyof JSX.IntrinsicElements | React.ComponentType<any>,
    index: number,
    data: any,
    width: number,
    measure: React.Dispatch<React.SetStateAction<number>>
  ) => (
    <RenderComponent
      index={index}
      data={data}
      width={width}
      measure={() => measure((curr) => ++curr)}
    />
  )
)

export type RenderComponent = React.FC<
  ListItemChildProps & {
    measure: () => void
    [prop: string]: any
  }
>

export const List: React.FC<ListProps> = (props) => {
  const positioner = usePositioner(props.rowGutter)
  return useList(Object.assign({positioner}, props))
>>>>>>> Light refactor
}

export interface ListProps extends Omit<UseListOptions, 'positioner'> {
  rowGutter?: number
}

<<<<<<< HEAD
const ListItem: React.FC<ListItemProps> = memo(
  (props) => {
    const ref = useRef<HTMLElement | null>(null)
    const deps = [props.index, props.positioner, props.itemHeight]

    useLayoutEffect(() => {
      if (ref.current) {
        if (props.positioner.get(props.index) === void 0) {
          props.positioner.set(
            props.index,
            props.itemHeight || ref.current.offsetHeight
          )
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)

    const measure = useCallback(() => {
      if (ref.current && !props.itemHeight) {
        props.positioner.update(props.index, ref.current.offsetHeight)
        props.measured()
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)

    return createElement(props.render, {
      ref,
      index: props.index,
      data: props.data,
      width: props.width,
      style: props.style,
      measure,
    })
  },
  (p, n) =>
    // This is much faster than looping and is worth it despite the uptick in a few bytes
    p.render === n.render &&
    p.style === n.style &&
    p.width === n.width &&
    p.data === n.data &&
    p.itemHeight === n.itemHeight &&
    p.positioner === n.positioner &&
    p.index === n.index
  // props.measured is purposely excluded. It's stable no matter what the strict
  // equality says and I don't want to waste putting it in a useCallback.
)
=======
const ListItem: React.FC<
  ListItemProps & {as: keyof JSX.IntrinsicElements | React.ComponentType<any>}
> = ({index, positioner, measured, as, role, style, render, data, width}) => {
  const ref = useRef<HTMLElement | null>(null)
  const [tally, setTally] = useState(0)
  const deps = [index, positioner, tally]

  useLayoutEffect(() => {
    const {current} = ref
    if (current && positioner.get(index) === void 0)
      positioner.set(index, current.offsetHeight)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useLayoutEffect(() => {
    const {current} = ref
    if (current && tally > 0) {
      positioner.update(index, current.offsetHeight)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    if (tally > 0) measured()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tally])

  return React.createElement(
    as,
    {role, style, ref},
    createRenderElement(render, index, data, width, setTally)
  )
}

interface ListItemProps {
  as: UseListOptions['itemAs']
  role: string
  style: React.CSSProperties
  index: number
  data: any
  width: number
  positioner: Positioner
  measured: () => void
  render: RenderComponent
}
>>>>>>> Light refactor

interface ListItemProps<Data = any> {
  readonly index: number
  readonly data: Data
  readonly width: number
  readonly style: React.CSSProperties
  readonly itemHeight?: number
  readonly positioner: Positioner
  readonly measured: () => void
  readonly render: React.FC<ItemProps<Data>>
}

<<<<<<< HEAD
export const List = forwardRef<HTMLElement, ListProps>(
  (
    {
      width,
      height,
      rowGutter = 0,
      overscanBy = 2,

      scrollTop,
      isScrolling,

      items,
      itemHeight,
      itemHeightEstimate = 32,
      itemKey = defaultGetItemKey,

      as = 'div',
      id,
      className,
      style,
      role,
      tabIndex = 0,

      onRender,
      render,
    },
    ref
  ) => {
    const didMount = useRef<string>('0')
    const forceUpdate = useForceUpdate()
    const stopIndex = useRef<number | undefined>()
    const startIndex = useRef<number>(0)
    const [positioner, setPositioner] = useState<Positioner>(
      (): Positioner => createPositioner(rowGutter)
    )
    // Creates a new item positioner if the row gutter changes
    useEffect(() => {
      const nextPostitioner = createPositioner(rowGutter)
      setPositioner(nextPostitioner)
      const cacheSize = positioner.size()

      for (let index = 0; index < cacheSize; index++) {
        const pos = positioner.get(index)
        nextPostitioner.set(index, pos.height)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rowGutter])

    // Calls the onRender callback if the rendered indices changed
    useEffect(() => {
      if (typeof onRender === 'function' && stopIndex.current !== void 0) {
        onRender(startIndex.current, stopIndex.current, items)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startIndex.current, stopIndex.current, onRender, items])

    // Invalidates the container key if coming for SSR
    useEffect(() => {
      didMount.current = '1'
    }, [])

    const itemCount = items.length
    const measuredCount = positioner.size()
    const itemHeightOrEstimate = itemHeight || itemHeightEstimate
    const estimatedHeight = positioner.estimateHeight(
      itemCount,
      itemHeightOrEstimate
    )
    const children: React.ReactElement[] = []
    const getItemProps = (
      index: number,
      data: any,
      style: React.CSSProperties
    ) => ({
      key: itemKey(data, index),
      index,
      data,
      width,
      measured: forceUpdate,
      itemHeight,
      positioner,
      style,
      render,
    })
    overscanBy = height * overscanBy
    stopIndex.current = void 0

    // eslint-disable-next-line prefer-const
    let [index, stop] = positioner.range(
      Math.max(0, scrollTop - overscanBy),
      scrollTop + overscanBy
    )

    for (; index < stop; index++) {
      if (stopIndex.current === void 0) {
        startIndex.current = index
        stopIndex.current = index
      } else {
        startIndex.current = Math.min(startIndex.current, index)
        stopIndex.current = Math.max(stopIndex.current, index)
      }

      const {top} = positioner.get(index)
      const data = items[index]
      const cachedItemStyle = getCachedItemStyle(itemHeight, top)

      children.push(
        createElement(ListItem, getItemProps(index, data, cachedItemStyle))
      )
    }

    let listHeight = positioner.height()
=======
const useForceUpdate = (): (() => void) => {
  const setState = useState<number>(0)[1]
  return () => setState((current) => ++current)
}
>>>>>>> Light refactor

export const usePositioner = (
  rowGutter = 0,
  deps: React.DependencyList = []
) => {
  const didMount = useRef(0)
  const initPositioner = () => createPositioner(rowGutter || 0)
  const [positioner, setPositioner] = useState(initPositioner)

<<<<<<< HEAD
      index = measuredCount

      for (; index < measuredCount + batchSize; index++) {
        const data = items[index]
        if (itemHeight) listHeight += itemHeight
        const cachedItemStyle = getCachedItemStyle(itemHeight, listHeight)

        children.push(
          createElement<ListItemProps<ListProps['items']>>(
            ListItem,
            getItemProps(
              index,
              data,
              itemHeight ? cachedItemStyle : prerenderItemStyle
            )
          )
        )
      }
    }

    const containerStyle = getContainerStyle(
      itemHeight,
      estimatedHeight,
      isScrolling
    )

    return createElement(as, {
      ref,
      id,
      key: didMount.current,
      role,
      className,
      tabIndex,
      style:
        style !== void 0
          ? Object.assign({}, containerStyle, style)
          : containerStyle,
      children,
    })
  }
)

export interface ListProps<Item = any> {
  readonly width: number
  readonly height: number
  readonly rowGutter?: number
  readonly overscanBy?: number

  readonly scrollTop: number
  readonly isScrolling?: boolean

  readonly items: Item[]
  readonly itemHeight?: number
  readonly itemHeightEstimate?: number
  readonly itemKey?: (data: Item, index: number) => string | number

  readonly as?: any
  readonly id?: string
  readonly className?: string
  readonly style?: React.CSSProperties
  readonly role?: string
  readonly tabIndex?: number | string

  readonly onRender?: (
    startIndex: number,
    stopIndex: number | undefined,
    items: any[]
  ) => void
  readonly render: React.FC<ItemProps<Item>>
}

export interface ItemProps<Data = any> {
  index: number
  data: Data
  style: React.CSSProperties
  measure: () => void
  [prop: string]: any
}

const defaultSize = {width: 0, height: 0}

=======
  // Creates a new positioner if the dependencies change
  useEffect(() => {
    if (didMount.current) setPositioner(initPositioner())
    didMount.current = 1
    // eslint-disable-next-line
  }, deps)

  // Sets a new item positioner if the row gutter changes
  useEffect(() => {
    setPositioner(initPositioner())
    // eslint-disable-next-line
  }, [rowGutter])

  return positioner
}

>>>>>>> Light refactor
export const useSize = <T extends HTMLElement = HTMLElement>(
  ref: React.MutableRefObject<T | null>,
  deps: React.DependencyList = []
): {width: number; height: number} => {
  const [size, setSize] = useState<{width: number; height: number}>(defaultSize)

  useLayoutEffect(() => {
    const {current} = ref

    if (current) {
      const handleResize = () => {
        const computedStyle = getComputedStyle(current)
        const float = parseFloat
        const width =
          current.clientWidth -
          float(computedStyle.paddingTop) -
          float(computedStyle.paddingBottom)
        const height =
          current.clientHeight -
          float(computedStyle.paddingLeft) -
          float(computedStyle.paddingRight)
        setSize({height, width})
      }

      handleResize()
      window.addEventListener('resize', handleResize)
      window.addEventListener('orientationchange', handleResize)
      return () => {
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('orientationchange', handleResize)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps.concat(ref.current))

<<<<<<< HEAD
  return size
=======
  return {width: rect.width, height: rect.height}
}

const defaultRect = {width: 0, height: 0, x: 0, y: 0}

interface LikeDOMRect {
  readonly width: number
  readonly height: number
  readonly x: number
  readonly y: number
>>>>>>> Light refactor
}

export const useScroller = <T extends HTMLElement = HTMLElement>(
  ref: React.MutableRefObject<T | null> | Window,
  offset = 0,
  fps = 12
): {scrollTop: number; isScrolling: boolean} => {
  const [scrollTop, setScrollTop] = useThrottle(0, fps)
  const [isScrolling, setIsScrolling] = useState(false)

  useLayoutEffect(() => {
<<<<<<< HEAD
    const {current} = ref
    let tick: number | undefined

    if (current) {
      const handleScroll = () => {
        if (tick) return
        tick = window.requestAnimationFrame(() => {
          setScrollTop(current.scrollTop)
          tick = void 0
        })
      }

=======
    const current = 'current' in ref ? ref.current : ref
    if (current) {
      const handleScroll = () =>
        setScrollTop(
          'scrollTop' in current
            ? current.scrollTop
            : current.scrollY !== void 0
            ? current.scrollY
            : current.pageYOffset
        )
>>>>>>> Light refactor
      current.addEventListener('scroll', handleScroll)
      return () => {
        current.removeEventListener('scroll', handleScroll)
        if (tick) window.cancelAnimationFrame(tick)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, ['current' in ref ? ref.current : ref])

  useEffect(() => {
    setIsScrolling(true)
    const to = requestTimeout(() => {
      // This is here to prevent premature bail outs while maintaining high resolution
      // unsets. Without it there will always bee a lot of unnecessary DOM writes to style.
      setIsScrolling(false)
    }, 40 + 1000 / fps)
    return () => clearRequestTimeout(to)
  }, [fps, scrollTop])

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

const getContainerStyle = memoizeOne(
  (isScrolling: boolean | undefined, estimatedHeight: number) => ({
    position: 'relative',
    width: '100%',
    maxWidth: '100%',
    height: Math.ceil(estimatedHeight),
    maxHeight: Math.ceil(estimatedHeight),
    willChange: isScrolling ? 'contents, height' : void 0,
    pointerEvents: isScrolling ? 'none' : void 0,
  })
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
  (a, b) => a[0] === b[0] && a[1] === b[1]
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
