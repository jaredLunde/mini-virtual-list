import React, {useCallback, useEffect, useState, useRef} from 'react'
import memoize from 'trie-memoize'
import OneKeyMap from '@essentials/one-key-map'
import useLayoutEffect from '@react-hook/passive-layout-effect'

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
    }
  }

  return index
}

const createItemPositioner = (rowGutter = 0): ItemPositioner => {
  let listHeight = 0
  const items: {top: number; height: number}[] = []

  return {
    set: (index, height = 0) => {
      const top = listHeight
      listHeight += height + rowGutter
      items[index] = {top, height}
    },
    get: (index: number | undefined): any =>
      index === void 0 ? index : items[index],
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
    estimateTotalHeight: (itemCount, defaultItemHeight) =>
      listHeight + (itemCount - items.length) * defaultItemHeight,
    range: (lo, hi) => {
      const startIndex = binarySearchGE(items, lo)
      return [startIndex, binarySearchGE(items, hi, startIndex + 1)]
    },
    listHeight: () => listHeight,
    size: () => items.length,
  }
}

interface ItemPositioner {
  set: (index: number, height: number) => void
  get: (index: number | undefined) => ItemPositionerItem
  update: (index: number, height: number) => void
  estimateTotalHeight: (itemCount: number, defaultItemHeight: number) => number
  range: (lo: number, hi: number) => [number, number]
  listHeight: () => number
  size: () => number
}

interface ItemPositionerItem {
  top: number
  height: number
}

const getContainerStyle = memoize(
  [OneKeyMap, OneKeyMap, OneKeyMap],
  (
    itemHeight: number | undefined,
    estimatedTotalHeight: number,
    isScrolling: boolean | undefined
  ) => ({
    position: 'relative',
    width: '100%',
    height: Math.ceil(estimatedTotalHeight),
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
  zIndex: -1000,
  visibility: 'hidden',
  position: 'absolute',
  writingMode: 'horizontal-tb',
}

const useForceUpdate = (): (() => void) => {
  const setState = useState<number>(0)[1]
  return () => setState((current) => ++current)
}

const ListItem: React.FC<ListItemProps> = (props) => {
  const ref = useRef<HTMLElement | null>(null)
  const deps = [props.index, props.itemPositioner, props.itemHeight]

  useLayoutEffect(() => {
    if (ref.current) {
      if (props.itemPositioner.get(props.index) === void 0) {
        props.itemPositioner.set(
          props.index,
          props.itemHeight || ref.current.offsetHeight
        )
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const measure = useCallback(() => {
    if (ref.current && !props.itemHeight) {
      props.itemPositioner.update(props.index, ref.current.offsetHeight)
      props.measured()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return React.createElement(props.render, {
    ref,
    index: props.index,
    data: props.data,
    width: props.width,
    style: props.style,
    measure,
  })
}

interface ListItemProps<Data = any> {
  readonly index: number
  readonly data: Data
  readonly width: number
  readonly style: React.CSSProperties
  readonly itemHeight?: number
  readonly itemPositioner: ItemPositioner
  readonly measured: () => void
  readonly render: React.FC<ItemProps<Data>>
}

export const List = React.forwardRef<HTMLElement, ListProps>(
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
    const [itemPositioner, setItemPositioner] = useState<ItemPositioner>(
      (): ItemPositioner => createItemPositioner(rowGutter)
    )
    // Creates a new item positioner if the row gutter changes
    useEffect(() => {
      const nextPostitioner = createItemPositioner(rowGutter)
      setItemPositioner(nextPostitioner)
      const cacheSize = itemPositioner.size()

      for (let index = 0; index < cacheSize; index++) {
        const pos = itemPositioner.get(index)
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
    }, [onRender, items, startIndex.current, stopIndex.current])

    // Invalidates the container key if coming for SSR
    useEffect(() => {
      didMount.current = '1'
    }, [])

    const itemCount = items.length
    const measuredCount = itemPositioner.size()
    const itemHeightOrEstimate = itemHeight || itemHeightEstimate
    const estimatedTotalHeight = itemPositioner.estimateTotalHeight(
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
      itemPositioner,
      style,
      render,
    })
    overscanBy = height * overscanBy
    stopIndex.current = void 0

    // eslint-disable-next-line prefer-const
    let [index, stop] = itemPositioner.range(
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

      const {top} = itemPositioner.get(index)
      const data = items[index]
      const cachedItemStyle = getCachedItemStyle(itemHeight, top)

      children.push(
        React.createElement(
          ListItem,
          getItemProps(index, data, cachedItemStyle)
        )
      )
    }

    let listHeight = itemPositioner.listHeight()

    if (listHeight <= scrollTop + overscanBy && measuredCount < itemCount) {
      const batchSize = Math.min(
        itemCount - measuredCount,
        Math.ceil((scrollTop + overscanBy - listHeight) / itemHeightOrEstimate)
      )

      index = measuredCount

      for (; index < measuredCount + batchSize; index++) {
        const data = items[index]
        if (itemHeight) listHeight += itemHeight
        const cachedItemStyle = getCachedItemStyle(itemHeight, listHeight)

        children.push(
          React.createElement<ListItemProps<ListProps['items']>>(
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
      estimatedTotalHeight,
      isScrolling
    )

    return React.createElement(as, {
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

export const useSize = <T extends HTMLElement = HTMLElement>(
  ref: React.MutableRefObject<T | null>,
  deps: any[] = []
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

  return size
}

export const useScroller = <T extends HTMLElement = HTMLElement>(
  ref: React.MutableRefObject<T | null>
): {scrollTop: number; isScrolling: boolean} => {
  const [isScrolling, setIsScrolling] = useState(false)
  const [scrollTop, setScrollTop] = useState(0)

  useLayoutEffect(() => {
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

      current.addEventListener('scroll', handleScroll)
      return () => {
        current.removeEventListener('scroll', handleScroll)
        if (tick) window.cancelAnimationFrame(tick)
      }
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

  return {scrollTop, isScrolling}
}

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  List.displayName = 'List'
}
