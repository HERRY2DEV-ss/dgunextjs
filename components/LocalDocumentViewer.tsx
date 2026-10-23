'use client';
import { useState } from 'react';
export default function LocalDocumentViewer({ title, url, htmlDocument = false }: { title: string; url: string; htmlDocument?: boolean }) {
  const [visible, setVisible] = useState(true);
  return <section className="local-document" aria-label={title}>
    <div className="local-document-actions"><button type="button" aria-expanded={visible} aria-controls="local-pdf-viewer" onClick={() => setVisible(!visible)}>{visible ? 'Close document' : 'Read document'}</button>{!htmlDocument && <a href={url} download target="_blank" rel="noopener noreferrer">Open / download PDF <span aria-hidden="true">↗</span></a>}</div>
    {visible && <iframe id="local-pdf-viewer" src={url} title={title} className="local-pdf-viewer" sandbox={htmlDocument ? 'allow-scripts allow-downloads' : undefined} />}
    <p className="local-document-help">{htmlDocument ? 'Read the original university publication within this page.' : 'Read the original document here, or use the PDF link if your browser does not support the viewer.'}</p>
  </section>;
}
