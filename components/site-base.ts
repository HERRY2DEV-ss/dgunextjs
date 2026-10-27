const developmentBasePath = '';

export const SITE_BASE = process.env.NODE_ENV === 'development' ? developmentBasePath : '';

export function sitePath(value: string): string {
  return value.replace(/\/nextjs\/homev1(?=\/|$)/g, SITE_BASE);
}
