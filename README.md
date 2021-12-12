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
- [x] **Blazing™ fast** The fixed-size hooks and components have `O(1)` search performance, while the dynamic-size hooks and
      components use binary search and have `O(log(n))` worst case performance.
- [x] **TypeScript** Woohoo! Superior autocomplete and _strict types_ mean fewer bugs in your implementation.

## Quick Start

```jsx harmony
import React, { useState, useLayoutEffect, useRef } from "react";
import randInt from "random-int";
import { List, useScroller, useSize } from "mini-virtual-list";

let items = [];
for (let i = 10000 * cur; i < cur * 10000 + 10000; i++)
  items.push({ id: i, initialHeight: randInt(40, 140) });

const ListComponent = () => {
  const ref = useRef(null);
  const scroll = useScroller(ref);
  const size = useSize(ref);

  return (
    <div
      style={{
        height: 540,
        width: 320,
        overflow: "auto",
      }}
      ref={ref}
    >
      <List
        items={items}
        itemHeight={36}
        {...size}
        {...scroll}
        render={FakeCard}
      />
    </div>
  );
};
```

## API

### Components

| Component                       | Description                                       |
| ------------------------------- | ------------------------------------------------- |
| [`<List>`](#list)               | A tiny, fast fixed-size virtual list component.   |
| [`<DynamicList>`](#dynamiclist) | A tiny, fast dynamic-size virtual list component. |

### Hooks

| Hook                                  | Description                                                                                                                                                                                                                                     |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`useList()`](#uselist)               | A fixed-size virtual list hook                                                                                                                                                                                                                  |
| [`useDynamicList()`](#usedynamiclist) | A dynamic-size virtual list hook                                                                                                                                                                                                                |
| [`usePositioner()`](#usepositioner)   | A list item positioner for `useDynamicList()`](#usedynamiclist)                                                                                                                                                                                 |
| [`useSize()`](#usesize)               | A convenient hook for providing the container size to the `<List>` component                                                                                                                                                                    |
| [`useScroller()`](#usescroller)       | A hook used for tracking a container node's scroll position. These values are used when calculating the number of rows to render and determining when we should disable pointer events on the masonry container to maximize scroll performance. |

---

### &lt;List&gt;

#### Props

| Prop | Type | Default | Required? | Description |
| ---- | ---- | ------- | --------- | ----------- |
|      |      |         |           |             |

---

### &lt;DynamicList&gt;

#### Props

| Prop | Type | Default | Required? | Description |
| ---- | ---- | ------- | --------- | ----------- |
|      |      |         |           |             |

---

### useList()

#### Arguments

| Argument | Type | Default | Required? | Description |
| -------- | ---- | ------- | --------- | ----------- |
|          |      |         |           |             |

---

### useDynamicList()

#### Arguments

| Argument | Type | Default | Required? | Description |
| -------- | ---- | ------- | --------- | ----------- |
|          |      |         |           |             |

---

### usePositioner()

#### Arguments

| Argument | Type | Default | Required? | Description |
| -------- | ---- | ------- | --------- | ----------- |
|          |      |         |           |             |

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
