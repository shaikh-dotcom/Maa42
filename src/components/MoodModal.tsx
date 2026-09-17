import React, { useState } from 'react';
import { Smile, Heart, Check, X } from 'lucide-react';

interface MoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMood?: (mood: string, tags: string[], notes: string) => void;
}

const MOODS = [
  { id: 'peaceful', label: 'Calm & Peaceful', icon: '🕊️' },
  { id: 'joyful', label: 'Joyful & Connected', icon: '✨' },
  { id: 'tired', label: 'Tired / Fatigued', icon: '😴' },
  { id: 'sensitive', label: 'Anxious / Sensitive', icon: '🌧️' },
  { id: 'overwhelmed', label: 'Overwhelmed', icon: '🫂' },
];

const SYMPTOMS = [
  'Back tension',
  'Pelvic pressure',
  'Heartburn',
  'Nausea',
  'Glowing skin',
  'Deep sleep',
  'Swollen feet',
  'Light Braxton Hicks',
];

export const MoodModal: React.FC<MoodModalProps> = ({
  isOpen,
  onClose,
  onSaveMood,
}) => {
  const [selectedMood, setSelectedMood] = useState('peaceful');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['Pelvic pressure']);
  const [notes, setNotes] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const toggleSymptom = (sym: string) => {
    if (selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== sym));
    } else {
      setSelectedSymptoms([...selectedSymptoms, sym]);
    }
  };

  const handleSave = () => {
    setIsSaved(true);
    if (onSaveMood) {
      onSaveMood(selectedMood, selectedSymptoms, notes);
    }
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/45 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-surface-container relative animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center">
            <Smile className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-on-surface">Emotional &amp; Physical Check-In</h3>
            <p className="text-xs text-on-surface-variant">How are you and baby feeling right now?</p>
          </div>
        </div>

        {/* Mood Selector */}
        <div className="mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-2">
            Today&apos;s Dominant Emotion
          </span>
          <div className="grid grid-cols-1 gap-2">
            {MOODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMood(m.id)}
                className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer border ${
                  selectedMood === m.id
                    ? 'bg-primary-container text-on-primary-container border-primary shadow-xs'
                    : 'bg-surface-container-low text-on-surface border-surface-container hover:bg-surface-container'
                }`}
              >
                <span className="text-base">{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Physical Symptoms */}
        <div className="mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-2">
            Physical Sensations
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SYMPTOMS.map((s) => {
              const isSelected = selectedSymptoms.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSymptom(s)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-secondary text-on-secondary border-secondary shadow-xs'
                      : 'bg-surface-container-low text-on-surface-variant border-surface-container hover:bg-surface-container'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Note */}
        <div className="mb-5">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add personal notes or sensations for Dr. Sharma..."
            className="w-full bg-surface-container-low p-3 rounded-xl text-xs text-on-surface border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary h-16 resize-none"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-primary text-on-primary py-3 rounded-full font-bold text-xs shadow-sm hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSaved ? (
            <>
              <Check className="w-4 h-4" />
              <span>Check-in Logged</span>
            </>
          ) : (
            <span>Save Mood &amp; Symptoms</span>
          )}
        </button>
      </div>
    </div>
  );
};
