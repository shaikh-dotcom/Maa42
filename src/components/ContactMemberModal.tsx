import React, { useState } from 'react';
import { CareMember } from '../types';
import { X, Send, Video, Phone, CheckCircle, MessageSquare } from 'lucide-react';

interface ContactMemberModalProps {
  member: CareMember | null;
  mode: 'chat' | 'call';
  onClose: () => void;
}

export const ContactMemberModal: React.FC<ContactMemberModalProps> = ({
  member,
  mode,
  onClose,
}) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([
    "Hello Sarah, Dr. Sharma's clinic here. How can we assist you with your Week 24 care today?",
  ]);
  const [callEnded, setCallEnded] = useState(false);

  if (!member) return null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    const sent = message.trim();
    setMessages((prev) => [...prev, sent]);
    setMessage('');

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        `Thank you for your update. Message noted by ${member.name}. A care coordinator will review shortly.`,
      ]);
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

        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-surface-container">
          <img
            src={member.avatar}
            alt={member.name}
            className="w-12 h-12 rounded-full object-cover border border-surface-container-high"
            referrerPolicy="no-referrer"
          />
          <div>
            <h3 className="text-sm font-bold text-on-surface">{member.name}</h3>
            <span className="text-xs text-primary font-medium">{member.role}</span>
          </div>
        </div>

        {mode === 'call' ? (
          <div className="py-6 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 animate-pulse">
              <Video className="w-9 h-9" />
            </div>
            <h4 className="text-base font-bold text-on-surface mb-1">
              Telehealth Video Room
            </h4>
            <p className="text-xs text-on-surface-variant mb-6">
              Encrypted direct clinical feed with {member.name}
            </p>
            <button
              onClick={onClose}
              className="bg-error text-on-error px-6 py-2.5 rounded-full text-xs font-bold hover:opacity-95 cursor-pointer shadow-sm"
            >
              End Consultation
            </button>
          </div>
        ) : (
          <div className="flex flex-col h-72">
            <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1 text-xs">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl ${
                    idx % 2 === 1
                      ? 'bg-primary text-on-primary ml-auto max-w-[85%]'
                      : 'bg-surface-container-low text-on-surface mr-auto max-w-[85%] border border-surface-container'
                  }`}
                >
                  {m}
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Message ${member.name.split(' ')[0]}...`}
                className="flex-1 bg-surface-container-low text-xs text-on-surface px-3.5 py-2.5 rounded-full border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 hover:bg-primary-container cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
