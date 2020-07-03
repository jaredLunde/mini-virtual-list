import * as React from 'react'
import type {ListPropsBase} from './types'
export declare function List<Item>({
  items,
  width,
  height,
  overscanBy,
  scrollTop,
  itemHeight,
  itemGap,
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
  innerRef,
  render: RenderComponent,
}: ListProps<Item>): JSX.Element
export interface ListProps<Item> extends ListPropsBase<Item> {
  readonly itemHeight: number
  readonly render: React.ComponentType<ListRenderProps<Item>>
}
export interface ListRenderProps<Item> {
  index: number
  data: Item
  width: number
  [prop: string]: any
}
