<hr>
<div align="center">
  <h1 align="center">
    mini-virtual-list
  </h1>
</div>

<p align="center">
  <a href="https://bundlephobia.com/result?p=mini-virtual-list">
    <img alt="Bundlephobia" src="https://img.shields.io/bundlephobia/minzip/mini-virtual-list?style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="Types" href="https://www.npmjs.com/package/mini-virtual-list">
    <img alt="Types" src="https://img.shields.io/npm/types/mini-virtual-list?style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="Code coverage report" href="https://codecov.io/gh/jaredLunde/mini-virtual-list">
    <img alt="Code coverage" src="https://img.shields.io/codecov/c/gh/jaredLunde/mini-virtual-list?style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="Build status" href="https://travis-ci.com/jaredLunde/mini-virtual-list">
    <img alt="Build status" src="https://img.shields.io/travis/com/jaredLunde/mini-virtual-list?style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="NPM version" href="https://www.npmjs.com/package/mini-virtual-list">
    <img alt="NPM Version" src="https://img.shields.io/npm/v/mini-virtual-list?style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="License" href="https://jaredlunde.mit-license.org/">
    <img alt="MIT License" src="https://img.shields.io/npm/l/mini-virtual-list?style=for-the-badge&labelColor=24292e">
  </a>
</p>

<pre align="center">npm i mini-virtual-list</pre>
<hr>

A tiny, speedy list virtualization library for React

## Features

- [x] **Easy to use** This component comes with the important batteries included and an easy to understand API.
- [x] **Versatile** Supports list items with both variable and fixed heights.
  - [Variable size example on **CodeSandbox**](https://codesandbox.io/s/mini-virtual-list-example-r7fxt?file=/src/App.js)
  - [Fixed size example on **CodeSandbox**](https://codesandbox.io/s/mini-virtual-list-fixed-example-q96ty?file=/src/App.js)
- [x] **Blazing™ fast** This component can seamless render tens of thousands of items without issue because it uses binary search (`O(log n)` worst case) to determine which elements in are visible in the window at a given time.
- [x] **TypeScript** Woohoo, superior autocomplete and type safety means fewer bugs in your implementation.

## Quick Start

```jsx harmony
import React, {useState, useLayoutEffect, useRef} from 'react'
import randInt from 'random-int'
import {List, useScroller, useSize} from 'mini-virtual-list'

let items = []
for (let i = 10000 * cur; i < cur * 10000 + 10000; i++) items.push({id: i})

const ListComponent = () => {
  const ref = useRef(null)
  const scroll = useScroller(ref)
  const size = useSize(ref)

  return (
    <div
      style={{
        border: '1px solid #999',
        width: '100%',
        height: 400,
        overflow: 'auto',
      }}
      ref={ref}
    >
      <List
        items={items}
        itemHeightEstimate={162 / 2}
        {...size}
        {...scroll}
        render={Card}
      />
    </div>
  )
}

const Card = React.forwardRef(({index, measure, style, data: {id}}, ref) => {
  const [height, setHeight] = useState(getHeight(index))

  useLayoutEffect(() => {
    measure()
  }, [measure, height])

  return (
    <div
      style={{
        ...style,
        borderBottom: '1px solid #999',
        padding: '8px',
        height,
      }}
      ref={ref}
    >
      Hello {id}
      <button
        onClick={() => {
          setHeight(randInt(40, 140))
        }}
        style={{marginLeft: '0.5rem'}}
      >
        Change height
      </button>
    </div>
  )
})
```

## API

### Components

| Component         | Description                              |
| ----------------- | ---------------------------------------- |
| [`<List>`](#list) | A tiny, fast virtualized list component. |

### Hooks

| Hook                            | Description                                                                                                                                                                                                                                     |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`useSize()`](#usesize)         | A convenient hook for providing the container size to the `<List>` component                                                                                                                                                                    |
| [`useScroller()`](#usescroller) | A hook used for tracking a container node's scroll position. These values are used when calculating the number of rows to render and determining when we should disable pointer events on the masonry container to maximize scroll performance. |

---

### <List>

#### Props

| Prop | Type | Default | Required? | Description |
| ---- | ---- | ------- | --------- | ----------- |
|      |      |         |           |             |

---

### useSize()

#### Arguments

| Argument | Type | Default | Required? | Description |
| -------- | ---- | ------- | --------- | ----------- |
|          |      |         |           |             |

#### Returns

---

### useScroller()

#### Arguments

| Argument | Type | Default | Required? | Description |
| -------- | ---- | ------- | --------- | ----------- |
|          |      |         |           |             |

#### Returns

## LICENSE

MIT
