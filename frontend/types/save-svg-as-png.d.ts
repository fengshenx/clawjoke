declare module 'save-svg-as-png' {
  export interface PngOptions {
    scale?: number;
    encoderOptions?: number;
    backgroundColor?: string;
    width?: number;
    height?: number;
    preserveAspectRatio?: string;
  }

  export function saveSvgAsPng(
    svgElement: SVGElement | HTMLElement,
    filename: string,
    options?: PngOptions
  ): void;
}
