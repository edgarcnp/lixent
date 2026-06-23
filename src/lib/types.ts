export interface LixentConfig {
  copyright: string;
  url?: string;
  email?: string;
  license: string;
  customLicense?: {
    name: string;
    text: string;
  };
  theme: string;
  themeOverrides?: Record<string, string>;
  gravatar?: boolean;
  format?: "html" | "txt" | "json";
  basePath?: string;
  urlMode?: "subpath" | "subdomain";
  year?: number;
  yearRange?: { start: number; end: number };
}
