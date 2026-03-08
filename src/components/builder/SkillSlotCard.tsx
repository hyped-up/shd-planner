// Skill slot card — shows equipped skill variant or empty placeholder
"use client";

interface SkillSlotCardProps {
  slot: "skill1" | "skill2";
  skillName?: string;
  skillCategory?: string;
  onClick: () => void;
}

// Readable slot labels
const SLOT_LABELS: Record<string, string> = {
  skill1: "Skill 1",
  skill2: "Skill 2",
};

export default function SkillSlotCard({ slot, skillName, skillCategory, onClick }: SkillSlotCardProps) {
  const isEmpty = !skillName;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-md border border-border border-l-4 border-l-core-yellow bg-surface hover:bg-surface-hover transition-colors p-3 cursor-pointer group"
    >
      <div className="flex items-center gap-3">
        {/* Slot icon badge */}
        <div className="flex-shrink-0 w-9 h-9 rounded bg-background-tertiary flex items-center justify-center text-foreground-secondary text-sm font-bold group-hover:text-shd-orange transition-colors">
          {slot === "skill1" ? "S1" : "S2"}
        </div>

        <div className="flex-1 min-w-0">
          {/* Slot label */}
          <div className="text-xs uppercase tracking-wider text-foreground-secondary">{SLOT_LABELS[slot]}</div>

          {isEmpty ? (
            <div className="text-sm text-foreground-secondary italic mt-0.5">Empty — Click to configure</div>
          ) : (
            <div className="mt-0.5">
              <div className="text-sm font-medium text-foreground truncate">{skillName}</div>
              {skillCategory && (
                <span className="text-xs text-core-yellow">{skillCategory}</span>
              )}
            </div>
          )}
        </div>

        {/* Chevron */}
        <div className="flex-shrink-0 text-foreground-secondary group-hover:text-foreground transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </button>
  );
}
