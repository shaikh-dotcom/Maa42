import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus, Trash2, Pencil, Check } from "lucide-react";
import { CareMember } from "../types";

interface CareTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  careTeam: CareMember[];
  onAdd: (member: Omit<CareMember, "id">) => Promise<void>;
  onUpdate: (
    id: string,
    updates: Partial<Omit<CareMember, "id">>,
  ) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

type DraftMember = Omit<CareMember, "id">;

const BLANK_DRAFT: DraftMember = {
  name: "",
  role: "",
  facility: "",
  nextAppointment: "",
  badge: "",
  avatar: "",
  status: "",
  canCall: true,
  canMessage: true,
};

export const CareTeamModal: React.FC<CareTeamModalProps> = ({
  isOpen,
  onClose,
  careTeam,
  onAdd,
  onUpdate,
  onRemove,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState<DraftMember>(BLANK_DRAFT);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const startEdit = (member: CareMember) => {
    const { id, ...rest } = member;
    setDraft(rest);
    setEditingId(id);
    setIsAdding(false);
  };

  const startAdd = () => {
    setDraft(BLANK_DRAFT);
    setIsAdding(true);
    setEditingId(null);
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setDraft(BLANK_DRAFT);
  };

  const saveForm = async () => {
    if (!draft.name.trim() || !draft.role.trim()) return;
    setIsSaving(true);
    try {
      const payload: DraftMember = {
        ...draft,
        badge: draft.badge.trim() || draft.role.trim(),
        avatar:
          draft.avatar.trim() ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(draft.name)}`,
        status:
          draft.status.trim() ||
          (draft.nextAppointment ?? "").trim() ||
          "Care team member",
      };
      if (editingId) {
        await onUpdate(editingId, payload);
      } else {
        await onAdd(payload);
      }
      cancelForm();
    } finally {
      setIsSaving(false);
    }
  };

  const showForm = isAdding || editingId !== null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="bg-surface w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-xl max-h-[85vh] flex flex-col"
        >
          <div className="flex items-center justify-between p-5 border-b border-surface-container shrink-0">
            <h2 className="text-lg font-bold text-on-surface">
              Manage Care Circle
            </h2>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4 text-on-surface-variant" />
            </button>
          </div>

          <div className="overflow-y-auto p-5 flex flex-col gap-3 flex-1">
            {!showForm &&
              careTeam.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between bg-surface-container-low p-3 rounded-2xl border border-surface-container"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-on-surface truncate">
                        {member.name}
                      </p>
                      <p className="text-xs text-on-surface-variant truncate">
                        {member.role}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => startEdit(member)}
                      className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary cursor-pointer"
                      title={`Edit ${member.name}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onRemove(member.id)}
                      className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-error cursor-pointer"
                      title={`Remove ${member.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

            {!showForm && careTeam.length === 0 && (
              <p className="text-sm text-on-surface-variant text-center py-6">
                No one in your Care Circle yet.
              </p>
            )}

            {!showForm && (
              <button
                onClick={startAdd}
                className="flex items-center justify-center gap-2 border-2 border-dashed border-primary/40 text-primary rounded-2xl py-3 font-semibold text-sm cursor-pointer hover:bg-primary/5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Care Team Member
              </button>
            )}

            {showForm && (
              <div className="flex flex-col gap-3">
                <input
                  className="bg-surface-container-low border border-surface-container rounded-xl px-3 py-2.5 text-sm text-on-surface"
                  placeholder="Full name (e.g. Dr. Ananya Sharma)"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
                <input
                  className="bg-surface-container-low border border-surface-container rounded-xl px-3 py-2.5 text-sm text-on-surface"
                  placeholder="Role (e.g. Lead OB-GYN, Partner)"
                  value={draft.role}
                  onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                />
                <input
                  className="bg-surface-container-low border border-surface-container rounded-xl px-3 py-2.5 text-sm text-on-surface"
                  placeholder="Facility or context"
                  value={draft.facility}
                  onChange={(e) =>
                    setDraft({ ...draft, facility: e.target.value })
                  }
                />
                <input
                  className="bg-surface-container-low border border-surface-container rounded-xl px-3 py-2.5 text-sm text-on-surface"
                  placeholder="Next appointment / status line"
                  value={draft.nextAppointment ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, nextAppointment: e.target.value })
                  }
                />
                <input
                  className="bg-surface-container-low border border-surface-container rounded-xl px-3 py-2.5 text-sm text-on-surface"
                  placeholder="Photo URL (optional)"
                  value={draft.avatar}
                  onChange={(e) =>
                    setDraft({ ...draft, avatar: e.target.value })
                  }
                />
                <div className="flex gap-4 px-1">
                  <label className="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!draft.canMessage}
                      onChange={(e) =>
                        setDraft({ ...draft, canMessage: e.target.checked })
                      }
                    />
                    Can message
                  </label>
                  <label className="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!draft.canCall}
                      onChange={(e) =>
                        setDraft({ ...draft, canCall: e.target.checked })
                      }
                    />
                    Can video call
                  </label>
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    onClick={cancelForm}
                    className="flex-1 bg-surface-container text-on-surface py-3 rounded-full text-sm font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveForm}
                    disabled={
                      isSaving || !draft.name.trim() || !draft.role.trim()
                    }
                    className="flex-1 bg-primary text-on-primary py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    {editingId ? "Save Changes" : "Add Member"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
