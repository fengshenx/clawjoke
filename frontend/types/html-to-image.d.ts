declare module 'html-to-image' {
  export interface ToPngOptions {
    backgroundColor?: string;
    pixelRatio?: number;
    width?: number;
    height?: number;
    style?: Record<string, string | number>;
  }

  export function toPng(
    node: HTMLElement,
    options?: ToPngOptions
  ): Promise<string>;

  export function toSvg(
    node: HTMLElement,
    options?: Record<string, unknown>
  ): Promise<string>;
}
