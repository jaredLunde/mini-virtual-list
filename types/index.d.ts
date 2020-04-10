import React from 'react'
export declare const List: React.ForwardRefExoticComponent<
  ListProps<any> & React.RefAttributes<HTMLElement>
>
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
export declare const useSize: <T extends HTMLElement = HTMLElement>(
  ref: React.MutableRefObject<T | null>,
  deps?: any[]
) => {
  width: number
  height: number
}
export declare const useScroller: <T extends HTMLElement = HTMLElement>(
  ref: React.MutableRefObject<T | null>
) => {
  scrollTop: number
  isScrolling: boolean
}
