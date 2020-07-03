/// <reference types="react" />
export interface ListPropsBase<Item> {
  readonly innerRef: React.Ref<any>
  readonly width: number
  readonly height: number
  readonly scrollTop: number
  readonly isScrolling?: boolean
  readonly as?: keyof JSX.IntrinsicElements | React.ComponentType<any>
  readonly id?: string
  readonly className?: string
  readonly style?: React.CSSProperties
  readonly role?: string
  readonly tabIndex?: number | string
  readonly items: Item[]
  readonly itemAs?: keyof JSX.IntrinsicElements | React.ComponentType<any>
  readonly itemGap?: number
  readonly itemKey?: (data: any, index: number) => string | number
  readonly overscanBy?: number
  readonly onRender?: (
    startIndex: number,
    stopIndex: number | undefined,
    items: Item[]
  ) => void
}
export interface ListItemProps<Item> {
  index: number
  data: Item
  width: number
  height: number
  style: React.CSSProperties
}
