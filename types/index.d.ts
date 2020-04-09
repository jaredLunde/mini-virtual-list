import React from 'react';
export declare const List: React.FC<ListProps>;
export interface ListProps {
    readonly columnWidth?: number;
    readonly rowGutter?: number;
    readonly width: number;
    readonly height: number;
    readonly scrollTop: number;
    readonly isScrolling?: boolean;
    readonly containerRef?: ((element: HTMLElement) => void) | React.MutableRefObject<HTMLElement | null>;
    readonly as?: any;
    readonly id?: string;
    readonly className?: string;
    readonly style?: React.CSSProperties;
    readonly role?: string;
    readonly tabIndex?: number | string;
    readonly items: any[];
    readonly itemAs?: any;
    readonly itemStyle?: React.CSSProperties;
    readonly itemHeight?: number;
    readonly itemHeightEstimate?: number;
    readonly itemKey?: (data: any, index: number) => string | number;
    readonly overscanBy?: number;
    readonly onRender?: (startIndex: number, stopIndex: number | undefined, items: any[]) => void;
    readonly render: React.FC<{
        [prop: string]: any;
        index: number;
        data: any;
        width: number;
    }>;
}
export declare const useRect: <T extends HTMLElement = HTMLElement>(deps?: any[]) => [LikeDOMRect, React.MutableRefObject<T | null>];
interface LikeDOMRect {
    readonly width: number;
    readonly height: number;
    readonly x: number;
    readonly y: number;
}
export declare const useScrollTop: <T extends HTMLElement = HTMLElement>() => [number, React.MutableRefObject<T | null>];
export {};
