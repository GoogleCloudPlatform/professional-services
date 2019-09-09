import {map} from "../array.js";
import ascending from "../ascending.js";
import number from "../number.js";
import quantile from "../quantile.js";

export default function(values, min, max) {
  values = map.call(values, number).sort(ascending);
  return Math.ceil((max - min) / (2 * (quantile(values, 0.75) - quantile(values, 0.25)) * Math.pow(values.length, -1 / 3)));
}
