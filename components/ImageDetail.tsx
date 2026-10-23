'use client';
import { useEffect, useState } from 'react';
import LocalGallery from './LocalGallery';
import InternalPageHero from './InternalPageHero';
export default function ImageDetail() {
  const [image, setImage] = useState<{ src: string; title: string } | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    try {
      const url = new URL(params.get('src') || '', 'https://dgu.ac.in/');
      if (['https:', 'http:'].includes(url.protocol) && ['dgu.ac.in', 'www.dgu.ac.in', 'images.unsplash.com'].includes(url.hostname) && (/\.(jpg|jpeg|png|webp|gif)$/i.test(url.pathname) || url.hostname === 'images.unsplash.com')) setImage({ src: url.href, title: params.get('title')?.trim() || 'University image' });
    } catch { /* Invalid image selections display a local error state. */ }
    setLoaded(true);
  }, []);
  return <main className="local-page-main" id="local-content"><InternalPageHero title={image?.title || 'Image viewer'} eyebrow="University gallery" /><div className="internal-body">{image ? <LocalGallery title={image.title} photos={[{ src: image.src, alt: image.title }]} /> : <p role="status">{loaded ? 'No valid image was selected.' : 'Loading image…'}</p>}</div></main>;
}
