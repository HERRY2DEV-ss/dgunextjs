import type { NextConfig } from 'next';
import { liveDguApiUrl } from './components/dgu-api-transport';
const isDevelopment = process.env.NODE_ENV === 'development';
const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
  ...(!isDevelopment ? { output: 'export' as const } : {}),
  images: { unoptimized: true },
  basePath: '/nextjs/homev1',
  trailingSlash: true,
  ...(isDevelopment ? {
    async rewrites() {
      return [
        { source: '/news/:articleSlug([a-zA-Z0-9_-]+)/', destination: '/news/' },
        { source: '/programs/:programSlug/:recordId([1-9][0-9]*)/', destination: '/program-detail/' },
        { source: '/api/dgu-menus/', destination: liveDguApiUrl('menus', process.env.NEXT_PUBLIC_DGU_MENU_API_URL) },
        { source: '/api/dgu-news/', destination: liveDguApiUrl('news') },
        { source: '/api/dgu-footer/', destination: liveDguApiUrl('footer') },
        { source: '/api/dgu-programs/', destination: liveDguApiUrl('programs') },
        { source: '/api/dgu-program-info/', destination: liveDguApiUrl('program-info', process.env.NEXT_PUBLIC_DGU_PROGRAM_INFO_API_URL) },
        { source: '/api/dgu-faculty/', destination: liveDguApiUrl('faculty') },
        { source: '/api/dgu-reviews/', destination: liveDguApiUrl('reviews', process.env.NEXT_PUBLIC_DGU_REVIEWS_API_URL) },
        { source: '/api/dgu-school-info/', destination: liveDguApiUrl('school-info') },
        { source: '/api/dgu-admissions/', destination: liveDguApiUrl('admissions', process.env.NEXT_PUBLIC_DGU_ADMISSIONS_API_URL) },
        { source: '/api/dgu-hostel-life/', destination: liveDguApiUrl('hostel-life', process.env.NEXT_PUBLIC_DGU_HOSTEL_API_URL) },
        { source: '/api/dgu-international/', destination: liveDguApiUrl('international', process.env.NEXT_PUBLIC_DGU_INTERNATIONAL_API_URL) },
        { source: '/api/dgu-glance/', destination: liveDguApiUrl('glance', process.env.NEXT_PUBLIC_DGU_GLANCE_API_URL) },
        { source: '/api/dgu-differentiators/', destination: liveDguApiUrl('differentiators', process.env.NEXT_PUBLIC_DGU_DIFFERENTIATORS_API_URL) },
        { source: '/api/dgu-homepage/', destination: liveDguApiUrl('homepage', process.env.NEXT_PUBLIC_HOMEPAGE_DATA_API) },
        { source: '/api/dgu-club/', destination: liveDguApiUrl('club', process.env.NEXT_PUBLIC_DGU_CLUB_API_URL) },
        { source: '/api/dgu-recruiters/', destination: liveDguApiUrl('recruiters', process.env.NEXT_PUBLIC_DGU_RECRUITERS_API_URL) },
        { source: '/api/dgu-placements/', destination: liveDguApiUrl('placements', process.env.NEXT_PUBLIC_DGU_PLACEMENTS_API_URL) },
      ];
    },
  } : {}),
};
export default nextConfig;
