import * as React from "react";
export declare function useSize<T extends HTMLElement>(
  ref: React.MutableRefObject<T | null>
): {
  width: number;
  height: number;
};
