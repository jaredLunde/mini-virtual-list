import * as React from 'react'
import {useDynamicList, usePositioner} from './dynamic-hooks'
import {getContainerStyle, defaultGetItemKey} from './utils'
import type {ListPropsBase, ListItemProps} from './types'
import type {Positioner} from './dynamic-hooks'

export function useDynamicListItems<Item>({
  items,
  width,
  height,
  overscanBy = 2,
  scrollTop,
  itemHeightEstimate = 32,
  positioner,
  innerRef,
  as: Container = 'div',
  id,
  className,
  style,
  role = 'list',
  tabIndex,
  itemAs: WrapperComponent = 'div',
  itemKey = defaultGetItemKey,
  isScrolling,
  onRender,
  render: RenderComponent,
}: UseDynamicListItemsOptions<Item>) {
  const children: (
    | ListItemProps<Item>
    | React.ReactElement<ListItemProps<Item>>
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
  const updating = React.useRef(false)
  // batches calls to force update
  updating.current = false
  const forceUpdate = () => {
    if (!updating.current) {
      updating.current = true
      forceUpdate_()
    }
  }
  const itemRole = role && role + 'item'
  let needsFreshBatch = false
  let startIndex = 0
  let stopIndex: number | undefined
  let i = 0

  for (; i < children.length; i++) {
    const child = children[i] as ListItemProps<Item>
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
    ) as React.ReactElement<ListItemProps<Item>>
  }

  // If we needed a fresh batch we should reload our components with the measured
  // sizes
  React.useEffect(() => {
    if (needsFreshBatch) forceUpdate()
    // eslint-disable-next-line
  }, [needsFreshBatch])
  // Calls the onRender callback if the rendered indices changed
  React.useEffect(() => {
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
      ref={innerRef}
      children={children}
      key={didEverMount}
    />
  )
}

export interface UseDynamicListItemsOptions<Item>
  extends Omit<ListPropsBase<Item>, 'itemGap'> {
  readonly positioner: Positioner
  readonly itemHeightEstimate?: number
  readonly render: React.ComponentType<DynamicListRenderProps<Item>>
}

export function DynamicList<Item>(props: DynamicListProps<Item>) {
  const positioner = usePositioner(props.itemGap)
  return useDynamicListItems(Object.assign({positioner}, props))
}

let didEverMount = '0'

export interface DynamicListProps<Item> extends ListPropsBase<Item> {
  readonly itemHeightEstimate?: number
  readonly render: React.ComponentType<DynamicListRenderProps<Item>>
}

function DynamicListItem<Item>({
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
}: DynamicListItemProps<Item> & {
  as: keyof JSX.IntrinsicElements | React.ComponentType<any>
}) {
  const ref = React.useRef<HTMLElement | null>(null)
  const measure = React.useCallback(() => {
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

interface DynamicListItemProps<Item> {
  as: DynamicListProps<Item>['itemAs']
  role: string
  style: React.CSSProperties
  index: number
  data: Item
  width: number
  height: number | undefined
  render: React.ComponentType<DynamicListRenderProps<Item>>
  pos: Positioner
  meas: () => void
}

export interface DynamicListRenderProps<Item> {
  index: number
  data: Item
  width: number
  height: number | undefined
  measure: () => void
  [prop: string]: any
}

const useForceUpdate = (): (() => void) => {
  const setState = React.useState(emptyObj)[1]
  return React.useRef(() => setState({})).current
}

const emptyObj = {}
