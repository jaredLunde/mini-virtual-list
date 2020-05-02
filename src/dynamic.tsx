import * as React from 'react'
import {useCallback, useState, useRef, useEffect} from 'react'
import {useDynamicList, usePositioner} from './dynamic-hooks'
import {getContainerStyle, defaultGetItemKey} from './utils'
import type {ListPropsBase, ListItemProps} from './types'
import type {Positioner} from './dynamic-hooks'

export const useDynamicListElements = ({
  items,
  width,
  height,
  overscanBy = 2,
  scrollTop,
  itemHeightEstimate = 32,
  positioner,
  containerRef,
  as: Container = 'div',
  id,
  className,
  style,
  role = 'list',
  tabIndex = 0,
  itemAs: WrapperComponent = 'div',
  itemKey = defaultGetItemKey,
  isScrolling,
  onRender,
  render: RenderComponent,
}: UseDynamicListElementsOptions) => {
  const children: (
    | ListItemProps
    | React.ReactElement<ListItemProps>
  )[] = useDynamicList({
    items,
    width,
    height,
    overscanBy,
    scrollTop,
    itemHeightEstimate,
    positioner,
  })
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
  const itemRole = role + 'item'
  let needsFreshBatch = false
  let startIndex = 0
  let stopIndex: number | undefined
  let i = 0

  for (; i < children.length; i++) {
    const child = children[i] as ListItemProps
    needsFreshBatch = needsFreshBatch || child.height === -1

    if (child.height !== -1) {
      startIndex = stopIndex === void 0 ? child.index : startIndex
      stopIndex = child.index
    }

    children[i] = (
      <DynamicListItem
        key={itemKey(child.data, child.index)}
        role={itemRole}
        style={child.style}
        index={child.index}
        data={child.data}
        width={child.width}
        height={child.height === -1 ? child.height : void 0}
        as={WrapperComponent}
        meas={forceUpdate}
        pos={positioner}
        render={RenderComponent}
      />
    ) as React.ReactElement<ListItemProps>
  }

  // If we needed a fresh batch we should reload our components with the measured
  // sizes
  useEffect(() => {
    if (needsFreshBatch) forceUpdate()
    // eslint-disable-next-line
  }, [needsFreshBatch])
  // Calls the onRender callback if the rendered indices changed
  useEffect(() => {
    if (typeof onRender === 'function' && stopIndex !== void 0)
      onRender(startIndex, stopIndex, items)
    // Resets the container key for SSR hydration
    didEverMount = '1'
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRender, items, startIndex, stopIndex])

  const containerStyle = getContainerStyle(
    isScrolling,
    positioner.est(items.length, itemHeightEstimate)
  )

  return (
    <Container
      id={id}
      className={className}
      style={
        style !== void 0
          ? Object.assign({}, containerStyle, style)
          : containerStyle
      }
      role={role}
      tabIndex={tabIndex}
      ref={containerRef}
      children={children}
      key={didEverMount}
    />
  )
}

export interface UseDynamicListElementsOptions
  extends Omit<ListPropsBase, 'itemGap'> {
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
    return useDynamicListElements(
      Object.assign({positioner, containerRef}, props)
    )
  }
)

let didEverMount = '0'

export interface DynamicListProps extends ListPropsBase {
  readonly itemHeightEstimate?: number
  readonly render: React.ComponentType<DynamicListRenderProps>
}

const DynamicListItem: React.FC<
  DynamicListItemProps & {
    as: keyof JSX.IntrinsicElements | React.ComponentType<any>
  }
> = ({
  role,
  style,
  index,
  data,
  width,
  height,
  as: WrapperComponent,
  meas,
  pos,
  render: RenderComponent,
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
        height={height}
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
  height: number | undefined
  render: React.ComponentType<DynamicListRenderProps>
  pos: Positioner
  meas: () => void
}

export interface DynamicListRenderProps {
  index: number
  data: any
  width: number
  height: number | undefined
  measure: () => void
  [prop: string]: any
}

const useForceUpdate = (): (() => void) => {
  const setState = useState(emptyObj)[1]
  return useRef(() => setState({})).current
}

const emptyObj = {}

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
  DynamicList.displayName = 'DynamicList'
}
