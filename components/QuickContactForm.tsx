'use client';

import { useEffect } from 'react';

type QuickContactFormProps = {
  courses?: string[];
  selectedCourse?: string;
  schoolUrl?: string;
  applyUrl?: string;
  apiOnly?: boolean;
};

const NPF_SCRIPT_URL = 'https://widgets.nopaperforms.com/emwgts.js';

/**
 * Shared NoPaperForms enquiry widget.
 *
 * Keep the existing component name and props so pages already using
 * <QuickContactForm ... /> do not need to be updated.
 */
export default function QuickContactForm(_props: QuickContactFormProps) {
  useEffect(() => {
    // Prevent duplicate script tags when this component appears more than once
    // or React remounts it during development.
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${NPF_SCRIPT_URL}"]`,
    );

    if (existingScript) {
      return;
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = NPF_SCRIPT_URL;
    script.dataset.npfWidgetScript = 'true';
    document.body.appendChild(script);
  }, []);

  return (
    <div className="school-contact-form">
      <div
        className="npf_wgts"
        data-height="480px"
        data-w="8227f920997b1da931caf83225eca082"
      />
    </div>
  );
}
