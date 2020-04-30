import * as React from 'react'
import {useEffect} from 'react'
import {getContainerStyle, getCachedItemStyle, defaultGetItemKey} from './utils'
import type {ListPropsBase} from './types'

export const List = React.forwardRef<any, ListProps>(
  (
    {
      items,
      width,
      height,
      onRender,

      as: Container = 'div',
      id,
      className,
      style,
      role = 'list',
      tabIndex = 0,
      itemAs: WrapperComponent = 'div',
      itemHeight,
      itemKey = defaultGetItemKey,
      itemGap = 0,
      overscanBy = 2,

      scrollTop,
      isScrolling,

      render: RenderComponent,
    },
    containerRef
  ) => {
    const itemCount = items.length
    const totalItemHeight = itemHeight + itemGap
    const children: React.ReactElement[] = []

    overscanBy = height * overscanBy
    const startIndex = Math.floor(
      Math.max(0, scrollTop - overscanBy / 2) / totalItemHeight
    )
    const stopIndex = Math.min(
      itemCount,
      Math.ceil((scrollTop + overscanBy) / totalItemHeight)
    )

    for (let index = startIndex; index < stopIndex; index++) {
      const data = items[index]

      children.push(
        <WrapperComponent
          key={itemKey(data, index)}
          role={`${role}item`}
          style={getCachedItemStyle(
            itemHeight,
            itemGap * index + index * itemHeight
          )}
        >
          <RenderComponent index={index} data={data} width={width} />
        </WrapperComponent>
      )
    }

    // Calls the onRender callback if the rendered indices changed
    useEffect(() => {
      if (typeof onRender === 'function' && stopIndex !== void 0) {
        onRender(startIndex, stopIndex, items)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onRender, items, startIndex, stopIndex])

    const containerStyle = getContainerStyle(
      isScrolling,
      totalItemHeight * itemCount - itemGap
    )

    return (
      <Container
        ref={containerRef}
        id={id}
        role={role}
        className={className}
        tabIndex={tabIndex}
        style={
          style !== void 0
            ? Object.assign({}, containerStyle, style)
            : containerStyle
        }
        children={children}
      />
    )
  }
)

export interface ListProps extends ListPropsBase {
  readonly itemHeight: number
  readonly render: React.ComponentType<ListRenderProps>
}

export interface ListRenderProps {
  index: number
  data: any
  width: number
  [prop: string]: any
}

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
  List.displayName = 'List'
}
