/** Interface representing returned object from Python toxicity result. */
export interface ToxicityTextSection {
  toxicity: number;
  start_time: number;
  text: string;
  [key: string]: number | string;
}
