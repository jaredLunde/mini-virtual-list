import * as React from 'react'
import type {ListPropsBase} from './types'
import type {Positioner} from './dynamic-hooks'
export declare const useDynamicListElements: ({
  items,
  width,
  height,
  overscanBy,
  scrollTop,
  itemHeightEstimate,
  positioner,
  containerRef,
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
}: UseDynamicListElementsOptions) => JSX.Element
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
export declare const DynamicList: React.ForwardRefExoticComponent<
  DynamicListProps & React.RefAttributes<any>
>
export interface DynamicListProps extends ListPropsBase {
  readonly itemHeightEstimate?: number
  readonly render: React.ComponentType<DynamicListRenderProps>
}
export interface DynamicListRenderProps {
  index: number
  data: any
  width: number
  height: number | undefined
  measure: () => void
  [prop: string]: any
}
