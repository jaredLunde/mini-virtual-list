import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
  useImperativeHandle,
} from 'react'
import {unstable_batchedUpdates} from 'react-dom'
import trieMemoize from 'trie-memoize'
import OneKeyMap from '@essentials/one-key-map'
import memoizeOne from '@essentials/memoize-one'
import useLayoutEffect from '@react-hook/passive-layout-effect'

const emptyArr = []

const binarySearchGE = (a: number[], value: number) => {
  let lo = 0
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

const createItemPositioner = (rowGutter = 0): ItemPositioner => {
  // Track the height of each column.
  // Layout algorithm below always inserts into the shortest column.
  let columnHeight = 0
  let numItems = 0
  const items: Record<number, {top: number; height: number}> = {}

  return {
    set: (index, height = 0) => {
      const top = columnHeight
      columnHeight += height + rowGutter
      items[index] = {top, height}
      numItems++
      return items[index]
    },
    get: (index: number | undefined): any =>
      index === void 0 ? index : items[index],
    // this only updates items in the specific columns that have changed, on and after the
    // specific items that have changed
    update: (index, height) => {
      const updatedItems: IUpdatedItem[] = []
      let i = 0

      for (i = index + 1; i < numItems; i++) {
        const item = items[index]
        item.top = columnHeight
        item.height = height
        columnHeight += item.height + rowGutter
        updatedItems.push(item)
      }

      return updatedItems
    },
    rowGutter,
  }
}

interface IUpdatedItem {
  top: number
  height: number
}

interface ItemPositioner {
  set: (index: number, height: number) => {top: number; height: number}
  get: (index: number | undefined) => {top: number; height: number}
  update: (index: number, height: number) => IUpdatedItem[]
  rowGutter: number
}

//   O(log(n)) lookup of cells to render for a given viewport size
//   O(1) lookup of shortest measured column (so we know when to enter phase 1)
const createPositionCache = (): PositionCache => {
  // Store tops of each cell
  const tops: number[] = []
  // Tracks the height of the list
  let listHeight = 0

  const estimateTotalHeight = (
    itemCount: number,
    defaultItemHeight: number
  ): number =>
    itemCount === tops.length
      ? listHeight
      : listHeight + Math.ceil(itemCount - tops.length) * defaultItemHeight

  // Render all cells visible within the defined window range.
  const range = (
    lo: number,
    hi: number,
    renderCallback: (index: number, top: number) => void
  ): void => {
    const startIndex = binarySearchGE(tops, lo)
    const stopIndex = binarySearchGE(tops, hi)
    for (let index = startIndex; index < stopIndex; index++)
      renderCallback(index, tops[index])
  }

  const setPosition = (index: number, top: number, height: number): void => {
    if (tops[index] === void 0) listHeight += height
    tops[index] = top
  }

  return {
    range,
    get size(): number {
      return tops.length
    },
    estimateTotalHeight,
    setPosition,
  }
}

// Position cache requirements:
interface PositionCache {
  range: (
    lo: number,
    hi: number,
    renderCallback: (index: number, top: number) => void
  ) => void
  size: number
  estimateTotalHeight: (itemCount: number, defaultItemHeight: number) => number
  setPosition: (index: number, top: number, height: number) => void
}

const getContainerStyle = memoizeOne(
  (isScrolling: boolean | undefined, estimatedTotalHeight: number) => ({
    position: 'relative',
    width: '100%',
    maxWidth: '100%',
    height: Math.ceil(estimatedTotalHeight),
    maxHeight: Math.ceil(estimatedTotalHeight),
    willChange: isScrolling ? 'contents, height' : void 0,
    pointerEvents: isScrolling ? 'none' : void 0,
  })
)

const assignUserStyle = memoizeOne(
  (containerStyle, userStyle) => Object.assign({}, containerStyle, userStyle),
  (args, pargs) => args[0] === pargs[0] && args[1] === pargs[1]
)

const assignUserItemStyle = trieMemoize(
  [WeakMap, OneKeyMap],
  (itemStyle: React.CSSProperties, userStyle: React.CSSProperties) =>
    Object.assign({}, itemStyle, userStyle)
)

const defaultGetItemKey = (_: any[], i: number): number => i

const getCachedItemStyle = trieMemoize(
  [OneKeyMap, {}],
  (height: number, top: number): React.CSSProperties => ({
    top,
    height,
    left: 0,
    width: '100%',
    writingMode: 'horizontal-tb',
    position: 'absolute',
  })
)

const prerenderItemStyle: React.CSSProperties = {
  width: '100%',
  zIndex: -1000,
  visibility: 'hidden',
  position: 'absolute',
  writingMode: 'horizontal-tb',
}

/*
const useForceUpdate = (): (() => void) => {
  const setState = useState<number>(0)[1]
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(() => setState((current) => ++current), emptyArr)
}
*/
const elementsCache: WeakMap<Element, number> = new WeakMap()

const getRefSetter = trieMemoize(
  [OneKeyMap, OneKeyMap],
  (positionCache: PositionCache, itemPositioner: ItemPositioner) =>
    trieMemoize([{}], (index) => (el: HTMLElement | null): void => {
      if (el === null) return
      elementsCache.set(el, index)

      if (itemPositioner.get(index) === void 0) {
        const item = itemPositioner.set(index, el.offsetHeight)
        positionCache.setPosition(index, item.top, item.height)
      }
    })
)

export const List: React.FC<ListProps> = React.forwardRef(
  (
    {
      items,
      width,
      height,
      rowGutter,
      onRender,

      as = 'div',
      id,
      className,
      style,
      role = 'list',
      tabIndex = 0,
      containerRef,
      itemAs = 'div',
      itemStyle,
      itemHeight,
      itemHeightEstimate = 300,
      itemKey = defaultGetItemKey,
      overscanBy = 2,

      scrollTop,
      isScrolling,

      render,
    },
    ref
  ) => {
    const didMount = useRef<string>('0')
    const initPositioner = useCallback(
      (): ItemPositioner => createItemPositioner(rowGutter || 0),
      [rowGutter]
    )
    const stopIndex = useRef<number | undefined>()
    const startIndex = useRef<number>(0)
    const [itemPositioner, setItemPositioner] = useState<ItemPositioner>(
      initPositioner
    )
    const [positionCache, setPositionCache] = useState<PositionCache>(
      createPositionCache
    )

    // Calls the onRender callback if the rendered indices changed
    useEffect(() => {
      if (typeof onRender === 'function' && stopIndex.current !== void 0) {
        onRender(startIndex.current, stopIndex.current, items)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onRender, items, startIndex.current, stopIndex.current])
    // Allows parent components to clear the position cache imperatively
    useImperativeHandle(
      ref,
      () => ({
        clearPositions: (): void => {
          setPositionCache(createPositionCache())
        },
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      emptyArr
    )
    // Updates the item positions any time a prop potentially affecting their
    // size changes
    useLayoutEffect(() => {
      didMount.current = '1'
      // Bail out if the item heights are fixed
      if (itemHeight) return
      const cacheSize = positionCache.size
      const nextPositionCache = createPositionCache()
      const nextItemPositioner = initPositioner()
      const stateUpdates = (): void => {
        setPositionCache(nextPositionCache)
        setItemPositioner(nextItemPositioner)
      }

      if (typeof unstable_batchedUpdates === 'function') {
        unstable_batchedUpdates(stateUpdates)
      } else {
        stateUpdates()
      }

      for (let index = 0; index < cacheSize; index++) {
        const pos = itemPositioner.get(index)

        if (pos !== void 0) {
          const item = nextItemPositioner.set(index, pos.height)
          nextPositionCache.setPosition(index, item.top, pos.height)
        }
      }
    }, [
      itemHeight,
      width,
      rowGutter,
      itemPositioner,
      positionCache.size,
      initPositioner,
    ])

    const setItemRef = getRefSetter(positionCache, itemPositioner)
    const itemCount = items.length
    const measuredCount = positionCache.size
    const estimatedTotalHeight = itemHeight
      ? itemHeight * itemCount
      : positionCache.estimateTotalHeight(itemCount, itemHeightEstimate)
    const children: React.ReactElement[] = []
    const itemRole = `${role}item`
    overscanBy = height * overscanBy
    stopIndex.current = void 0

    positionCache.range(
      Math.max(0, scrollTop - overscanBy),
      scrollTop + overscanBy,
      (index, top) => {
        if (stopIndex.current === void 0) {
          startIndex.current = index
          stopIndex.current = index
        } else {
          startIndex.current = Math.min(startIndex.current, index)
          stopIndex.current = Math.max(stopIndex.current, index)
        }

        const data = items[index],
          key = itemKey(data, index),
          cachedItemStyle = getCachedItemStyle(
            itemHeight || itemPositioner.get(index).height,
            top
          )

        children.push(
          React.createElement(
            itemAs,
            {
              key,
              ref: setItemRef(index),
              role: itemRole,
              style:
                typeof itemStyle === 'object' && itemStyle !== null
                  ? assignUserItemStyle(cachedItemStyle, itemStyle)
                  : cachedItemStyle,
            },
            React.createElement(render, {index, data, width})
          )
        )
      }
    )

    if (
      estimatedTotalHeight < scrollTop + overscanBy &&
      measuredCount < itemCount
    ) {
      const batchSize = Math.min(
        itemCount - measuredCount,
        Math.ceil(
          (scrollTop + overscanBy - estimatedTotalHeight) / itemHeightEstimate
        )
      )

      let index = measuredCount

      for (; index < measuredCount + batchSize; index++) {
        const data = items[index],
          key = itemKey(data, index),
          cachedItem = itemPositioner.get(index),
          cachedItemStyle = getCachedItemStyle(
            itemHeight || cachedItem.height,
            cachedItem.top
          )

        const getItemProps = (style: React.CSSProperties) => ({
          key,
          ref: setItemRef(index),
          role: itemRole,
          style:
            typeof itemStyle === 'object' && itemStyle !== null
              ? assignUserItemStyle(style, itemStyle)
              : style,
        })

        children.push(
          React.createElement(
            itemAs,
            getItemProps(itemHeight ? cachedItemStyle : prerenderItemStyle),
            React.createElement(render, {index, data, width})
          )
        )
      }
    }
    // gets the container style object based upon the estimated height and whether or not
    // the page is being scrolled
    const containerStyle = getContainerStyle(isScrolling, estimatedTotalHeight)

    return React.createElement(as, {
      ref: containerRef,
      id,
      key: didMount.current,
      role,
      className,
      tabIndex,
      style:
        typeof style === 'object' && style !== null
          ? assignUserStyle(containerStyle, style)
          : containerStyle,
      children,
    })
  }
)

export interface ListProps {
  readonly columnWidth?: number
  readonly rowGutter?: number
  readonly width: number // width of the container
  readonly height: number // height of the window
  readonly scrollTop: number
  readonly isScrolling?: boolean
  readonly containerRef?:
    | ((element: HTMLElement) => void)
    | React.MutableRefObject<HTMLElement | null>
  readonly as?: any
  readonly id?: string
  readonly className?: string
  readonly style?: React.CSSProperties
  readonly role?: string
  readonly tabIndex?: number | string
  readonly items: any[]
  readonly itemAs?: any
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
  readonly render: any
}

const defaultRect = {
  height: 0,
  width: 0,
  x: 0,
  y: 0,
}

export const useRect = <T extends HTMLElement = HTMLElement>(
  deps = []
): [LikeDOMRect, React.MutableRefObject<T | null>] => {
  const [rect, setRect] = useState<LikeDOMRect>(defaultRect)
  const ref = useRef<T>(null)

  useLayoutEffect(() => {
    const {current} = ref
    if (current) {
      setRect(current.getBoundingClientRect())
      const handleResize = () => setRect(current.getBoundingClientRect())
      window.addEventListener('resize', handleResize)
      window.addEventListener('orientationchange', handleResize)
      return () => {
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('orientationchange', handleResize)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return [rect, ref]
}

interface LikeDOMRect {
  readonly width: number
  readonly height: number
  readonly x: number
  readonly y: number
}

export const useScrollTop = <T extends HTMLElement = HTMLElement>(): [
  number,
  React.MutableRefObject<T | null>
] => {
  const [scrollTop, setScrollTop] = useState(0)
  const ref = useRef<T>(null)

  useLayoutEffect(() => {
    const {current} = ref
    if (current) {
      const handleScroll = () => setScrollTop(current.scrollTop)
      current.addEventListener('scroll', handleScroll)
      return () => current.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return [scrollTop, ref]
}

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  List.displayName = 'List'
}
