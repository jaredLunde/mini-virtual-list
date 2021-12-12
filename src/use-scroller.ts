import * as React from "react";
import useLayoutEffect from "@react-hook/passive-layout-effect";
import {
  requestTimeout,
  clearRequestTimeout,
} from "@essentials/request-timeout";
import { useThrottle } from "@react-hook/throttle";

export function useScroller<T extends HTMLElement>(
  ref: Window | React.MutableRefObject<T | null> | T | null,
  options: UseScrollerOptions = {}
): { scrollTop: number; isScrolling: boolean } {
  const { offset = 0, fps = 12 } = options;
  const current = ref && "current" in ref ? ref.current : ref;
  const getScrollPos = () =>
    !current
      ? 0
      : "scrollTop" in current
      ? current.scrollTop
      : current.pageYOffset || current.scrollY;
  const [scrollTop, setScrollTop] = useThrottle(getScrollPos, fps);
  const [isScrolling, setIsScrolling] = React.useState(false);

  useLayoutEffect(() => {
    if (current) {
      let didUnmount = false;
      let to: ReturnType<typeof requestTimeout> | undefined;
      const clearTo = () => to && clearRequestTimeout(to);
      const handleScroll = () => {
        if (didUnmount) return;
        setScrollTop(getScrollPos());
        setIsScrolling(true);
        clearTo();
        to = requestTimeout(() => {
          // This is here to prevent premature bail outs while maintaining high resolution
          // unsets. Without it there will always bee a lot of unnecessary DOM writes to style.
          setIsScrolling(false);
        }, 1000 / fps);
      };

      current.addEventListener("scroll", handleScroll);
      return () => {
        current.removeEventListener("scroll", handleScroll);
        clearTo();
        didUnmount = true;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, fps]);

  return { scrollTop: Math.max(0, scrollTop - offset), isScrolling };
}

export interface UseScrollerOptions {
  offset?: number;
  fps?: number;
}
