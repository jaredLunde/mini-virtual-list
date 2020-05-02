export declare const getContainerStyle: (
  isScrolling: boolean | undefined,
  estimatedHeight: number
) => {
  position: string
  width: string
  maxWidth: string
  height: number
  maxHeight: number
  willChange: string | undefined
  pointerEvents: string | undefined
}
export declare const defaultGetItemKey: (_: any[], i: number) => number
