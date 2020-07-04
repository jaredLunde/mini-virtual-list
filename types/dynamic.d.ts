import * as React from 'react'
import type {ListPropsBase} from './types'
import type {Positioner} from './dynamic-hooks'
export declare function useDynamicListItems<Item>({
  items,
  width,
  height,
  overscanBy,
  scrollTop,
  itemHeightEstimate,
  positioner,
  innerRef,
  as: Container,
  id,
  className,
  style,
  role,
  tabIndex,
  itemAs: WrapperComponent,
  itemKey,
  isScrolling,
  onRender,
  render: RenderComponent,
}: UseDynamicListItemsOptions<Item>): JSX.Element
export interface UseDynamicListItemsOptions<Item>
  extends Omit<ListPropsBase<Item>, 'itemGap'> {
  readonly positioner: Positioner
  readonly itemHeightEstimate?: number
  readonly render: React.ComponentType<DynamicListRenderProps<Item>>
}
export declare function DynamicList<Item>(
  props: DynamicListProps<Item>
): JSX.Element
export interface DynamicListProps<Item> extends ListPropsBase<Item> {
  readonly itemHeightEstimate?: number
  readonly render: React.ComponentType<DynamicListRenderProps<Item>>
}
export interface DynamicListRenderProps<Item> {
  index: number
  data: Item
  width: number
  height: number | undefined
  measure: () => void
  [prop: string]: any
}
