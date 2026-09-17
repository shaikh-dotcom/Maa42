import React from 'react';
import { ArticleItem, AudioTrack } from '../types';
import { ARTICLES, AUDIO_TRACKS } from '../data';
import { X, BookOpen, Headphones, Sparkles, ChevronRight } from 'lucide-react';

interface ResourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectArticle: (article: ArticleItem) => void;
  onSelectAudioTrack: (track: AudioTrack) => void;
}

export const ResourcesModal: React.FC<ResourcesModalProps> = ({
  isOpen,
  onClose,
  onSelectArticle,
  onSelectAudioTrack,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/50 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative border border-surface-container my-auto animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-headline text-on-surface">
              Maternal Care Resources
            </h2>
            <p className="text-xs text-on-surface-variant">
              Clinical guides, trimester milestones &amp; audio therapy
            </p>
          </div>
        </div>

        {/* Featured Articles */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">
            Milestone Guides &amp; Articles
          </h3>
          <div className="space-y-3">
            {ARTICLES.map((art) => (
              <div
                key={art.id}
                onClick={() => {
                  onSelectArticle(art);
                  onClose();
                }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer border border-surface-container"
              >
                <img
                  src={art.imageUrl}
                  alt={art.alt}
                  className="w-16 h-16 rounded-xl object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-secondary uppercase">
                    {art.category}
                  </span>
                  <h4 className="text-xs font-bold text-on-surface truncate">{art.title}</h4>
                  <p className="text-[11px] text-on-surface-variant line-clamp-1 mt-0.5">
                    {art.snippet}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-on-surface-variant" />
              </div>
            ))}
          </div>
        </div>

        {/* Audio Therapy & Recovery */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-secondary mb-3">
            Postpartum Golden Month Audio Tracks
          </h3>
          <div className="space-y-2.5">
            {AUDIO_TRACKS.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  onSelectAudioTrack(t);
                  onClose();
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer border border-surface-container text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Headphones className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <span className="font-bold text-on-surface block">{t.title}</span>
                    <span className="text-[11px] text-on-surface-variant">{t.category} &bull; {t.duration}</span>
                  </div>
                </div>
                <span className="text-primary font-bold">&rarr;</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
