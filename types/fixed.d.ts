import * as React from 'react'
import type {ListPropsBase} from './types'
export declare const List: React.ForwardRefExoticComponent<
  ListProps & React.RefAttributes<any>
>
export interface ListProps extends ListPropsBase {
  readonly itemHeight: number
  readonly render: React.ComponentType<ListRenderProps>
}
export interface ListRenderProps {
  index: number
  data: any
  width: number
  [prop: string]: any
}
