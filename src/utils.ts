import memoizeOne from '@essentials/memoize-one'

export const getContainerStyle = memoizeOne(
  (isScrolling: boolean | undefined, estimatedHeight: number) => ({
    position: 'relative',
    width: '100%',
    maxWidth: '100%',
    height: Math.ceil(estimatedHeight),
    maxHeight: Math.ceil(estimatedHeight),
    willChange: isScrolling ? 'contents,height' : void 0,
    pointerEvents: isScrolling ? 'none' : void 0,
  })
)
export const defaultGetItemKey = (_: any[], i: number): number => i
