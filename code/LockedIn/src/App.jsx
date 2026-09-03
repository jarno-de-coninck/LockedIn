import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import TrackerTab from './components/TrackerTab';
import WorkoutTab from './components/WorkoutTab';
import DietTab from './components/DietTab';
import AiStudioTab from './components/AiStudioTab';
import SplashScreen from './components/SplashScreen';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

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

      <div className="w-full max-w-md mx-auto min-h-[100dvh] bg-slate-50 text-slate-900 flex flex-col relative select-none">
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
      />

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
