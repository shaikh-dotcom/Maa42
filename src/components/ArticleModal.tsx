import React from 'react';
import { ArticleItem } from '../types';
import { X, Bookmark, Share2, Heart, Clock, BookOpen } from 'lucide-react';

interface ArticleModalProps {
  article: ArticleItem | null;
  onClose: () => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({ article, onClose }) => {
  if (!article) return null;

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/45 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative border border-surface-container my-auto animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative rounded-2xl overflow-hidden mb-4 shadow-sm">
          <img
            src={article.imageUrl}
            alt={article.alt}
            className="w-full h-48 object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-3 left-3 bg-secondary text-on-secondary px-3 py-1 rounded-full text-xs font-bold shadow-sm uppercase tracking-wide">
            {article.category}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-on-surface-variant mb-2">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{article.readTime}</span>
          </span>
          <span>&bull;</span>
          <span>Medically Reviewed by Dr. Ananya Sharma</span>
        </div>

        <h2 className="text-xl font-bold font-headline text-primary mb-3 leading-snug">
          {article.title}
        </h2>

        <p className="text-sm text-on-surface-variant leading-relaxed mb-6 font-body whitespace-pre-line">
          {article.fullContent}
        </p>

        <div className="bg-primary-fixed/40 p-4 rounded-2xl border border-primary/20 mb-6">
          <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Heart className="w-4 h-4 fill-current text-primary" />
            <span>Clinical Pearl for Week 24</span>
          </h4>
          <p className="text-xs text-on-primary-fixed-variant leading-relaxed">
            Take 5 minutes every evening after hydration to practice belly breathing with your hands on your lower abdomen. Your baby can sense maternal parasympathetic calming signals.
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-surface-container">
          <button
            onClick={() => alert("Article saved to your maternal care bookmarks!")}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-container cursor-pointer"
          >
            <Bookmark className="w-4 h-4" />
            <span>Save to Reading List</span>
          </button>

          <button
            onClick={onClose}
            className="bg-primary text-on-primary px-5 py-2 rounded-full text-xs font-semibold hover:bg-primary-container transition-colors cursor-pointer"
          >
            Close Reader
          </button>
        </div>
      </div>
    </div>
  );
};
