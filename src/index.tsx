import React, {useCallback, useEffect, useState, useRef} from 'react'
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
  const tops: number[] = []
  const items: Record<number, {top: number; height: number}> = {}

  return {
    set: (index, height = 0) => {
      const top = listHeight
      listHeight += height + rowGutter
      items[index] = {top, height}
      tops[index] = top
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

      for (; index < tops.length; index++) {
        const item = items[index]
        item.top = item.top + difference
        tops[index] = item.top
      }
    },
    estimateTotalHeight: (itemCount, defaultItemHeight) =>
      itemCount === tops.length
        ? listHeight
        : listHeight + Math.ceil(itemCount - tops.length) * defaultItemHeight,
    range: (lo, hi) => {
      const startIndex = binarySearchGE(tops, lo)
      return [startIndex, binarySearchGE(tops, hi, startIndex + 1)]
    },
    listHeight: () => listHeight,
    size: () => tops.length,
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

const defaultGetItemKey = (_: any[], i: number): number => i

const getCachedItemStyle = trieMemoize(
  [OneKeyMap, {}],
  (height: number | undefined, top: number): React.CSSProperties => ({
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

const ListItem: React.FC<ListItemProps> = (props) => {
  const ref = useRef<HTMLElement | null>(null)
  const [tally, setTally] = useState(0)
  const deps = [props.index, props.itemPositioner, tally]

  useLayoutEffect(() => {
    if (ref.current) {
      if (props.itemPositioner.get(props.index) === void 0) {
        props.itemPositioner.set(props.index, ref.current.offsetHeight)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useLayoutEffect(() => {
    if (ref.current && tally > 0) {
      props.itemPositioner.update(props.index, ref.current.offsetHeight)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps.concat(tally))

  useEffect(() => {
    if (tally > 0) props.measured()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tally])

  return React.createElement(
    props.as,
    {role: props.role, style: props.style, ref},
    React.createElement(props.render, {
      index: props.childProps.index,
      data: props.childProps.data,
      width: props.childProps.width,
      measure: useCallback(() => {
        setTally((curr) => curr + 1)
      }, []),
    })
  )
}

interface ListItemProps {
  as: ListProps['itemAs']
  role: string
  style: React.CSSProperties
  index: number
  itemPositioner: ItemPositioner
  measured: () => void
  render: RenderComponent
  childProps: ListItemChildProps
}

interface ListItemChildProps {
  index: number
  data: any
  width: number
}

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
    const stopIndex = useRef<number | undefined>()
    const startIndex = useRef<number>(0)
    const [itemPositioner, setItemPositioner] = useState<ItemPositioner>(
      (): ItemPositioner => createItemPositioner(rowGutter || 0)
    )
    // Sets a new item positioner if the row gutter changes
    useEffect(() => {
      setItemPositioner(createItemPositioner(rowGutter || 0))
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
    // const setItemRef = getRefSetter(elementsCache, itemPositioner)
    const itemCount = items.length
    const measuredCount = itemPositioner.size()
    const itemHeightOrEstimate = itemHeight || itemHeightEstimate
    const estimatedTotalHeight = itemPositioner.estimateTotalHeight(
      itemCount,
      itemHeightOrEstimate
    )
    const children: React.ReactElement[] = []
    const itemRole = `${role}item`
    const getItemProps = (
      index: number,
      data: any,
      style: React.CSSProperties,
      childProps: ListItemChildProps
    ) => ({
      as: itemAs,
      key: itemKey(data, index),
      role: itemRole,
      index,
      measured: forceUpdate,
      itemPositioner,
      style: itemStyle !== void 0 ? Object.assign({}, style, itemStyle) : style,
      render,
      childProps,
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
          getItemProps(
            index,
            data,
            itemStyle !== void 0
              ? Object.assign({}, cachedItemStyle, itemStyle)
              : cachedItemStyle,
            {
              index,
              data,
              width,
            }
          )
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
          React.createElement(
            ListItem,
            getItemProps(
              index,
              data,
              itemHeight ? cachedItemStyle : prerenderItemStyle,
              {
                index,
                data,
                width,
              }
            )
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
  readonly render: RenderComponent
}

export type RenderComponent = React.FC<
  ListItemChildProps & {
    measure: () => void
    [prop: string]: any
  }
>

const defaultRect = {width: 0, height: 0, x: 0, y: 0}

export const useSize = <T extends HTMLElement = HTMLElement>(
  ref: React.MutableRefObject<T | null>,
  deps: any[] = []
): {width: number; height: number} => {
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

  return {width: rect.width, height: rect.height}
}

interface LikeDOMRect {
  readonly width: number
  readonly height: number
  readonly x: number
  readonly y: number
}

export const useScroller = <T extends HTMLElement = HTMLElement>(
  ref: React.MutableRefObject<T | null>
): {scrollTop: number; isScrolling: boolean} => {
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

  return {scrollTop, isScrolling}
}

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  List.displayName = 'List'
}
