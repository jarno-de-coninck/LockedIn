/**
 * Daily History and Rollover Engine for LockedIn
 * Automatically archives completed days, resets active daily logs,
 * and enables athletes to review past days (meals, workouts, calories, score).
 */

export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatHumanDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length < 3) return dateStr;
  const [y, m, d] = parts;
  const date = new Date(y, m - 1, d);
  const todayStr = getLocalDateString(new Date());

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  if (dateStr === todayStr) return 'Today';
  if (dateStr === yesterdayStr) return 'Yesterday';

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Loads all archived days from localStorage
 */
export function getDailyHistory() {
  try {
    const raw = localStorage.getItem('lockedin_daily_history');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.sort((a, b) => b.date.localeCompare(a.date));
    }
    return [];
  } catch (err) {
    console.warn('Failed to load daily history:', err);
    return [];
  }
}

/**
 * Saves or updates a specific day's archived record
 */
export function saveDayToHistory(dayRecord) {
  if (!dayRecord || !dayRecord.date) return;
  try {
    const history = getDailyHistory();
    const existingIdx = history.findIndex((h) => h.date === dayRecord.date);
    if (existingIdx >= 0) {
      history[existingIdx] = { ...history[existingIdx], ...dayRecord };
    } else {
      history.unshift(dayRecord);
    }
    // Keep up to 60 days of athlete history
    const trimmed = history.slice(0, 60);
    localStorage.setItem('lockedin_daily_history', JSON.stringify(trimmed));
  } catch (err) {
    console.warn('Failed to save day to history:', err);
  }
}

/**
 * Checks if a new calendar day has started since the last session.
 * If so, archives yesterday's meals & workouts, clears today's logs,
 * and signals that a new diet plan should be generated.
 */
export function checkAndPerformDailyRollover({
  currentMeals = [],
  currentWorkouts = [],
  goal = 2000,
  onNewDay,
}) {
  const todayStr = getLocalDateString(new Date());
  let lastActiveDate = null;

  try {
    lastActiveDate = localStorage.getItem('lockedin_last_active_date');
  } catch {}

  // If this is first launch ever, mark today as last active
  if (!lastActiveDate) {
    try {
      localStorage.setItem('lockedin_last_active_date', todayStr);
    } catch {}
    return { rolledOver: false };
  }

  // If date has not changed, do nothing
  if (lastActiveDate === todayStr) {
    return { rolledOver: false };
  }

  // A NEW DAY HAS ARRIVED!
  const totalConsumed = currentMeals.reduce((a, m) => a + (Number(m.calories) || 0), 0);
  const totalBurned = currentWorkouts.reduce((a, w) => a + (Number(w.caloriesBurned) || 0), 0);

  if (currentMeals.length > 0 || currentWorkouts.length > 0) {
    const [y, m, d] = lastActiveDate.split('-').map(Number);
    const prevDateObj = new Date(y, m - 1, d);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = isNaN(prevDateObj.getTime()) ? '' : dayNames[prevDateObj.getDay()];

    const archivedRecord = {
      date: lastActiveDate,
      dayName,
      goalCalories: goal || 2000,
      totalConsumed,
      totalBurned,
      netCalories: totalConsumed - totalBurned,
      meals: [...currentMeals],
      workouts: [...currentWorkouts],
      questsCompleted:
        (currentWorkouts.length > 0 ? 1 : 0) +
        (totalConsumed >= Math.round(goal * 0.85) ? 1 : 0) +
        (currentMeals.length >= 3 ? 1 : 0),
      isFullyLockedIn:
        currentWorkouts.length > 0 &&
        totalConsumed >= Math.round(goal * 0.85) &&
        currentMeals.length >= 3,
      timestamp: Date.now(),
    };

    saveDayToHistory(archivedRecord);
  }

  // Update last active date & reset daily logs
  try {
    localStorage.setItem('lockedin_last_active_date', todayStr);
    localStorage.setItem('lockedin_meals', '[]');
    localStorage.setItem('lockedin_workouts', '[]');
  } catch {}

  if (typeof onNewDay === 'function') {
    onNewDay({ previousDate: lastActiveDate, newDate: todayStr });
  }

  return { rolledOver: true, previousDate: lastActiveDate, newDate: todayStr };
}

/**
 * Manual test helper to simulate midnight / next day rollover
 */
export function simulateNextDayRollover({ currentMeals = [], currentWorkouts = [], goal = 2000, onNewDay }) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const fakeLastDate = getLocalDateString(yesterday);

  try {
    localStorage.setItem('lockedin_last_active_date', fakeLastDate);
  } catch {}

  return checkAndPerformDailyRollover({
    currentMeals,
    currentWorkouts,
    goal,
    onNewDay,
  });
}
