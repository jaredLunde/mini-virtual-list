import React, {useCallback, useEffect, useState, useRef} from 'react'
import {unstable_batchedUpdates} from 'react-dom'
import trieMemoize from 'trie-memoize'
import OneKeyMap from '@essentials/one-key-map'
import memoizeOne from '@essentials/memoize-one'
import useLayoutEffect from '@react-hook/passive-layout-effect'

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

const createItemPositioner = (rowGutter = 0): ItemPositioner => {
  let listHeight = 0
  let numItems = 0
  const items: Record<number, {top: number; height: number}> = {}

  return {
    set: (index, height = 0) => {
      const top = listHeight
      listHeight += height + rowGutter
      items[index] = {top, height}
      numItems++
      return items[index]
    },
    get: (index: number | undefined): any =>
      index === void 0 ? index : items[index],
    // This only updates the items in the list that exist beyond the index
    // whose dimesions changed
    update: (index, height) => {
      const updatedItem = items[index]
      const originalListHeight = listHeight
      listHeight -= updatedItem.height - rowGutter
      updatedItem.height = height
      listHeight += updatedItem.height + rowGutter
      const difference = listHeight - originalListHeight
      index++

      for (; index < numItems; index++) {
        const item = items[index]
        item.top = item.top + difference
      }

      return updatedItem
    },
  }
}

interface ItemPositioner {
  set: (index: number, height: number) => ItemPositionerItem
  get: (index: number | undefined) => ItemPositionerItem
  update: (index: number, height: number) => ItemPositionerItem
}

interface ItemPositionerItem {
  top: number
  height: number
}

const createPositionCache = (): PositionCache => {
  const tops: number[] = []
  let listHeight = 0

  const estimateTotalHeight = (
    itemCount: number,
    defaultItemHeight: number
  ): number =>
    itemCount === tops.length
      ? listHeight
      : listHeight + Math.ceil(itemCount - tops.length) * defaultItemHeight

  const setPosition = (index: number, top: number, height: number): void => {
    if (tops[index] === void 0) listHeight += height
    tops[index] = top
  }

  return {
    // Gets the list items in the defined window range
    // O(log(n)) lookup ;)
    range: (lo, hi) => {
      const startIndex = binarySearchGE(tops, lo)
      return [startIndex, binarySearchGE(tops, hi, startIndex + 1)]
    },
    size: () => tops.length,
    listHeight: () => listHeight,
    estimateTotalHeight,
    setPosition,
  }
}

