import memoizeOne from '@essentials/memoize-one'

const cmp2 = (a, b) => a[0] === b[0] && a[1] === b[1]

export const getContainerStyle = memoizeOne(
  (isScrolling: boolean | undefined, estimatedHeight: number) => ({
    position: 'relative',
    width: '100%',
    maxWidth: '100%',
    height: Math.ceil(estimatedHeight),
    maxHeight: Math.ceil(estimatedHeight),
    willChange: isScrolling ? 'contents, height' : void 0,
    pointerEvents: isScrolling ? 'none' : void 0,
  }),
  cmp2
)

export const getCachedItemStyle = memoizeOne(
  (height: number | undefined, top: number): React.CSSProperties => ({
    top,
    height,
    left: 0,
    width: '100%',
    writingMode: 'horizontal-tb',
    position: 'absolute',
  }),
  cmp2
)

export const defaultGetItemKey = (_: any[], i: number): number => i
