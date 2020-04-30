import * as React from 'react'
import {useState} from 'react'
import useLayoutEffect from '@react-hook/passive-layout-effect'
import {requestTimeout, clearRequestTimeout} from '@essentials/request-timeout'
import {useThrottle} from '@react-hook/throttle'

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

export const useScroller = <T extends HTMLElement = HTMLElement>(
  ref: React.MutableRefObject<T | null> | Window,
  offset = 0,
  fps = 12
): {scrollTop: number; isScrolling: boolean} => {
  const current = 'current' in ref ? ref.current : ref
  const getScrollPos = () =>
    !current
      ? 0
      : 'scrollTop' in current
      ? current.scrollTop
      : current.pageYOffset || current.scrollY
  const [scrollTop, setScrollTop] = useThrottle(getScrollPos, fps)
  const [isScrolling, setIsScrolling] = useState(false)

  useLayoutEffect(() => {
    if (current) {
      let to: ReturnType<typeof requestTimeout> | undefined
      const clearTo = () => to && clearRequestTimeout(to)
      const handleScroll = () => {
        setScrollTop(getScrollPos())
        setIsScrolling(true)
        clearTo()
        to = requestTimeout(() => {
          // This is here to prevent premature bail outs while maintaining high resolution
          // unsets. Without it there will always bee a lot of unnecessary DOM writes to style.
          setIsScrolling(false)
        }, 1000 / fps)
      }

      current.addEventListener('scroll', handleScroll)
      return () => {
        current.removeEventListener('scroll', handleScroll)
        clearTo()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, fps])

  return {scrollTop: Math.max(0, scrollTop - offset), isScrolling}
}