// Position cache requirements:
interface PositionCache {
  range: (lo: number, hi: number) => [number, number]
  size: () => number
  listHeight: () => number
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
  [{}, {}],
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

const useForceUpdate = (): (() => void) => {
  const setState = useState<number>(0)[1]
  return () => setState((current) => ++current)
}

const elementsCache = new Map()
const getRefSetter = trieMemoize(
  [OneKeyMap, OneKeyMap],
  (positionCache: PositionCache, itemPositioner: ItemPositioner) =>
    trieMemoize(
      [OneKeyMap, {}],
      (itemHeight: number, index: number) => (el: HTMLElement | null): void => {
        if (el === null) return
        elementsCache.set(index, el)
        if (itemPositioner.get(index) === void 0) {
          const item = itemPositioner.set(index, itemHeight || el.offsetHeight)
          positionCache.setPosition(index, item.top, item.height)
        }
      }
    )
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
      itemAs = 'div',
      itemStyle,
      itemHeight,
      itemHeightEstimate = 32,
      itemKey = defaultGetItemKey,
      overscanBy = 2,

      scrollTop,
      isScrolling,

      render,
    },
    ref
  ) => {
    const didMount = useRef<string>('0')
    const forceUpdate = useForceUpdate()
    const initPositioner = useCallback(
      (): ItemPositioner => createItemPositioner(rowGutter || 0),
      [rowGutter]
    )
    const stopIndex = useRef<number | undefined>()
    const startIndex = useRef<number>(0)
    const prevItemHeight = useRef<number | undefined>(itemHeight)
    const [itemPositioner, setItemPositioner] = useState<ItemPositioner>(
      initPositioner
    )
    const [positionCache, setPositionCache] = useState<PositionCache>(
      createPositionCache
    )
    const measure = useCallback(
      trieMemoize([{}], (index) => () => {
        const originalItem = itemPositioner.get(index)
        const nextHeight = itemHeight || elementsCache.get(index).offsetHeight
        // Only update if meaningful update occurred
        if (originalItem.height !== nextHeight) {
          const item = itemPositioner.update(index, nextHeight)
          positionCache.setPosition(index, item.top, item.height)
          forceUpdate()
        }
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [itemHeight, positionCache, itemPositioner]
    )

    // Calls the onRender callback if the rendered indices changed
    useEffect(() => {
      if (typeof onRender === 'function' && stopIndex.current !== void 0) {
        onRender(startIndex.current, stopIndex.current, items)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onRender, items, startIndex.current, stopIndex.current])

    // Updates the item positions any time a prop potentially affecting their
    // size changes
    useLayoutEffect(() => {
      didMount.current = '1'
      // None of the stuff below is relevant if the item height is fixed and unchanged
      if (prevItemHeight.current === itemHeight) return
      prevItemHeight.current = itemHeight
      const cacheSize = positionCache.size()
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemHeight, itemHeightEstimate, width])

    const setItemRef = getRefSetter(positionCache, itemPositioner)
    const itemCount = items.length
    const measuredCount = positionCache.size()
    const itemHeightOrEstimate = itemHeight || itemHeightEstimate
    const estimatedTotalHeight = positionCache.estimateTotalHeight(
      itemCount,
      itemHeightOrEstimate
    )
    const children: React.ReactElement[] = []
    const itemRole = `${role}item`
    const getItemProps = (key: any, style: React.CSSProperties) => ({
      key,
      ref: setItemRef(itemHeight || 0, index),
      role: itemRole,
      style:
        itemStyle !== void 0 ? assignUserItemStyle(style, itemStyle) : style,
    })
    overscanBy = height * overscanBy
    stopIndex.current = void 0

    // eslint-disable-next-line prefer-const
    let [index, stop] = positionCache.range(
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

      const {top, height} = itemPositioner.get(index)
      const data = items[index]
      const cachedItemStyle = getCachedItemStyle(height, top)

      children.push(
        React.createElement(
          itemAs,
          getItemProps(
            itemKey(data, index),
            itemStyle !== void 0
              ? assignUserItemStyle(cachedItemStyle, itemStyle)
              : cachedItemStyle
          ),
          React.createElement(render, {
            index,
            data,
            width,
            measure: measure(index),
          })
        )
      )
    }

    const listHeight = positionCache.listHeight()

    if (listHeight <= scrollTop + overscanBy && measuredCount < itemCount) {
      const batchSize = Math.min(
        itemCount - measuredCount,
        Math.ceil((scrollTop + overscanBy - listHeight) / itemHeightOrEstimate)
      )

      index = measuredCount

      for (; index < measuredCount + batchSize; index++) {
        const data = items[index]
        const cachedItemStyle = getCachedItemStyle(
          itemHeightOrEstimate,
          listHeight
        )

        children.push(
          React.createElement(
            itemAs,
            getItemProps(
              itemKey(data, index),
              itemHeight ? cachedItemStyle : prerenderItemStyle
            ),
            React.createElement(render, {
              index,
              data,
              width,
              measure: measure(index),
            })
          )
        )
      }
    }

    const containerStyle = getContainerStyle(isScrolling, estimatedTotalHeight)
    return React.createElement(as, {
      ref,
      id,
      key: didMount.current,
      role,
      className,
      tabIndex,
      style:
        style !== void 0
          ? assignUserStyle(containerStyle, style)
          : containerStyle,
      children,
    })
  }
)

export interface ListProps {
  readonly rowGutter?: number
  readonly width: number
  readonly height: number
  readonly scrollTop: number
  readonly isScrolling?: boolean
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
  readonly render: React.FC<{
    index: number
    data: any
    width: number
    measure: () => void
    [prop: string]: any
  }>
}

const defaultRect = {width: 0, height: 0, x: 0, y: 0}

export const useSize = <T extends HTMLElement = HTMLElement>(
  ref: React.MutableRefObject<T | null>,
  deps: any[] = []
): [number, number] => {
  const [rect, setRect] = useState<LikeDOMRect>(defaultRect)

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
  }, deps.concat(ref.current))

  return [rect.width, rect.height]
}

interface LikeDOMRect {
  readonly width: number
  readonly height: number
  readonly x: number
  readonly y: number
}

export const useScroller = <T extends HTMLElement = HTMLElement>(
  ref: React.MutableRefObject<T | null>
): [number, boolean] => {
  const [isScrolling, setIsScrolling] = useState(false)
  const [scrollTop, setScrollTop] = useState(0)

  useLayoutEffect(() => {
    const {current} = ref
    if (current) {
      const handleScroll = () => setScrollTop(current.scrollTop)
      current.addEventListener('scroll', handleScroll)
      return () => current.removeEventListener('scroll', handleScroll)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref.current])

  useLayoutEffect(() => {
    setIsScrolling(true)
    const to = window.setTimeout(() => {
      // This is here to prevent premature bail outs while maintaining high resolution
      // unsets. Without it there will always bee a lot of unnecessary DOM writes to style.
      setIsScrolling(false)
    }, 1000 / 6)
    return () => window.clearTimeout(to)
  }, [scrollTop])

  return [scrollTop, isScrolling]
}

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  List.displayName = 'List'
}
