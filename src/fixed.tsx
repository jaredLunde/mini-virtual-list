import * as React from "react";
import { useList } from "./fixed-hooks";
import { getContainerStyle, defaultGetItemKey } from "./utils";
import type { ListPropsBase, ListItemProps } from "./types";

export function List<Item>({
  items,
  width,
  height,
  overscanBy = 2,
  scrollTop,
  itemHeight,
  itemGap = 0,
  as: Container = "div",
  id,
  className,
  style,
  role = "list",
  tabIndex,
  itemAs: WrapperComponent = "div",
  itemKey = defaultGetItemKey,
  isScrolling,
  onRender,
  innerRef,
  render: RenderComponent,
}: ListProps<Item>) {
  const children: (
    | ListItemProps<Item>
    | React.ReactElement<ListItemProps<Item>>
  )[] = useList({
    items,
    width,
    height,
    overscanBy,
    scrollTop,
    itemHeight,
    itemGap,
  });
  const itemRole = role && role + "item";
  const startIndex = children[0]
    ? (children[0] as ListItemProps<Item>).index
    : 0;
  let stopIndex: number | undefined;
  let i = 0;

  for (; i < children.length; i++) {
    const child = children[i] as ListItemProps<Item>;
    stopIndex = child.index;
    children[i] = (
      <WrapperComponent
        key={itemKey(child.data, child.index)}
        role={itemRole}
        style={child.style}
      >
        <RenderComponent
          index={child.index}
          data={child.data}
          width={child.width}
          height={child.height}
        />
      </WrapperComponent>
    );
  }

  // Calls the onRender callback if the rendered indices changed
  React.useEffect(() => {
    if (typeof onRender === "function" && stopIndex !== void 0)
      onRender(startIndex, stopIndex, items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRender, items, startIndex, stopIndex]);

  const containerStyle = getContainerStyle(
    isScrolling,
    (itemHeight + itemGap) * items.length - itemGap
  );

  return (
    <Container
      id={id}
      className={className}
      style={
        style !== void 0
          ? Object.assign({}, containerStyle, style)
          : containerStyle
      }
      role={role}
      tabIndex={tabIndex}
      ref={innerRef}
      children={children}
    />
  );
}

export interface ListProps<Item> extends ListPropsBase<Item> {
  readonly itemHeight: number;
  readonly render: React.ComponentType<ListRenderProps<Item>>;
}

export interface ListRenderProps<Item> {
  index: number;
  data: Item;
  width: number;
  [prop: string]: any;
}
