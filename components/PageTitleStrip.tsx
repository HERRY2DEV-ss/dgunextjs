import type { ReactNode } from 'react';

export default function PageTitleStrip({ title, id, children }: {
  title: ReactNode;
  id?: string;
  children?: ReactNode;
}) {
  return <section className="dgu-page-title-strip" aria-label={typeof title === 'string' ? title : undefined}>
    <h1 id={id}>{title}</h1>
    {children}
  </section>;
}
