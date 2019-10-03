# Normalize Scroll Left for Right-to-Left

This library normalizes the `Element.scrollLeft` property when direction is `rtl`.

All the hardwork are based on [this juqery plugin](https://github.com/othree/jquery.rtl-scroll-type)
and [this stackoverflow answer](https://stackoverflow.com/a/24394376).

Since `Element.scrollLeft`'s behavior with `dir="rtl"` is not defined in any spec we use
a feature detection logic to determine the behavior of the current browser.

Types of `scrollLeft` (`scrollWidth` = 100) (Copied from 
[here](https://github.com/othree/jquery.rtl-scroll-type#3-types-of-scrollleft-scrollwidth--100))

Browser        | Type          | Most Left | Most Right | Initial
-------------- | ------------- | --------- | ---------- | -------
WebKit         | default       | 0         | 100        | 100
Firefox/Opera  | negative      | -100      | 0          | 0
IE/Edge        | reverse       | 100       | 0          | 0

## Installation

You can install this package with the following command:

```sh
npm install normalize-scroll-left
```

## API

This library exposes these methods:

### `detectScrollType`

```ts
type ScrollType = 'indeterminate' | 'default' | 'negative' | 'reverse';
function detectScrollType(): ScrollType;
```

This function returns the scroll type detected, Keep in mind, this function
caches the result as it should render a dummy on the DOM (which is expensive).
Make sure the first invocation of this function happens **after** the body is loaded.

**note**: To support server-side-rendering, it will output `indeterminate` if
it detects a non-browser environment.

```javascript
import { detectScrollType } from 'normalize-scroll-left';

const type = detectScrollType();
```

The output is not based on the browser, but feature detection:

Browser        | Type
-------------- | -------------
WebKit         | `default`
Firefox/Opera  | `negative`
IE/Edge        | `reverse`
Other/Server   | `indeterminate`

### `getNormalizedScrollLeft`

```ts
function getNormalizedScrollLeft(element: HTMLElement, direction: 'rtl' | 'ltr'): number;
```

You can use this method to get the normalized `scrollLeft` property of an element.
You should explicitly pass the direction for the following reasons:

1. Querying the `getComputedStyle` is expensive and might cause a reflow.
2. The behavior shouldn't be changed when direction is `ltr`.

The output is `NaN` on the server. Otherwise, it will mimic the behavior of
`WebKit` as it's the esiest to work with.

```ts
import { getNormalizedScrollLeft } from 'normalize-scroll-left';

const element = document.getElementById('my-scrollable-container');

// element.scrollWidth = 100;

const scrollLeft = getNormalizedScrollLeft(element, 'rtl');

// scrollLeft will always be from 0 (Most Left) to 100 (Most Right).
// It will initially be 100, That means the most right.
```

### `setNormalizedScrollLeft`

```ts
function setNormalizedScrollLeft(
  element: HTMLElement,
  scrollLeft: number,
  direction: 'rtl' | 'ltr',
): void;
```

You can use this method to set the `scrollLeft` property of an element as normalized.
You should explicitly pass the direction for the same reasons as `getNormalizedScrollLeft`:

For `scrollWidth = 100` the argument `scrollLeft` must be between `0` and `100`. This
function will automatically convert it into something the current browser understands.

```ts
import { setNormalizedScrollLeft } from 'normalize-scroll-left';

const element = document.getElementById('my-scrollable-container');

// element.scrollWidth = 100, element.clientWidth = 20;

setNormalizedScrollLeft(element, 20, 'rtl');

// Will set element.scrollLeft to ...
//  20 in WebKit (chrome)
//  -60 in Firefox/Opera
//  60 in IE/Edge
// Does nothing on the server
```

## Typings

The typescript type definitions are also available and are installed via npm.

## License
This project is licensed under the
[MIT license](https://github.com/alitaheri/normalize-scroll-left/blob/master/LICENSE).