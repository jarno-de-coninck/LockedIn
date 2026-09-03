/**
 * Real Athletic Streak Calculator
 * Calculates true streak without hardcoding or fake numbers.
 */

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateRealStreak(meals = [], workouts = []) {
  const todayStr = getLocalDateString(new Date());

  // Collect all days with activity
  let storedDays = [];
  try {
    const raw = localStorage.getItem('lockedin_activity_days');
    if (raw) storedDays = JSON.parse(raw);
  } catch {}

  const activeDaysSet = new Set(storedDays);

  // If meals or workouts are logged today, mark today active
  if (meals.length > 0 || workouts.length > 0) {
    activeDaysSet.add(todayStr);
  }

  // Also extract dates from meal/workout IDs if they are timestamps
  meals.forEach((m) => {
    if (typeof m.id === 'number' && m.id > 1600000000000) {
      activeDaysSet.add(getLocalDateString(new Date(m.id)));
    }
  });

  workouts.forEach((w) => {
    if (typeof w.id === 'number' && w.id > 1600000000000) {
      activeDaysSet.add(getLocalDateString(new Date(w.id)));
    }
  });

  // Save updated days back to localStorage
  try {
    localStorage.setItem('lockedin_activity_days', JSON.stringify(Array.from(activeDaysSet)));
  } catch {}

  // If no activity at all, streak is 0
  if (activeDaysSet.size === 0) {
    return 0;
  }

  // Calculate consecutive days backwards starting from today or yesterday
  let streak = 0;
  const cursor = new Date();

  // If today is active, start counting from today
  if (activeDaysSet.has(todayStr)) {
    streak = 1;
    cursor.setDate(cursor.getDate() - 1);
  } else {
    // Today not active yet; check if yesterday was active to keep streak alive
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    if (activeDaysSet.has(yesterdayStr)) {
      streak = 1;
      cursor.setDate(cursor.getDate() - 2);
    } else {
      // Neither today nor yesterday active -> streak is 0
      return 0;
    }
  }

  // Count backwards day by day with safe upper bound
  let safetyCount = 3650;
  while (safetyCount-- > 0) {
    const dateStr = getLocalDateString(cursor);
    if (activeDaysSet.has(dateStr)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
