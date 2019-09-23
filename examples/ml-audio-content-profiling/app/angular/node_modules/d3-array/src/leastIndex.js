import ascending from "./ascending.js";

export default function leastIndex(values, compare = ascending) {
  let min;
  let minIndex = -1;
  let index = -1;
  if (compare.length === 1) {
    for (const element of values) {
      ++index;
      const value = compare(element);
      if (minIndex < 0
          ? ascending(value, value) === 0
          : ascending(value, min) < 0) {
        min = value;
        minIndex = index;
      }
    }
  } else {
    for (const value of values) {
      ++index;
      if (minIndex < 0
          ? compare(value, value) === 0
          : compare(value, min) < 0) {
        min = value;
        minIndex = index;
      }
    }
  }
  return minIndex;
}
