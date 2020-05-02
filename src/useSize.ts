import * as React from 'react'
import {useState} from 'react'
import useLayoutEffect from '@react-hook/passive-layout-effect'

export const useSize = <T extends HTMLElement = HTMLElement>(
  ref: React.MutableRefObject<T | null>,
  deps: React.DependencyList = []
): {width: number; height: number} => {
  const getSize = () => {
    const {current} = ref
    if (current) {
      const computedStyle = getComputedStyle(current)
      const float = parseFloat
      return {
        width:
          current.clientWidth -
          float(computedStyle.paddingTop) -
          float(computedStyle.paddingBottom),
        height:
          current.clientHeight -
          float(computedStyle.paddingLeft) -
          float(computedStyle.paddingRight),
      }
    }

    return {width: 0, height: 0}
  }
  const [size, setSize] = useState<{width: number; height: number}>(getSize)

  useLayoutEffect(() => {
    const handleResize = () => setSize(getSize())
    size.width === 0 && handleResize()
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return size
}
