import React, { useState } from 'react';
import { Maa42Logo } from './Maa42Logo';
import { UserProfile } from '../types';
import { X, Printer, Download, Loader2, ShieldCheck } from 'lucide-react';

interface PdfPreviewModalProps {
  isOpen: boolean;
  summaryText: string;
  user: UserProfile;
  onClose: () => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  summaryText,
  user,
  onClose,
}) => {
  const [generating, setGenerating] = useState(false);

  if (!isOpen) return null;

  // Builds and downloads a real PDF client-side with pdf-lib — no server
  // round trip needed, and no more `alert("Export completed...")` lie.
  const handleDownloadPdf = async () => {
    setGenerating(true);
    try {
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');

      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4
      const { width, height } = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const primary = rgb(0.03, 0.26, 0.29);
      const muted = rgb(0.4, 0.42, 0.42);
      let y = height - 60;

      page.drawText('MEDSOPHIA TELEHEALTH SUMMARY', {
        x: 50, y, size: 14, font: fontBold, color: primary,
      });
      y -= 16;
      page.drawText('Metro Maternal Health Clinic - Dr. Ananya Sharma, MD', {
        x: 50, y, size: 9, font, color: muted,
      });
      y -= 30;

      const fields: [string, string][] = [
        ['Patient', user.name || '-'],
        ['Gestational Age', user.isPostpartum ? `Postpartum Day ${user.postpartumDay} of 42` : `Week ${user.week} (Trimester ${user.trimester})`],
        ['Est. Due Date', user.dueDate || '-'],
        ['Date Generated', new Date().toLocaleDateString()],
      ];
      for (const [label, value] of fields) {
        page.drawText(`${label}:`, { x: 50, y, size: 9, font: fontBold, color: muted });
        page.drawText(value, { x: 180, y, size: 9, font, color: rgb(0, 0, 0) });
        y -= 16;
      }

      y -= 10;
      page.drawText('7-Day Clinical Remote Digest & AI Triage Notes', {
        x: 50, y, size: 10, font: fontBold, color: primary,
      });
      y -= 18;

      const maxWidth = width - 100;
      const lines = summaryText.split('\n').flatMap((rawLine) => {
        const words = rawLine.split(' ');
        const wrapped: string[] = [];
        let current = '';
        for (const word of words) {
          const test = current ? `${current} ${word}` : word;
          if (font.widthOfTextAtSize(test, 9) > maxWidth) {
            if (current) wrapped.push(current);
            current = word;
          } else {
            current = test;
          }
        }
        wrapped.push(current);
        return wrapped;
      });

      for (const line of lines) {
        if (y < 80) break; // stay on one page for this prototype
        page.drawText(line, { x: 50, y, size: 9, font, color: rgb(0.1, 0.1, 0.1) });
        y -= 13;
      }

      y -= 10;
      page.drawText('Electronically Signed & Audited by Sophia AI Clinical Engine', {
        x: 50, y, size: 8, font, color: primary,
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `medsophia-summary-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative border border-surface-container my-auto animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Clinical Letterhead */}
        <div className="border-b-2 border-primary/20 pb-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 p-0.5 rounded-lg border border-surface-container bg-white">
              <Maa42Logo className="h-full w-full" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-primary tracking-wide">
                MEDSOPHIA TELEHEALTH SUMMARY
              </h2>
              <p className="text-[11px] text-on-surface-variant">
                Metro Maternal Health Clinic &bull; Dr. Ananya Sharma, MD
              </p>
            </div>
          </div>
          <div className="text-right text-[11px] text-on-surface-variant font-mono">
            <span>Date: {new Date().toLocaleDateString()}</span>
            <br />
            <span className="text-primary font-bold">Confidential EHR</span>
          </div>
        </div>

        {/* Patient Demographics */}
        <div className="bg-surface-container-low p-3.5 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-4 border border-surface-container">
          <div>
            <span className="text-on-surface-variant block font-medium">Patient:</span>
            <span className="font-bold text-on-surface">{user.name}</span>
          </div>
          <div>
            <span className="text-on-surface-variant block font-medium">Gestational Age:</span>
            <span className="font-bold text-on-surface">
              {user.isPostpartum ? `Postpartum Day ${user.postpartumDay} of 42` : `Week ${user.week} (Trimester ${user.trimester})`}
            </span>
          </div>
          <div>
            <span className="text-on-surface-variant block font-medium">Est. Due Date:</span>
            <span className="font-bold text-on-surface">{user.dueDate || '—'}</span>
          </div>
          <div>
            <span className="text-on-surface-variant block font-medium">Care Circle:</span>
            <span className="font-bold text-primary">Active Synced</span>
          </div>
        </div>

        {/* Body content */}
        <div className="bg-surface p-4 rounded-xl border border-surface-container mb-4 text-xs text-on-surface leading-relaxed space-y-3">
          <h3 className="font-bold uppercase tracking-wider text-secondary text-[11px]">
            7-Day Clinical Remote Digest &amp; AI Triage Notes
          </h3>
          <div className="whitespace-pre-line font-mono text-[11px] bg-surface-container-lowest p-3 rounded-lg border border-surface-container">
            {summaryText}
          </div>
          <div className="pt-2 text-[11px] text-on-surface-variant">
            <p>
              <strong>Clinical Action Plan:</strong> Continue maternal iron supplementation and daily 2.0L hydration. Patient advised to utilize side-lying rest for mild ligamentous stretch tension. No acute fetal compromise or hypertensive risks noted.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-primary font-semibold mb-6">
          <ShieldCheck className="w-4 h-4" />
          <span>Electronically Signed &amp; Audited by Sophia AI Clinical Engine</span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-surface-container">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-surface text-on-surface border border-surface-container-high px-4 py-2.5 rounded-full text-xs font-semibold hover:bg-surface-container transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Clinical PDF</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={generating}
            className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-full text-xs font-semibold hover:bg-primary-container transition-all cursor-pointer shadow-sm disabled:opacity-60"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{generating ? 'Generating...' : 'Download PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
