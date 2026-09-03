import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import TrackerTab from './components/TrackerTab';
import WorkoutTab from './components/WorkoutTab';
import DietTab from './components/DietTab';
import AiStudioTab from './components/AiStudioTab';
import SplashScreen from './components/SplashScreen';
import OnboardingModal from './components/OnboardingModal';
import { Download, X } from 'lucide-react';
import { useLanguage } from './services/i18n';
import { calculateRealStreak } from './services/streak';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const { t } = useLanguage();

  // First-time onboarding detection (when userProfile is not found in localStorage)
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try {
      return !localStorage.getItem('lockedin_user_profile');
    } catch {
      return false;
    }
  });

  const [showInstallBanner, setShowInstallBanner] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        const dismissed = sessionStorage.getItem('lockedin_dismiss_install');
        return !isStandalone && !dismissed;
      }
    } catch {
      return true;
    }
    return true;
  });
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
      if (!isStandalone) {
        setShowInstallBanner(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallBanner(false);
        setDeferredPrompt(null);
      }
    } else {
      setShowInstallGuide(true);
    }
  };

  const handleDismissBanner = () => {
    setShowInstallBanner(false);
    try {
      sessionStorage.setItem('lockedin_dismiss_install', '1');
    } catch {}
  };

  // 1. Storage-backed state: User Profile
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('lockedin_user_profile');
      return saved ? JSON.parse(saved) : {
        gender: 'male',
        height: 180,
        weight: 78,
        bmi: '24.1',
        goalCalories: 2000,
      };
    } catch {
      return {
        gender: 'male',
        height: 180,
        weight: 78,
        bmi: '24.1',
        goalCalories: 2000,
      };
    }
  });

  // 2. Storage-backed state: Goal
  const [goal, setGoal] = useState(() => {
    try {
      const saved = localStorage.getItem('lockedin_goal');
      return saved !== null ? Number(saved) : 2000;
    } catch {
      return 2000;
    }
  });

  // 3. Storage-backed state: Meals Log
  const [meals, setMeals] = useState(() => {
    try {
      const saved = localStorage.getItem('lockedin_meals');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 4. Storage-backed state: Diet Plan
  const [dietPlan, setDietPlan] = useState(() => {
    try {
      const saved = localStorage.getItem('lockedin_diet_plan');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 5. Storage-backed state: Workouts Log
  const [workouts, setWorkouts] = useState(() => {
    try {
      const saved = localStorage.getItem('lockedin_workouts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 6. Storage-backed state: Training Schedule
  const [trainingSchedule, setTrainingSchedule] = useState(() => {
    try {
      const saved = localStorage.getItem('lockedin_training_schedule');
      if (saved) return JSON.parse(saved);
      return {
        programTitle: '🎾 4-Day Tennis Pro Agility & Power Split',
        sport: 'tennis',
        goal: 'Speed & Agility',
        daysPerWeek: 4,
        level: 'Intermediate',
        schedule: [
          {
            day: 'Monday',
            title: 'Agility, Split-Step & On-Court Footwork',
            focus: 'Lateral speed & court transitions',
            duration: '50m',
            type: 'Court Agility',
            exercises: [
              { name: 'Hexagon Footwork Ball Toss Drill', sets: '4 sets', reps: '30s work / 30s rest', notes: 'Split-step cadence' },
              { name: 'Lateral Shuffles with Resistance Band', sets: '4 sets', reps: '15 reps each way', notes: 'Low center of gravity' },
            ],
          },
          {
            day: 'Tuesday',
            title: 'Rotational Power & Shoulder Armor',
            focus: 'Med ball throws, core rotational speed & rotator cuff',
            duration: '45m',
            type: 'Strength & Power',
            exercises: [
              { name: 'Medicine Ball Rotational Forehand/Backhand Slams', sets: '4 sets', reps: '10 reps/side', notes: '6kg ball' },
              { name: 'Rotator Cuff External Rotations (Face Pulls)', sets: '4 sets', reps: '15 reps', notes: 'Band or Cable' },
            ],
          },
          {
            day: 'Wednesday',
            title: 'Active Recovery & Hip Mobility',
            focus: 'Foam rolling, ankle dorsiflexion & gentle zone 2 walk',
            duration: '30m',
            type: 'Recovery',
            exercises: [
              { name: '90/90 Hip Opener Flow & Pigeon Stretch', sets: '3 sets', reps: '60s per side', notes: 'Hip rotational mobility' },
            ],
          },
          {
            day: 'Thursday',
            title: 'Serve Power & Plyometric Explosiveness',
            focus: 'Jump training, overhead power & deceleration',
            duration: '50m',
            type: 'Plyometrics',
            exercises: [
              { name: 'Box Jumps with Soft Deceleration Landing', sets: '4 sets', reps: '6 jumps', notes: '24 inch box' },
              { name: 'Overhead Band Deceleration Serve Pulls', sets: '4 sets', reps: '12 reps', notes: 'Shoulder control' },
            ],
          },
          {
            day: 'Friday',
            title: 'Match Play Simulation & High-Cadence Rallies',
            focus: 'Endurance under pressure & point construction',
            duration: '60m',
            type: 'Sport Specific',
            exercises: [
              { name: 'Deep Baseline Crosscourt Rallies (Live)', sets: '5 sets', reps: '3 min games', notes: 'Depth focus' },
            ],
          },
          {
            day: 'Saturday',
            title: 'Aerobic Engine & Leg Drive Conditioning',
            focus: 'Tempo running & single-leg balance',
            duration: '40m',
            type: 'Conditioning',
            exercises: [
              { name: 'Tempo Running Intervals (Court Sprints)', sets: '6 sets', reps: '100m sprint / 45s rest', notes: 'Speed endurance' },
            ],
          },
          {
            day: 'Sunday',
            title: 'Total Rest & Central Nervous System Reset',
            focus: 'Hydration, light stretching & nutritional replenishment',
            duration: '0m',
            type: 'Rest',
            exercises: [],
          },
        ],
      };
    } catch {
      return null;
    }
  });

  // 7. Sport Profile preferences
  const [activeSport, setActiveSport] = useState(() => {
    return localStorage.getItem('lockedin_active_sport') || 'tennis';
  });

  const [trainingGoal, setTrainingGoal] = useState(() => {
    return localStorage.getItem('lockedin_training_goal') || 'Speed & Agility';
  });

  // Active navigation tab: 'today' | 'workouts' | 'diet' | 'ai'
  const [activeTab, setActiveTab] = useState('today');

  // Real, Honest Streak Calculation
  const realStreakDays = useMemo(() => {
    return calculateRealStreak(meals, workouts);
  }, [meals, workouts]);

  // Onboarding completion handler
  const handleOnboardingComplete = (profile, newGoal, newSport) => {
    setUserProfile(profile);
    setGoal(newGoal);
    if (newSport) setActiveSport(newSport);
    try {
      localStorage.setItem('lockedin_user_profile', JSON.stringify(profile));
      localStorage.setItem('lockedin_goal', newGoal.toString());
      if (newSport) localStorage.setItem('lockedin_active_sport', newSport);
    } catch (e) {
      console.warn('Failed to save onboarding data', e);
    }
    setShowOnboarding(false);
  };

  // Persistence Sync
  useEffect(() => {
    try {
      localStorage.setItem('lockedin_user_profile', JSON.stringify(userProfile));
    } catch (e) {
      console.warn('Failed to save lockedin_user_profile', e);
    }
  }, [userProfile]);

  useEffect(() => {
    try {
      localStorage.setItem('lockedin_goal', goal.toString());
    } catch (e) {
      console.warn('Failed to save lockedin_goal', e);
    }
  }, [goal]);

  useEffect(() => {
    try {
      localStorage.setItem('lockedin_meals', JSON.stringify(meals));
    } catch (e) {
      console.warn('Failed to save lockedin_meals', e);
    }
  }, [meals]);

  useEffect(() => {
    try {
      localStorage.setItem('lockedin_diet_plan', JSON.stringify(dietPlan));
    } catch (e) {
      console.warn('Failed to save lockedin_diet_plan', e);
    }
  }, [dietPlan]);

  useEffect(() => {
    try {
      localStorage.setItem('lockedin_workouts', JSON.stringify(workouts));
    } catch (e) {
      console.warn('Failed to save lockedin_workouts', e);
    }
  }, [workouts]);

  useEffect(() => {
    if (trainingSchedule) {
      try {
        localStorage.setItem('lockedin_training_schedule', JSON.stringify(trainingSchedule));
      } catch (e) {
        console.warn('Failed to save lockedin_training_schedule', e);
      }
    }
  }, [trainingSchedule]);

  useEffect(() => {
    localStorage.setItem('lockedin_active_sport', activeSport);
  }, [activeSport]);

  useEffect(() => {
    localStorage.setItem('lockedin_training_goal', trainingGoal);
  }, [trainingGoal]);

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {/* First-Time Real Athlete Onboarding */}
      <OnboardingModal
        isOpen={showOnboarding && !showSplash}
        onComplete={handleOnboardingComplete}
        onSkip={() => setShowOnboarding(false)}
      />

      <div className="w-full max-w-md mx-auto min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col relative select-none shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-x-hidden">
        {/* Sticky Top Minimalist Header with Profile Avatar */}
        <Header
          goal={goal}
          setGoal={setGoal}
          userProfile={userProfile}
          setUserProfile={setUserProfile}
          activeSport={activeSport}
          setActiveSport={setActiveSport}
          trainingGoal={trainingGoal}
          setTrainingGoal={setTrainingGoal}
          streakCount={realStreakDays}
        />

        {/* PWA Install Banner */}
        {showInstallBanner && (
          <div className="mx-3.5 mt-2.5 p-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-between shadow-lg shadow-orange-500/20 border border-orange-400/30 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Download className="w-4 h-4 text-white" />
              </div>
              <div className="text-xs font-black leading-tight">
                Install LockedIn App
                <span className="block text-[11px] font-medium text-orange-100">Full-screen athletic experience</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-3 py-1.5 rounded-xl bg-white text-slate-950 text-xs font-black active-press shadow-xs hover:bg-orange-50 transition-colors"
              >
                Install
              </button>
              <button
                type="button"
                onClick={handleDismissBanner}
                className="p-1 text-orange-200 hover:text-white"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Install Guide Modal */}
        {showInstallGuide && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 animate-scale-up">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                    <Download className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-sm">Install LockedIn App</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInstallGuide(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                  <span>Tap the <strong>three dots (⋮)</strong> in Chrome at the top right.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                  <span>Select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                  <span>Tap <strong>Add / Install</strong> — the app will install with its native dark icon!</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowInstallGuide(false)}
                className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs active-press transition-colors shadow-lg shadow-orange-500/30"
              >
                Got it!
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Tab Body */}
        <main className="flex-1 px-3.5 py-3 sm:px-4 sm:py-4 overflow-y-auto">
          {activeTab === 'today' && (
            <TrackerTab
              goal={goal}
              meals={meals}
              setMeals={setMeals}
              workouts={workouts}
              dietPlan={dietPlan}
              trainingSchedule={trainingSchedule}
              activeSport={activeSport}
              onNavigateToDiet={() => setActiveTab('diet')}
              onNavigateToWorkouts={() => setActiveTab('workouts')}
            />
          )}

          {activeTab === 'workouts' && (
            <WorkoutTab
              workouts={workouts}
              setWorkouts={setWorkouts}
              trainingSchedule={trainingSchedule}
              setTrainingSchedule={setTrainingSchedule}
              activeSport={activeSport}
              trainingGoal={trainingGoal}
              onNavigateToAiStudio={() => setActiveTab('ai')}
            />
          )}

          {activeTab === 'diet' && (
            <DietTab
              goal={goal}
              dietPlan={dietPlan}
              setDietPlan={setDietPlan}
              meals={meals}
              setMeals={setMeals}
              setActiveTab={setActiveTab}
              onNavigateToAiStudio={() => setActiveTab('ai')}
            />
          )}

          {activeTab === 'ai' && (
            <AiStudioTab
              goal={goal}
              meals={meals}
              setMeals={setMeals}
              dietPlan={dietPlan}
              setDietPlan={setDietPlan}
              workouts={workouts}
              setWorkouts={setWorkouts}
              trainingSchedule={trainingSchedule}
              setTrainingSchedule={setTrainingSchedule}
              activeSport={activeSport}
              setActiveSport={setActiveSport}
              trainingGoal={trainingGoal}
              setTrainingGoal={setTrainingGoal}
              setActiveTab={setActiveTab}
            />
          )}
        </main>

        {/* Fixed Mobile Bottom Nav */}
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          loggedMealsCount={meals.length}
          loggedWorkoutsCount={workouts.length}
        />
      </div>
    </>
  );
}
