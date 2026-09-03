import React, { useState } from 'react';
import { User } from 'lucide-react';
import ProfileModal from './ProfileModal';
import BrandLogo from './BrandLogo';

export default function Header({
  goal,
  setGoal,
  userProfile,
  setUserProfile,
  activeSport,
  setActiveSport,
  trainingGoal,
  setTrainingGoal,
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
      <header
        className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 pb-2.5 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
        style={{
          paddingTop: 'max(14px, env(safe-area-inset-top, 14px))',
        }}
      >
        <div className="flex items-center justify-between">
          {/* Cool Brand Logo with Black Badge + Fire + Orange Lock */}
          <BrandLogo size="md" showText={true} textDark={true} />

          {/* User Profile & Daily Goal Badge */}
          <button
            type="button"
            onClick={() => setIsProfileOpen(true)}
            className="tap-target group flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200/60 transition-all active-press shadow-2xs"
            title="Athlete Profile & Biometrics"
          >
            <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-extrabold group-hover:bg-orange-500 transition-colors">
              <User className="w-3 h-3" />
            </div>
            <div className="flex items-center gap-1 leading-none pr-0.5">
              <span className="text-xs font-black text-slate-800">
                {userProfile?.weight || 78}kg
              </span>
              <span className="text-[9px] text-slate-400 font-semibold">•</span>
              <span className="text-[11px] font-bold text-slate-500">
                {goal} kcal
              </span>
            </div>
          </button>
        </div>
      </header>

      {/* Profile & Settings Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userProfile={userProfile}
        setUserProfile={setUserProfile}
        goal={goal}
        setGoal={setGoal}
        activeSport={activeSport}
        setActiveSport={setActiveSport}
        trainingGoal={trainingGoal}
        setTrainingGoal={setTrainingGoal}
      />
    </>
  );
}
