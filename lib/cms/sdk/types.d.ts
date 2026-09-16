import React from "react";

export type CMSFieldType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "richtext"
  | "media"
  | "image"
  | "video"
  | "object"
  | "array"
  | "reference";

export interface CMSBinding<T = any> {
  type: "binding";
  scope?: "page" | "loop" | "global";
  source?: string;
  alias?: string;
  path: string | string[];
  fallback?: T;
}

export interface CMSPropertyDefinition {
  type: string;
  label?: string;
  default?: any;
  dynamic?: boolean;
  model?: string;
  options?: string[] | { label: string; value: any }[];
  description?: string;
}

export interface CMSDataRequirement {
  type: "array" | "object" | "single";
  model: string;
  fields?: string[];
  description?: string;
}

export interface CMSSectionDefinition<TProps = any> {
  id: string;
  name: string;
  category?: string;
  description?: string;
  version?: string;
  sdkVersion?: string;
  thumbnail?: string;
  props?: Record<keyof TProps, CMSPropertyDefinition>;
  dataRequirements?: Record<string, CMSDataRequirement>;
  slots?: string[];
  component: React.ComponentType<TProps>;
}

export interface CMSTemplateDefinition<TProps = any> {
  id: string;
  name: string;
  category?: string;
  description?: string;
  version: string;
  sdkVersion: string;
  thumbnail?: string;
  sections?: CMSSectionDefinition[];
  component?: React.ComponentType<TProps>;
}

export interface CMSLoopMeta {
  index: number;
  number: number;
  first: boolean;
  last: boolean;
  odd: boolean;
  even: boolean;
  count: number;
}

export interface CMSContextValue {
  data: Record<string, any>;
  route: { params: Record<string, string>; query: Record<string, string> };
  site: Record<string, any>;
  user: any;
  theme: any;
}

export declare function defineSection<TProps = any>(
  config: CMSSectionDefinition<TProps>
): CMSSectionDefinition<TProps>;

export declare function defineTemplate<TProps = any>(
  config: CMSTemplateDefinition<TProps>
): CMSTemplateDefinition<TProps>;

export declare function useCMSContext(): CMSContextValue;

export declare function useCMSData<T = any>(path: string, fallback?: T): T;

export declare function useCMSLoopItem<T = any>(): T;

export interface CMSFieldProps extends React.HTMLAttributes<HTMLElement> {
  value: any;
  format?: string;
  fallback?: string;
  as?: React.ElementType;
}

export declare const CMSField: React.FC<CMSFieldProps>;
export declare const CMSText: React.FC<CMSFieldProps>;

export interface CMSRichTextProps extends React.HTMLAttributes<HTMLDivElement> {
  value: any;
  fallback?: string;
}

export declare const CMSRichText: React.FC<CMSRichTextProps>;

export interface CMSImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  source?: any;
  src?: string;
  alt?: string;
  fallback?: string;
}

export declare const CMSImage: React.FC<CMSImageProps>;

export interface CMSLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: any;
  to?: string;
  fallback?: string;
}

export declare const CMSLink: React.FC<CMSLinkProps>;

export interface CMSLoopProps<T = any> {
  source: T[] | { items: T[] } | string | CMSBinding<T[]>;
  as?: string;
  children: (item: T, loop: CMSLoopMeta) => React.ReactNode;
  empty?: React.ReactNode | (() => React.ReactNode);
  limit?: number | string;
  offset?: number | string;
}

export declare function CMSLoop<T = any>(props: CMSLoopProps<T>): React.ReactElement | null;
export declare const CMSRepeater: typeof CMSLoop;

export interface CMSIfProps {
  condition: any;
  children: React.ReactNode | (() => React.ReactNode);
  fallback?: React.ReactNode | (() => React.ReactNode);
}

export declare const CMSIf: React.FC<CMSIfProps>;
export declare const CMSCondition: React.FC<CMSIfProps>;

export declare const cms: {
  version: string;
  theme: {
    colors: Record<string, string>;
    spacing: Record<string, string>;
    radius: Record<string, string>;
    typography: Record<string, string>;
  };
  sanitizeUrl: (url: string) => string;
  responsive: <T>(map: { desktop: T; tablet?: T; mobile?: T }) => any;
};
