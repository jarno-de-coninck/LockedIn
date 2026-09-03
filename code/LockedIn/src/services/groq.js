/**
 * AI Service for LockedIn (Athletic Edition with Recipes & Profiles)
 * Supports:
 * 1. Local llama.cpp server (http://127.0.0.1:8080 or /api/local-ai)
 * 2. Groq Cloud (llama-3.3-70b-versatile)
 * 3. Smart local offline fallback engine
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_DEFAULT_MODEL = 'llama-3.1-8b-instant';
const GROQ_FALLBACK_MODEL = 'llama-3.3-70b-versatile';

export const getActiveProvider = () => {
  const saved = localStorage.getItem('lockedin_ai_provider');
  if (saved) return saved;
  if (import.meta.env.VITE_GROQ_API_KEY) return 'groq';
  if (typeof window !== 'undefined' && window.location.hostname.includes('github.io')) {
    return 'groq';
  }
  return 'local';
};

export const getLocalAiEndpoint = () => {
  const saved = localStorage.getItem('lockedin_local_ai_endpoint');
  if (saved && saved.trim()) return saved.trim();

  // If inside Capacitor APK or Android standalone WebView, default to Tailscale IP
  if (
    typeof window !== 'undefined' &&
    (window.location.protocol === 'capacitor:' ||
      (window.location.hostname === 'localhost' && window.location.port !== '5173'))
  ) {
    return 'http://100.115.34.31:8080';
  }
  return '/api/local-ai';
};

export const getGroqApiKey = () => {
  const envKey = import.meta.env.VITE_GROQ_API_KEY;
  if (envKey && envKey.trim() !== '' && !envKey.includes('YOUR_GROQ_API_KEY')) {
    return envKey.trim();
  }
  const localKey = localStorage.getItem('lockedin_custom_groq_key');
  if (localKey && localKey.trim() !== '') {
    return localKey.trim();
  }
  return '';
};

export async function testLocalAiConnection(customEndpoint = null) {
  const endpoint = customEndpoint || getLocalAiEndpoint();
  const url = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${url}/health`, { signal: controller.signal })
      .catch(() => fetch(`${url}/v1/models`, { signal: controller.signal }));

    clearTimeout(timeoutId);

    if (res && res.ok) {
      return { success: true, message: 'Connected to local llama.cpp server!' };
    }
    return { success: false, message: `Server returned status ${res?.status || 'unreachable'}` };
  } catch (err) {
    return {
      success: false,
      message: 'Could not reach llama-server. Make sure it is running on port 8080.',
    };
  }
}

function cleanJsonOutput(rawText) {
  if (!rawText) return null;
  let cleaned = String(rawText).trim();

  // Strip all markdown ```json and ``` blocks from output
  cleaned = cleaned.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();

  const firstBracket = cleaned.indexOf('[');
  const firstBrace = cleaned.indexOf('{');

  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    const endBracket = cleaned.lastIndexOf(']');
    if (endBracket > firstBracket) {
      cleaned = cleaned.substring(firstBracket, endBracket + 1);
    }
  } else if (firstBrace !== -1) {
    const endBrace = cleaned.lastIndexOf('}');
    if (endBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, endBrace + 1);
    }
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('Direct JSON parse failed, attempting regex cleanup:', err);
    try {
      const sanitized = cleaned
        .replace(/,\s*([\]}])/g, '$1')
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'");
      return JSON.parse(sanitized);
    } catch (e2) {
      console.error('Failed to parse JSON string:', cleaned);
      return null;
    }
  }
}

async function callChatCompletions({ messages, temperature = 0.4, max_tokens = 1100 }) {
  const provider = getActiveProvider();

  if (provider === 'local') {
    const endpoint = getLocalAiEndpoint();
    const url = `${endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint}/v1/chat/completions`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        temperature,
        max_tokens,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Local llama.cpp responded with status ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      source: 'local',
      modelName: data.model || 'llama.cpp (Local)',
    };
  }

  if (provider === 'groq') {
    const apiKey = getGroqApiKey();
    if (!apiKey) {
      throw new Error('Groq API Key is not configured.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const isReasoning = GROQ_DEFAULT_MODEL.includes('gpt-oss') || GROQ_DEFAULT_MODEL.includes('o1');
    const primaryPayload = {
      model: GROQ_DEFAULT_MODEL,
      messages,
      max_completion_tokens: max_tokens,
      ...(isReasoning ? { reasoning_effort: 'medium', temperature: 1 } : { temperature, max_tokens }),
    };

    let response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(primaryPayload),
      signal: controller.signal,
    }).catch(() => null);

    // If primary model fails, try fallback model
    if (!response || !response.ok) {
      console.warn(`Primary model ${GROQ_DEFAULT_MODEL} failed, trying fallback ${GROQ_FALLBACK_MODEL}...`);
      response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_FALLBACK_MODEL,
          messages,
          temperature,
          max_tokens,
        }),
        signal: controller.signal,
      });
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Groq API responded with status ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      source: 'groq',
      modelName: data.model || GROQ_DEFAULT_MODEL,
    };
  }

  throw new Error('Fallback provider requested');
}

/* =========================================================================
   DIET PLAN & RECIPES (EXACT CALORIE TARGET MATCHING)
   ========================================================================= */

export function computeRealisticMacros(calories, dietType = 'High Protein') {
  const cals = Math.max(50, Number(calories) || 500);

  if (dietType && (dietType.includes('Keto') || dietType.includes('Low Carb'))) {
    const p = Math.round((cals * 0.30) / 4);
    const c = Math.max(5, Math.round((cals * 0.10) / 4));
    const f = Math.max(5, Math.round((cals * 0.60) / 9));
    return { protein: p, carbs: c, fats: f };
  } else if (dietType && (dietType.includes('Balanced') || dietType.includes('Plant'))) {
    const p = Math.round((cals * 0.25) / 4);
    const c = Math.round((cals * 0.50) / 4);
    const f = Math.max(4, Math.round((cals * 0.25) / 9));
    return { protein: p, carbs: c, fats: f };
  } else {
    // High Protein Athletic Split (35% Protein, 45% Carbs, 20% Fats)
    // Physically accurate: (protein*4) + (carbs*4) + (fats*9) equals total calories
    const p = Math.round((cals * 0.35) / 4);
    const c = Math.round((cals * 0.45) / 4);
    const f = Math.max(3, Math.round((cals * 0.20) / 9));
    return { protein: p, carbs: c, fats: f };
  }
}

export function getFallbackDietPlan(dietType = 'High Protein', targetGoal = 2000) {
  const goal = Number(targetGoal) || 2000;
  
  // Exact mathematical split summing up to 100% of goal
  const bCals = Math.round(goal * 0.25);
  const lCals = Math.round(goal * 0.35);
  const dCals = Math.round(goal * 0.30);
  const sCals = Math.max(50, goal - (bCals + lCals + dCals));

  const bMacros = computeRealisticMacros(bCals, dietType);
  const lMacros = computeRealisticMacros(lCals, dietType);
  const dMacros = computeRealisticMacros(dCals, dietType);
  const sMacros = computeRealisticMacros(sCals, dietType);

  const templates = {
    'High Protein': [
      {
        id: 1,
        meal: 'Breakfast',
        title: 'Power Scramble with Spinach, Turkey Bacon & Sourdough',
        calories: bCals,
        protein: bMacros.protein,
        carbs: bMacros.carbs,
        fats: bMacros.fats,
        prepTime: '12 mins',
        ingredients: [
          '4 Liquid Egg Whites + 2 Whole Eggs',
          '2 Slices Lean Turkey Bacon',
          '1 Cup Fresh Baby Spinach',
          '1 Slice Artisan Sourdough Toast',
          '1/2 Tsp Olive Oil & Black Pepper',
        ],
        instructions: [
          'Crisp the turkey bacon in a non-stick skillet over medium heat for 4 mins.',
          'Add baby spinach and let it wilt for 1 minute.',
          'Whisk whole eggs and egg whites, pour into skillet, and gently scramble until fluffy.',
          'Serve warm alongside toasted sourdough bread with cracked black pepper.',
        ],
      },
      {
        id: 2,
        meal: 'Lunch',
        title: 'Grilled Lemon Herb Chicken Bowl with Jasmine Rice & Broccoli',
        calories: lCals,
        protein: lMacros.protein,
        carbs: lMacros.carbs,
        fats: lMacros.fats,
        prepTime: '20 mins',
        ingredients: [
          '200g Lean Chicken Breast',
          '1 Cup Cooked Jasmine Rice',
          '1.5 Cups Steamed Broccoli Florets',
          '1 Tbsp Lemon Juice & 1 Tsp Garlic Olive Oil',
          'Oregano, Sea Salt & Paprika',
        ],
        instructions: [
          'Season chicken breast with oregano, garlic oil, sea salt, paprika, and lemon juice.',
          'Grill or pan-sear on medium-high heat for 6–7 minutes per side until cooked through.',
          'Steam broccoli florets for 4 mins until tender-crisp.',
          'Slice chicken and arrange over warm jasmine rice with broccoli.',
        ],
      },
      {
        id: 3,
        meal: 'Dinner',
        title: 'Pan-Seared Atlantic Salmon with Sweet Potato Mash & Asparagus',
        calories: dCals,
        protein: dMacros.protein,
        carbs: dMacros.carbs,
        fats: dMacros.fats,
        prepTime: '22 mins',
        ingredients: [
          '180g Fresh Salmon Fillet',
          '1 Medium Sweet Potato (Boiled & Mashed)',
          '8-10 Fresh Asparagus Spears',
          '1 Tsp Grass-Fed Butter or Olive Oil',
          'Fresh Dill & Lemon Wedge',
        ],
        instructions: [
          'Peel and boil sweet potato chunks for 12 mins, then mash with a pinch of sea salt.',
          'Season salmon with sea salt, pepper, and fresh dill. Sear in a hot skillet for 4 mins per side.',
          'Sauté asparagus in the pan for 3 mins.',
          'Plate salmon over sweet potato mash with asparagus and fresh lemon.',
        ],
      },
      {
        id: 4,
        meal: 'Snack',
        title: 'Vanilla Whey Isolate Parfait with Blueberries & Almonds',
        calories: sCals,
        protein: sMacros.protein,
        carbs: sMacros.carbs,
        fats: sMacros.fats,
        prepTime: '3 mins',
        ingredients: [
          '1 Scoop Vanilla Whey Isolate',
          '170g 0% Non-Fat Greek Yogurt',
          '50g Fresh Blueberries',
          '10g Sliced Raw Almonds',
        ],
        instructions: [
          'Stir whey isolate powder directly into Greek yogurt until smooth and creamy.',
          'Top with fresh blueberries and crunchy sliced almonds.',
          'Enjoy immediately for high-protein recovery!',
        ],
      },
    ],
  };

  const selectedTemplate = templates[dietType] || templates['High Protein'];
  return selectedTemplate.map((item, idx) => ({ ...item, id: idx + 1 }));
}

/**
 * Fallback alternatives when user regenerates a single meal slot.
 */
function getSingleMealFallback(mealSlot, targetCals, dietType = 'High Protein') {
  const cals = Number(targetCals) || 500;

  const alternates = {
    Breakfast: [
      {
        title: 'High-Protein Fluffy Oat Pancakes with Berry Compote',
        prepTime: '15 mins',
        ingredients: ['50g Rolled Oats (Blended)', '1 Scoop Whey/Plant Isolate', '100g Egg Whites', '1/2 Tsp Cinnamon & Baking Powder', '60g Warm Berries & Zero-Cal Syrup'],
        instructions: ['Blend oats, protein powder, egg whites, and cinnamon until smooth.', 'Cook 2-3 pancakes on a lightly greased non-stick pan over medium heat for 2 mins per side.', 'Warm berries in microwave for 30s and pour over warm pancakes.'],
      },
      {
        title: 'Avocado & Smoked Salmon Sourdough Toast with Poached Eggs',
        prepTime: '10 mins',
        ingredients: ['2 Slices Toasted Sourdough', '50g Smoked Salmon', '1/2 Ripe Avocado (Mashed)', '2 Poached Eggs', 'Everything Bagel Seasoning'],
        instructions: ['Toast sourdough until golden.', 'Spread mashed avocado over bread, layer with smoked salmon, and top with poached eggs and seasoning.'],
      },
      {
        title: 'Overnight Chia Protein Oats with Peanut Butter & Banana',
        prepTime: '5 mins',
        ingredients: ['50g Rolled Oats', '1 Tbsp Chia Seeds', '1 Scoop Vanilla Protein', '1 Tbsp Natural Peanut Butter', '1/2 Sliced Banana & 150ml Almond Milk'],
        instructions: ['Mix oats, chia seeds, protein powder, and almond milk in a jar.', 'Refrigerate overnight (or 2 hours). Top with sliced banana and peanut butter.'],
      },
    ],
    Lunch: [
      {
        title: 'Chipotle Steak Power Bowl with Cilantro Lime Quinoa',
        prepTime: '18 mins',
        ingredients: ['180g Lean Flank Steak (Seared)', '3/4 Cup Cooked Quinoa', '1/3 Cup Black Beans & Fire Roasted Corn', '2 Tbsp Pico de Gallo & 1/4 Avocado'],
        instructions: ['Season steak with cumin, chili powder, and garlic. Sear on high heat for 3 mins per side.', 'Assemble bowl with quinoa, black beans, corn, sliced steak, and pico de gallo.'],
      },
      {
        title: 'Mediterranean Tuna & Chickpea Salad with Feta & Olive Oil',
        prepTime: '8 mins',
        ingredients: ['1 Can White Albacore Tuna in Water', '1/2 Cup Rinsed Chickpeas', 'Diced Cucumbers & Cherry Tomatoes', '30g Crumbled Light Feta', '1 Tbsp Extra Virgin Olive Oil & Lemon'],
        instructions: ['Drain tuna and combine with chickpeas, cucumbers, tomatoes, and feta in a large bowl.', 'Toss with olive oil, fresh lemon juice, oregano, and black pepper.'],
      },
      {
        title: 'Crispy Air-Fried Tofu or Chicken Teriyaki Stir-Fry',
        prepTime: '16 mins',
        ingredients: ['200g Chicken Breast or Extra-Firm Tofu', '1 Cup Jasmine Rice', '1.5 Cups Snap Peas, Bell Peppers & Carrots', '2 Tbsp Low-Sodium Teriyaki Glaze'],
        instructions: ['Cube protein and stir-fry in a hot wok with vegetables for 8 mins.', 'Add teriyaki glaze and toss until glossy. Serve over steamed jasmine rice.'],
      },
    ],
    Dinner: [
      {
        title: 'Lean Beef & Turkey Smash Patties with Baked Sweet Potato Fries',
        prepTime: '20 mins',
        ingredients: ['180g 93/7 Lean Ground Beef or Turkey', '150g Sweet Potato (Cut into Fries)', '1 Sliced Tomato & Lettuce Wraps', '1 Tbsp Light Burger Sauce'],
        instructions: ['Bake sweet potato fries in air fryer at 200°C for 15 mins.', 'Form 2 thin patties, season with salt and pepper, and sear in a smoking hot pan for 2.5 mins per side.', 'Serve with fries and light burger sauce.'],
      },
      {
        title: 'Garlic Butter Shrimp Pasta with Cherry Tomatoes & Zucchini',
        prepTime: '15 mins',
        ingredients: ['200g Peeled Jumbo Shrimp', '75g Protein Pasta or Whole Wheat Penne', '1 Cup Sautéed Zucchini & Cherry Tomatoes', '1 Tbsp Grass-Fed Butter, Minced Garlic & Parsley'],
        instructions: ['Boil pasta until al dente.', 'Sauté garlic and shrimp in butter for 3 mins until pink. Toss in tomatoes, zucchini, and drained pasta.'],
      },
      {
        title: 'Pan-Roasted Halibut with Roasted Asparagus & Lemon Herb Couscous',
        prepTime: '18 mins',
        ingredients: ['180g White Fish Fillet (Halibut / Cod / Sea Bass)', '1/2 Cup Whole Wheat Couscous', '1 Cup Roasted Asparagus Spears', '1 Tbsp Olive Oil, Garlic & Fresh Herbs'],
        instructions: ['Roast asparagus at 200°C for 10 mins.', 'Sear seasoned fish fillet in olive oil for 4 mins per side.', 'Fluff couscous with lemon zest and serve alongside fish and asparagus.'],
      },
    ],
    Snack: [
      {
        title: 'Salted Caramel Rice Cakes with Cottage Cheese & Honey',
        prepTime: '2 mins',
        ingredients: ['2 Salted Brown Rice Cakes', '150g Low-Fat Cottage Cheese', '1 Tsp Pure Honey & Pinch of Cinnamon'],
        instructions: ['Spread cottage cheese evenly over rice cakes.', 'Drizzle with honey and dust with cinnamon.'],
      },
      {
        title: 'Pro-Crunch Greek Yogurt Bowl with Dark Chocolate & Walnuts',
        prepTime: '3 mins',
        ingredients: ['170g 0% Greek Yogurt', '10g 85% Dark Chocolate Chips', '10g Crushed Raw Walnuts', '1 Scoop Whey Isolate'],
        instructions: ['Mix whey isolate into Greek yogurt until thick.', 'Top with dark chocolate chips and crushed walnuts.'],
      },
      {
        title: 'Turkey & Swiss Roll-Ups with Crisp Apple Slices',
        prepTime: '4 mins',
        ingredients: ['4 Slices Deli Smoked Turkey Breast', '1 Slice Light Swiss Cheese', '1 Crisp Honeycrisp Apple (Sliced)', '1 Tsp Dijon Mustard'],
        instructions: ['Roll turkey slices around cheese and apple wedges with a touch of Dijon mustard.'],
      },
    ],
  };

  const pool = alternates[mealSlot] || alternates.Breakfast;
  const picked = pool[Math.floor(Math.random() * pool.length)];

  const realistic = computeRealisticMacros(cals, dietType);

  return {
    meal: mealSlot,
    title: picked.title,
    calories: cals,
    protein: realistic.protein,
    carbs: realistic.carbs,
    fats: realistic.fats,
    prepTime: picked.prepTime,
    ingredients: picked.ingredients,
    instructions: picked.instructions,
  };
}

/**
 * Generates an exact-matched 4-meal daily diet plan.
 */
export async function generateDietPlan({ goal, dietType = 'High Protein' }) {
  const provider = getActiveProvider();
  const targetGoal = Number(goal) || 2000;

  if (provider === 'fallback') {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return {
      plan: getFallbackDietPlan(dietType, targetGoal),
      isMock: true,
      note: 'Generated with local nutrition & culinary recipe database.',
    };
  }

  // Exact target calorie distribution for the 4 daily slots
  const bCals = Math.round(targetGoal * 0.25);
  const lCals = Math.round(targetGoal * 0.35);
  const dCals = Math.round(targetGoal * 0.30);
  const sCals = Math.max(50, targetGoal - (bCals + lCals + dCals));
  const slotTargets = {
    Breakfast: bCals,
    Lunch: lCals,
    Dinner: dCals,
    Snack: sCals,
  };

  // Concise chef prompt to minimize tokens while delivering gourmet recipes
  const systemPrompt = `You are a world-class Olympic Sports Nutritionist & Executive Chef.
Generate a 4-meal daily athlete menu (Breakfast, Lunch, Dinner, Snack).
Total Target: ${targetGoal} kcal (${bCals} Breakfast, ${lCals} Lunch, ${dCals} Dinner, ${sCals} Snack).

CRITICAL CONSTRAINTS TO SAVE TOKENS & ENSURE QUALITY:
1. Provide creative, appetizing meal titles (e.g. "Flame-Grilled Steak & Sweet Potato", "Wild Honey Salmon & Jasmine Rice").
2. 3 to 4 real ingredients per meal with gram weights.
3. 2 concise preparation steps per meal.
4. Output STRICT RAW JSON ONLY. No markdown, no explanations.

Schema:
[
  {
    "id": 1,
    "meal": "Breakfast",
    "title": "Recipe Title",
    "calories": ${bCals},
    "prepTime": "15 mins",
    "ingredients": ["150g Egg Whites", "80g Rolled Oats", "50g Berries"],
    "instructions": ["Cook oats with boiling water.", "Scramble egg whites and serve together."]
  }
]`;

  const userPrompt = `Create an athletic ${dietType} 4-meal menu for ${targetGoal} kcal total. Return JSON array only.`;

  try {
    const res = await callChatCompletions({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.45,
      max_tokens: 850,
    });

    const parsedPlan = cleanJsonOutput(res.content);

    if (Array.isArray(parsedPlan) && parsedPlan.length >= 1) {
      const validSlots = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
      const finalMeals = validSlots.map((slot, idx) => {
        const item = parsedPlan.find((p) => p.meal?.toLowerCase() === slot.toLowerCase()) || parsedPlan[idx] || {};
        const slotCalorieTarget = slotTargets[slot];

        // Mathematically guarantee (Protein * 4) + (Carbs * 4) + (Fats * 9) === slotCalorieTarget
        const macros = computeRealisticMacros(slotCalorieTarget, dietType);

        return {
          id: idx + 1,
          meal: slot,
          title: item.title && item.title.trim().length > 3 ? item.title.trim() : `${dietType} ${slot} Plate`,
          calories: slotCalorieTarget,
          protein: macros.protein,
          carbs: macros.carbs,
          fats: macros.fats,
          prepTime: item.prepTime || '15 mins',
          ingredients:
            Array.isArray(item.ingredients) && item.ingredients.length >= 2
              ? item.ingredients.slice(0, 5)
              : [
                  `${Math.round(slotCalorieTarget * 0.35)}g Fresh Protein Source`,
                  `${Math.round(slotCalorieTarget * 0.30)}g Complex Carbohydrates`,
                  '1 serving fresh vegetables / greens',
                ],
          instructions:
            Array.isArray(item.instructions) && item.instructions.length >= 2
              ? item.instructions.slice(0, 3)
              : [
                  'Portion and season ingredients with sea salt & pepper.',
                  'Cook over medium-high heat until done.',
                  'Plate and enjoy fresh.',
                ],
        };
      });

      return { plan: finalMeals, isMock: false, source: res.source, modelName: res.modelName };
    } else {
      throw new Error('AI output was not formatted as a valid JSON array.');
    }
  } catch (error) {
    console.warn('AI Diet Plan generation error, using fallback:', error.message);
    return { plan: getFallbackDietPlan(dietType, targetGoal), isMock: true, error: error.message };
  }
}

/**
 * Regenerates ONLY ONE single meal slot (e.g. "Breakfast") matching exact target calories.
 */
export async function regenerateSingleMeal({ mealSlot, targetCalories, dietType = 'High Protein' }) {
  const provider = getActiveProvider();
  const cals = Number(targetCalories) || 500;

  if (provider === 'fallback') {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return {
      meal: getSingleMealFallback(mealSlot, cals, dietType),
      isMock: true,
    };
  }

  const systemPrompt = `You are an executive fitness chef and sports nutritionist. Generate an alternative high-protein recipe specifically for "${mealSlot}" adhering to "${dietType}".
IMPORTANT: The calories for this meal must equal EXACTLY ${cals} kcal.
Output STRICT RAW JSON ONLY for a SINGLE object.
Schema:
{
  "meal": "${mealSlot}",
  "title": "Creative Recipe Title",
  "calories": ${cals},
  "protein": 40,
  "carbs": 45,
  "fats": 12,
  "prepTime": "15 mins",
  "ingredients": ["100g Ingredient A", "200g Ingredient B"],
  "instructions": ["Step 1...", "Step 2..."]
}`;

  const userPrompt = `Generate an alternative ${dietType} recipe for ${mealSlot} with exactly ${cals} kcal. Output JSON object only.`;

  try {
    const res = await callChatCompletions({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 480,
    });

    const parsed = cleanJsonOutput(res.content);

    if (parsed && parsed.title) {
      const macros = computeRealisticMacros(cals, dietType);
      return {
        meal: {
          meal: mealSlot,
          title: parsed.title,
          calories: cals, // enforce exact match
          protein: macros.protein,
          carbs: macros.carbs,
          fats: macros.fats,
          prepTime: parsed.prepTime || '15 mins',
          ingredients: Array.isArray(parsed.ingredients) && parsed.ingredients.length > 0 ? parsed.ingredients : ['High quality protein', 'Complex carbs', 'Healthy fats'],
          instructions: Array.isArray(parsed.instructions) && parsed.instructions.length > 0 ? parsed.instructions : ['Prepare ingredients.', 'Cook until golden.', 'Serve warm.'],
        },
        isMock: false,
      };
    } else {
      throw new Error('Could not parse single meal JSON.');
    }
  } catch (err) {
    console.warn('Single meal regeneration error, using alternate fallback:', err.message);
    return {
      meal: getSingleMealFallback(mealSlot, cals, dietType),
      isMock: true,
    };
  }
}

/**
 * Generates a full recipe from custom user ingredients / cravings / prompt
 */
export async function generateCustomMealFromPrompt({ promptText, mealSlot = 'Lunch', targetCalories = 500, dietType = 'High Protein' }) {
  const provider = getActiveProvider();
  const cals = Number(targetCalories) || 500;
  const userCravings = (promptText || '').trim();

  if (provider === 'fallback') {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const realistic = computeRealisticMacros(cals, dietType);
    return {
      meal: {
        id: `custom_${Date.now()}`,
        meal: mealSlot,
        title: userCravings ? `Chef's ${userCravings.slice(0, 35)}` : `${dietType} Power Plate`,
        calories: cals,
        protein: realistic.protein,
        carbs: realistic.carbs,
        fats: realistic.fats,
        prepTime: '15 mins',
        ingredients: [userCravings || 'High quality protein source', 'Fibrous leafy greens', 'Healthy fats (olive oil / avocado)'],
        instructions: ['Measure fresh ingredients.', 'Cook protein and veggies over medium heat.', 'Garnish and serve fresh.'],
      },
      isMock: true,
    };
  }

  const systemPrompt = `You are an elite sports chef. Generate a delicious athletic recipe for ${mealSlot} tailored to "${dietType}".
Target Calories: EXACTLY ${cals} kcal.
Cravings/Ingredients to incorporate: "${userCravings}".

CONCISE FORMAT TO SAVE TOKENS:
- 3 to 4 real ingredients with gram weights.
- 2 brief prep instructions.
Output RAW JSON ONLY.

Schema:
{
  "title": "Creative Recipe Title",
  "prepTime": "15 mins",
  "ingredients": ["150g Chicken", "100g Rice", "80g Asparagus"],
  "instructions": ["Season and sear protein.", "Assemble with carbs & greens."]
}`;

  const userPrompt = `Create a ${cals} kcal recipe for ${mealSlot} featuring: "${userCravings}". Return RAW JSON ONLY.`;

  try {
    const res = await callChatCompletions({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 480,
    });

    const parsed = cleanJsonOutput(res.content);

    if (parsed && parsed.title) {
      const macros = computeRealisticMacros(cals, dietType);
      return {
        meal: {
          id: `custom_${Date.now()}`,
          meal: mealSlot,
          title: parsed.title,
          calories: cals,
          protein: macros.protein,
          carbs: macros.carbs,
          fats: macros.fats,
          prepTime: typeof parsed.prepTime === 'number' ? `${parsed.prepTime} mins` : (parsed.prepTime || '15 mins'),
          ingredients: Array.isArray(parsed.ingredients) && parsed.ingredients.length > 0 ? parsed.ingredients : ['High quality protein', 'Complex carbs', 'Healthy fats'],
          instructions: Array.isArray(parsed.instructions) && parsed.instructions.length > 0 ? parsed.instructions : ['Prep ingredients.', 'Cook until golden.', 'Serve warm.'],
        },
        isMock: false,
        source: res.source,
        modelName: res.modelName,
      };
    } else {
      throw new Error('Could not parse custom recipe JSON.');
    }
  } catch (err) {
    console.warn('Custom meal generation error, fallback triggered:', err.message);
    const macros = computeRealisticMacros(cals, dietType);
    return {
      meal: {
        id: `custom_${Date.now()}`,
        meal: mealSlot,
        title: userCravings ? `Custom ${userCravings.slice(0, 30)}` : 'Healthy Power Plate',
        calories: cals,
        protein: macros.protein,
        carbs: macros.carbs,
        fats: macros.fats,
        prepTime: '15 mins',
        ingredients: [userCravings, '100g Brown Rice', '1 tbsp Extra Virgin Olive Oil'],
        instructions: ['Prep ingredients.', 'Cook over medium heat.', 'Serve hot.'],
      },
      isMock: true,
    };
  }
}

/* =========================================================================
   DETAILED SPORT WORKOUT GENERATION (WITH SETS, REPS & EXERCISES)
   ========================================================================= */

function buildExerciseSets(numSets, repsDefault, defaultWeight = '') {
  const count = parseInt(numSets, 10) || 3;
  return Array.from({ length: count }, (_, idx) => ({
    setNumber: idx + 1,
    weight: defaultWeight,
    reps: repsDefault,
    completed: false,
  }));
}

function getFallbackSportWorkout({ sport = 'weightlifting', goal = 'strength', duration = 45, level = 'intermediate' }) {
  const sportKey = sport.toLowerCase();

  const workouts = {
    tennis: {
      title: 'Pro Footwork, Rotational Power & Serve Agility',
      estCalories: Math.round(duration * 9.5),
      focus: 'Lateral speed, split-step reactivity, shoulder stability & core rotation',
      exercises: [
        { id: 't1', name: 'Hexagon Agility Ball Toss & Sprint Recovery', category: 'Footwork', notes: 'Explosive split-step', sets: buildExerciseSets(4, '30s on / 30s off', 'Bodyweight') },
        { id: 't2', name: 'Medicine Ball Rotational Forehand/Backhand Throws', category: 'Rotational Power', notes: 'Hip drive through core', sets: buildExerciseSets(4, '10 reps/side', '6 kg') },
        { id: 't3', name: 'Deep Forehand to Volley Transition Sprints', category: 'Court Speed', notes: 'Racquet prep high', sets: buildExerciseSets(4, '45s work', 'Court') },
        { id: 't4', name: 'Overhead Serve Deceleration Pulls', category: 'Shoulder Armor', notes: 'Eccentric rotator cuff control', sets: buildExerciseSets(3, '12 reps', 'Band') },
        { id: 't5', name: 'Lateral Shuffle with Band Resistance', category: 'Agility', notes: 'Low center of gravity', sets: buildExerciseSets(3, '20 reps', 'Medium Band') },
      ],
    },
    weightlifting: {
      title: 'Compound Strength & Hypertrophy Protocol',
      estCalories: Math.round(duration * 8.0),
      focus: 'Mechanical tension, progressive overload & compound joint integrity',
      exercises: [
        { id: 'w1', name: 'Barbell Back Squat', category: 'Quads & Glutes', notes: 'RPE 8, 2s eccentric pause', sets: buildExerciseSets(4, '6-8 reps', '80 kg') },
        { id: 'w2', name: 'Incline Dumbbell Bench Press', category: 'Chest & Shoulders', notes: 'Full stretch at bottom', sets: buildExerciseSets(4, '8-10 reps', '28 kg') },
        { id: 'w3', name: 'Chest-Supported T-Bar Row', category: 'Upper Back', notes: '1s peak contraction', sets: buildExerciseSets(4, '10-12 reps', '45 kg') },
        { id: 'w4', name: 'Romanian Deadlifts (Dumbbell or Barbell)', category: 'Hamstrings', notes: 'Hips back, neutral spine', sets: buildExerciseSets(3, '10 reps', '60 kg') },
        { id: 'w5', name: 'Hanging Leg Raises & Triceps Pushdowns', category: 'Arms & Core', notes: 'Strict control, no swinging', sets: buildExerciseSets(3, '15 reps', '15 kg') },
      ],
    },
    running: {
      title: 'VO2 Max Threshold & Speed Interval Protocol',
      estCalories: Math.round(duration * 11.2),
      focus: 'Lactate threshold buffering, turnover cadence (175+ spm) & aerobic power',
      exercises: [
        { id: 'r1', name: 'Progressive Dynamic Strides & Drills', category: 'Warmup Strides', notes: 'Build to 90% top speed', sets: buildExerciseSets(4, '60m stride', 'Cadence') },
        { id: 'r2', name: '800m Hard Intervals @ 5k Goal Pace', category: 'VO2 Max', notes: '90s walking recovery between sets', sets: buildExerciseSets(5, '800m run', 'Pace: 4:00/km') },
        { id: 'r3', name: '200m Flying Speed Repeats', category: 'Speed Power', notes: 'Max turnover cadence', sets: buildExerciseSets(4, '200m sprint', '95% Effort') },
        { id: 'r4', name: 'Zone 2 Steady Aerobic Flush', category: 'Aerobic Base', notes: 'Easy conversational nasal breathing', sets: buildExerciseSets(1, '10 mins', 'Easy Pace') },
      ],
    },
    mma: {
      title: 'Championship 5-Round Combat Conditioning',
      estCalories: Math.round(duration * 12.0),
      focus: 'Striking explosiveness, sprawl reactivity, clinch isometric stamina & recovery',
      exercises: [
        { id: 'm1', name: 'Round 1: Heavy Bag Punch-Kick Combos + Sprawl Every 30s', category: 'Striking', notes: 'Keep guard high, snap punches', sets: buildExerciseSets(1, '5 mins', 'Heavy Bag') },
        { id: 'm2', name: 'Round 2: Clinch Knees, Wall Walks & Dumbbell Uppercuts', category: 'Clinch & Wrestling', notes: 'High volume output', sets: buildExerciseSets(1, '5 mins', '8 kg DB') },
        { id: 'm3', name: 'Round 3: Slam Ball Ground & Pound + Sprawls', category: 'Ground Game', notes: 'Explosive hip extension', sets: buildExerciseSets(1, '5 mins', '10 kg Ball') },
        { id: 'm4', name: 'Round 4: High-Cadence 1-2 Resistance Band Boxing', category: 'Speed Endurance', notes: 'Continuous rapid output', sets: buildExerciseSets(1, '5 mins', 'Band') },
        { id: 'm5', name: 'Round 5: Iron Heart Tabata Burnout (Burpees + Shadowbox)', category: 'Championship Round', notes: '20s max effort / 10s rest', sets: buildExerciseSets(8, '20s on / 10s off', 'Bodyweight') },
      ],
    },
  };

  const matched = workouts[sportKey] || workouts['weightlifting'];
  return { sport, goal, duration, level, ...matched };
}

export async function generateSportWorkout({ sport = 'weightlifting', goal = 'strength', duration = 45, level = 'intermediate' }) {
  const provider = getActiveProvider();

  if (provider === 'fallback') {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return {
      workout: getFallbackSportWorkout({ sport, goal, duration, level }),
      isMock: true,
      note: 'Generated with local athletic training database.',
    };
  }

  const systemPrompt = `You are an elite strength & conditioning coach. Generate a training session for sport: "${sport}", goal: "${goal}", duration: "${duration} minutes", level: "${level}".
Output STRICT RAW JSON ONLY.
JSON Object Schema:
{
  "title": "Workout Title",
  "estCalories": 420,
  "focus": "Key physiological focus",
  "exercises": [
    {
      "id": "e1",
      "name": "Barbell Back Squat",
      "category": "Lower Body",
      "notes": "RPE 8, pause at bottom",
      "sets": [
        {"setNumber": 1, "weight": "80 kg", "reps": "8", "completed": false},
        {"setNumber": 2, "weight": "80 kg", "reps": "8", "completed": false}
      ]
    }
  ]
}`;

  const userPrompt = `Generate a ${duration} min ${level} workout for ${sport} targeting ${goal}. Return JSON only.`;

  try {
    const res = await callChatCompletions({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.35,
      max_tokens: 950,
    });

    const parsed = cleanJsonOutput(res.content);

    if (parsed && parsed.title && Array.isArray(parsed.exercises)) {
      return {
        workout: {
          sport,
          goal,
          duration,
          level,
          title: parsed.title,
          estCalories: parsed.estCalories || Math.round(duration * 9),
          focus: parsed.focus || `${sport} specific training`,
          exercises: parsed.exercises,
        },
        isMock: false,
        source: res.source,
        modelName: res.modelName,
      };
    } else {
      throw new Error('AI workout format invalid.');
    }
  } catch (error) {
    console.warn('Sport workout generation error, falling back:', error.message);
    return {
      workout: getFallbackSportWorkout({ sport, goal, duration, level }),
      isMock: true,
      error: error.message,
    };
  }
}

/* =========================================================================
   WEEKLY TRAINING SCHEDULE BUILDER (WITH EXERCISES & REPS)
   ========================================================================= */

function getFallbackWeeklySchedule({ sport = 'weightlifting', goal = 'strength', daysPerWeek = 4, level = 'intermediate' }) {
  const sportKey = sport.toLowerCase();

  const programTitles = {
    tennis: '🎾 4-Day Tennis Pro Agility & Rotational Power Split',
    weightlifting: '🏋️‍♂️ 4-Day Upper / Lower Heavy Strength & Hypertrophy',
    running: '🏃‍♂️ 4-Day VO2 Max & Lactate Threshold Running Engine',
    mma: '🥊 4-Day Championship Combat Conditioning & Grappling',
  };

  const schedules = {
    tennis: [
      {
        day: 'Monday',
        title: 'Agility, Split-Step & On-Court Footwork',
        focus: 'Lateral speed & court transitions',
        duration: '50m',
        type: 'Court Agility',
        exercises: [
          { name: 'Hexagon Footwork Ball Toss Drill', sets: '4 sets', reps: '30s work / 30s rest', notes: 'Split-step cadence' },
          { name: 'Lateral Shuffles with Resistance Band', sets: '4 sets', reps: '15 reps each way', notes: 'Low center of gravity' },
          { name: 'Split-Step Reaction Ball Catch', sets: '3 sets', reps: '20 catches', notes: 'Fast twitch reflexes' },
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
          { name: 'Cable Woodchoppers & Core Anti-Rotation', sets: '3 sets', reps: '12 reps/side', notes: '15kg' },
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
          { name: 'Foam Rolling (IT Band, Quads, Lats)', sets: '1 set', reps: '10 mins', notes: 'Deep tissue flush' },
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
          { name: 'Dumbbell Jump Squats', sets: '3 sets', reps: '8 reps', notes: '10kg dumbbells' },
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
          { name: 'Serve & Volley Rapid Transition Points', sets: '4 sets', reps: '10 points', notes: 'Aggressive net rush' },
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
          { name: 'Single-Leg Bulgarian Split Squats', sets: '3 sets', reps: '10 reps/leg', notes: '12kg dumbbells' },
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
    weightlifting: [
      {
        day: 'Monday',
        title: 'Upper Body Heavy Push & Horizontal Pull',
        focus: 'Bench press, heavy rows, overhead pressing',
        duration: '55m',
        type: 'Strength',
        exercises: [
          { name: 'Barbell Bench Press', sets: '4 sets', reps: '6-8 reps', notes: '80kg, 2s pause' },
          { name: 'Chest-Supported Incline Row', sets: '4 sets', reps: '8-10 reps', notes: '40kg, peak squeeze' },
          { name: 'Seated Dumbbell Shoulder Press', sets: '3 sets', reps: '10 reps', notes: '22kg per dumbbell' },
          { name: 'Triceps Rope Pushdowns & Face Pulls', sets: '3 supersets', reps: '12 reps', notes: 'Strict form' },
        ],
      },
      {
        day: 'Tuesday',
        title: 'Lower Body Quad & Core Dominant',
        focus: 'Squat pattern, Bulgarian split squats, leg press',
        duration: '60m',
        type: 'Hypertrophy',
        exercises: [
          { name: 'Barbell Back Squat', sets: '4 sets', reps: '6-8 reps', notes: '100kg, deep depth' },
          { name: 'Bulgarian Split Squats (Dumbbell)', sets: '3 sets', reps: '10 reps/leg', notes: '18kg dumbbells' },
          { name: 'Leg Press & Standing Calf Raises', sets: '4 sets', reps: '12 reps / 15 reps', notes: 'Full stretch' },
          { name: 'Hanging Leg Raises', sets: '3 sets', reps: '15 reps', notes: 'Strict core flexion' },
        ],
      },
      {
        day: 'Wednesday',
        title: 'Active Recovery & Thoracic Mobility',
        focus: 'Band pull-aparts, hip openers, 20m light walk',
        duration: '30m',
        type: 'Recovery',
        exercises: [
          { name: 'Band Pull-Aparts & Shoulder Dislocates', sets: '3 sets', reps: '20 reps', notes: 'Posture reset' },
          { name: 'Couch Stretch & World’s Greatest Stretch', sets: '3 sets', reps: '60s per side', notes: 'Hip flexor release' },
        ],
      },
      {
        day: 'Thursday',
        title: 'Upper Body Hypertrophy & Arms/Shoulders',
        focus: 'Incline dumbbell, lat pulldowns, lateral raises',
        duration: '50m',
        type: 'Hypertrophy',
        exercises: [
          { name: 'Incline Dumbbell Bench Press', sets: '4 sets', reps: '8-10 reps', notes: '30kg dumbbells' },
          { name: 'Wide Grip Lat Pulldown', sets: '4 sets', reps: '10-12 reps', notes: '65kg' },
          { name: 'Dumbbell Lateral Raises', sets: '4 sets', reps: '12-15 reps', notes: '10kg, strict' },
          { name: 'Incline Bicep Curls & Skull Crushers', sets: '3 supersets', reps: '12 reps', notes: 'Arms burnout' },
        ],
      },
      {
        day: 'Friday',
        title: 'Posterior Chain & Deadlift Power',
        focus: 'Deadlifts, Romanian deadlifts, hamstring curls',
        duration: '55m',
        type: 'Strength',
        exercises: [
          { name: 'Conventional Barbell Deadlift (or Trap Bar)', sets: '4 sets', reps: '5 reps', notes: '120kg, explosive drive' },
          { name: 'Romanian Deadlifts (RDL)', sets: '3 sets', reps: '8-10 reps', notes: '80kg, hamstring stretch' },
          { name: 'Lying Hamstring Curls & Glute Bridges', sets: '4 sets', reps: '12 reps', notes: 'Peak contraction' },
        ],
      },
      {
        day: 'Saturday',
        title: 'Athletic Conditioning & Core Finisher',
        focus: 'Farmer carries, kettlebell swings, ab wheel',
        duration: '40m',
        type: 'Conditioning',
        exercises: [
          { name: 'Heavy Dumbbell Farmer Carries', sets: '4 sets', reps: '40 meters', notes: '32kg per hand' },
          { name: 'Kettlebell Swings (Hip Hinge Power)', sets: '4 sets', reps: '15 swings', notes: '24kg kettlebell' },
          { name: 'Ab Wheel Rollouts', sets: '3 sets', reps: '12 reps', notes: 'Core brace' },
        ],
      },
      {
        day: 'Sunday',
        title: 'Complete Rest & Muscle Repair',
        focus: 'High protein intake, sleep optimization',
        duration: '0m',
        type: 'Rest',
        exercises: [],
      },
    ],
    running: [
      {
        day: 'Monday',
        title: 'Zone 2 Base Aerobic Foundation',
        focus: 'Conversational pace to build mitochondrial density',
        duration: '45m',
        type: 'Aerobic Base',
        exercises: [
          { name: 'Continuous Zone 2 Easy Run', sets: '1 set', reps: '45 mins', notes: 'Heart Rate: 130-145 bpm' },
        ],
      },
      {
        day: 'Tuesday',
        title: 'Track Speed & Lactate Threshold Intervals',
        focus: '800m repeats @ 5k pace with recovery jogs',
        duration: '50m',
        type: 'Speed Work',
        exercises: [
          { name: '800m Track Intervals', sets: '5 repeats', reps: '800m run / 90s jog', notes: 'Target 3:15 per 800m' },
          { name: '200m Flying Sprints', sets: '4 sets', reps: '200m', notes: 'Cadence turnover' },
        ],
      },
      {
        day: 'Wednesday',
        title: 'Runner Mobility & Core Stability',
        focus: 'Single leg balance, glute medius activation',
        duration: '30m',
        type: 'Recovery',
        exercises: [
          { name: 'Single-Leg Runner Step-Ups', sets: '3 sets', reps: '12 reps/leg', notes: 'Bodyweight' },
          { name: 'Side Plank Clamshells & Calf Raises', sets: '3 sets', reps: '15 reps', notes: 'Ankle strength' },
        ],
      },
      {
        day: 'Thursday',
        title: 'Tempo Run & Cadence Optimization',
        focus: 'Sustained sub-threshold pace, 175+ SPM',
        duration: '45m',
        type: 'Tempo',
        exercises: [
          { name: 'Sustained Tempo Run Block', sets: '1 set', reps: '25 mins @ Tempo', notes: 'Lactate threshold' },
        ],
      },
      {
        day: 'Friday',
        title: 'Strength for Runners (Injury Prevention)',
        focus: 'Step-ups, calf raises, hamstring bridges',
        duration: '40m',
        type: 'Strength',
        exercises: [
          { name: 'Goblet Squats & Walking Lunges', sets: '3 sets', reps: '12 reps', notes: '16kg' },
          { name: 'Standing Single-Leg Calf Raises', sets: '4 sets', reps: '15 reps/leg', notes: 'Achilles armor' },
        ],
      },
      {
        day: 'Saturday',
        title: 'Long Aerobic Distance Run',
        focus: 'Aerobic capacity, hydration pacing & mental endurance',
        duration: '75m',
        type: 'Long Run',
        exercises: [
          { name: 'Long Aerobic Continuous Run', sets: '1 set', reps: '75 mins', notes: 'Zone 2 steady' },
        ],
      },
      {
        day: 'Sunday',
        title: 'Active Walking & Rest',
        focus: 'Deep leg elevation, hydration & tissue recovery',
        duration: '0m',
        type: 'Rest',
        exercises: [],
      },
    ],
    mma: [
      {
        day: 'Monday',
        title: 'Striking Power & Head Movement Conditioning',
        focus: 'Heavy bag rounds, jab-cross power & slip drills',
        duration: '55m',
        type: 'Striking',
        exercises: [
          { name: 'Heavy Bag 5x3min Punch-Kick Combos', sets: '5 rounds', reps: '3 min rounds / 1m rest', notes: 'High output' },
          { name: 'Slip Rope & Head Movement Shadowboxing', sets: '3 rounds', reps: '3 mins', notes: 'Level changes' },
        ],
      },
      {
        day: 'Tuesday',
        title: 'Wrestling Takedowns, Sprawls & Scramble Stamina',
        focus: 'Chain wrestling conditioning & wall defense',
        duration: '60m',
        type: 'Grappling',
        exercises: [
          { name: 'Double Leg Penetration Steps & Sprawls', sets: '5 sets', reps: '20 reps continuous', notes: 'Hip explosion' },
          { name: 'Wall Walks & Pummeling Isometric Hold', sets: '4 sets', reps: '60s hold', notes: 'Clinch power' },
        ],
      },
      {
        day: 'Wednesday',
        title: 'Active Recovery, Neck & Joint Mobility',
        focus: 'Band neck flexion, wrist care, sauna / cold flush',
        duration: '35m',
        type: 'Recovery',
        exercises: [
          { name: '4-Way Band Neck Flexion', sets: '3 sets', reps: '15 reps each way', notes: 'Concussion armor' },
          { name: 'Wrist & Ankle Flow', sets: '1 set', reps: '15 mins', notes: 'Joint mobility' },
        ],
      },
      {
        day: 'Thursday',
        title: 'Clinch Work, Isometric Stamina & Ground & Pound',
        focus: 'Knee strikes, heavy bag transitions & core brace',
        duration: '50m',
        type: 'MMA Circuits',
        exercises: [
          { name: 'Slam Ball Ground & Pound Transitions', sets: '4 sets', reps: '90s work', notes: '12kg ball' },
          { name: 'Thai Clinch Heavy Bag Knees', sets: '4 sets', reps: '50 knees', notes: 'Full hip drive' },
        ],
      },
      {
        day: 'Friday',
        title: 'Championship 5x5min Round Simulation',
        focus: 'Lactate tolerance, heart rate recovery between rounds',
        duration: '50m',
        type: 'Conditioning',
        exercises: [
          { name: 'Championship Circuit (Bag + Sprawls + Airdyne Bike)', sets: '5 rounds', reps: '5 mins work / 1m rest', notes: 'Max anaerobic threshold' },
        ],
      },
      {
        day: 'Saturday',
        title: 'Strength & Explosive Hip Power',
        focus: 'Trap bar jumps, landmine punches, sled pushes',
        duration: '45m',
        type: 'S&C',
        exercises: [
          { name: 'Trap Bar Jumps & Landmine Punches', sets: '4 sets', reps: '5 jumps / 8 punches', notes: 'Rotational power' },
          { name: 'Heavy Sled Pushes', sets: '5 sets', reps: '25 meters', notes: 'Max drive' },
        ],
      },
      {
        day: 'Sunday',
        title: 'Full Rest & Recovery Protocol',
        focus: 'Calorie refuel, recovery sleep & mental visualization',
        duration: '0m',
        type: 'Rest',
        exercises: [],
      },
    ],
  };

  const defaultSchedule = schedules[sportKey] || schedules['weightlifting'];

  // Calibrate active workout days to match requested daysPerWeek
  const activePatternByDays = {
    2: [0, 3], // Mon, Thu
    3: [0, 2, 4], // Mon, Wed, Fri
    4: [0, 1, 3, 4], // Mon, Tue, Thu, Fri
    5: [0, 1, 2, 4, 5], // Mon, Tue, Wed, Fri, Sat
    6: [0, 1, 2, 3, 4, 5], // Mon through Sat
    7: [0, 1, 2, 3, 4, 5, 6],
  };
  const activeDays = activePatternByDays[daysPerWeek] || [0, 1, 3, 4];

  const calibratedSchedule = defaultSchedule.map((item, index) => {
    if (!activeDays.includes(index)) {
      return {
        ...item,
        title: 'Rest & Athletic Recovery',
        focus: 'Active recovery, hydration, mobility & tissue repair',
        duration: '0m',
        type: 'Rest',
        exercises: [],
      };
    }
    return item;
  });

  return {
    programTitle: programTitles[sportKey] || `${sport} Athletic Protocol`,
    sport,
    goal,
    daysPerWeek,
    level,
    schedule: calibratedSchedule,
  };
}

export async function generateWeeklySchedule({ sport = 'weightlifting', goal = 'strength', daysPerWeek = 4, level = 'intermediate' }) {
  const provider = getActiveProvider();

  if (provider === 'fallback') {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return {
      schedule: getFallbackWeeklySchedule({ sport, goal, daysPerWeek, level }),
      isMock: true,
      note: 'Generated with localized athletic periodization algorithms.',
    };
  }

  const systemPrompt = `You are a world-class athletic performance director. Create a 7-day weekly training schedule (Monday to Sunday) for sport "${sport}", goal "${goal}", training ${daysPerWeek} active days/week, level "${level}".
Output STRICT RAW JSON ONLY.
Schema:
{
  "programTitle": "${sport} Periodized Split",
  "sport": "${sport}",
  "goal": "${goal}",
  "daysPerWeek": ${daysPerWeek},
  "level": "${level}",
  "schedule": [
    {
      "day": "Monday",
      "title": "Upper Body Strength",
      "focus": "Bench & Row power",
      "duration": "50m",
      "type": "Strength",
      "exercises": [
        {"name": "Barbell Bench Press", "sets": "4 sets", "reps": "6-8 reps", "notes": "80kg"}
      ]
    }
  ]
}`;

  const userPrompt = `Build a 7-day periodized ${daysPerWeek}-day schedule for ${sport} targeting ${goal} with exact exercises, sets, reps. Return JSON only.`;

  try {
    const res = await callChatCompletions({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.35,
      max_tokens: 1000,
    });

    const parsed = cleanJsonOutput(res.content);

    if (parsed && Array.isArray(parsed.schedule) && parsed.schedule.length === 7) {
      return {
        schedule: parsed,
        isMock: false,
        source: res.source,
        modelName: res.modelName,
      };
    } else {
      throw new Error('AI schedule format invalid.');
    }
  } catch (error) {
    console.warn('Weekly schedule error, falling back:', error.message);
    return {
      schedule: getFallbackWeeklySchedule({ sport, goal, daysPerWeek, level }),
      isMock: true,
      error: error.message,
    };
  }
}

/* =========================================================================
   AI COACH
   ========================================================================= */

export async function askNutritionistCoach({ question, context }) {
  const provider = getActiveProvider();
  const {
    goal = 2000,
    totalConsumed = 0,
    totalBurned = 0,
    remainingCalories = 2000,
    meals = [],
    workouts = [],
    sport = 'Weightlifting',
    trainingGoal = 'Strength & Muscle',
  } = context || {};

  if (provider === 'fallback') {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return {
      reply: getContextualCoachFallback(question, context),
      isMock: true,
      note: 'Using local AI coach rules.',
    };
  }

  const mealsSummary = meals.length > 0
    ? meals.map((m) => `- ${m.name} (${m.calories} kcal at ${m.time})`).join('\n')
    : 'No meals logged yet today.';

  const workoutsSummary = workouts.length > 0
    ? workouts.map((w) => {
        const exCount = w.exercises ? w.exercises.length : 0;
        return `- ${w.sport}: ${w.title || w.name} (${w.duration}m, ~${w.caloriesBurned} kcal burned, ${exCount} exercises logged)`;
      }).join('\n')
    : 'No workouts completed yet today.';

  const systemPrompt = `You are "Coach Lock", an elite Sports Nutritionist & Athletic Conditioning Coach.
The user is training for "${sport}" with primary goal "${trainingGoal}".

Live User Profile Today:
- Calorie Budget: Target: ${goal} kcal | Food Consumed: ${totalConsumed} kcal | Exercise Burned: ${totalBurned} kcal | Net Remaining: ${remainingCalories} kcal
- Workouts Today:
${workoutsSummary}
- Meals Today:
${mealsSummary}

Guidelines:
1. Provide sharp, science-backed athletic and nutritional guidance tailored to their sport (${sport}) and current energy balance.
2. If they ask about workouts, drills, sets, reps, or recovery, provide exact numbers and protocols.
3. If they ask about meals/recipes, give specific ingredients and prep instructions.
4. Format with clean bold headers and concise bullet points.`;

  const userPrompt = question || 'Give me coaching advice based on my current stats.';

  try {
    const res = await callChatCompletions({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 800,
    });

    return {
      reply: res.content.trim() || 'Could not retrieve advice at this moment.',
      isMock: false,
      source: res.source,
      modelName: res.modelName,
    };
  } catch (error) {
    console.warn('AI Coach error, fallback triggered:', error.message);
    return {
      reply: getContextualCoachFallback(question, context),
      isMock: true,
      error: error.message,
    };
  }
}

function getContextualCoachFallback(question, context) {
  const q = (question || '').toLowerCase();
  const {
    goal = 2000,
    totalConsumed = 0,
    totalBurned = 0,
    remainingCalories = 2000,
    meals = [],
    workouts = [],
    sport = 'Weightlifting',
  } = context || {};

  if (q.includes('tennis')) {
    return `### 🎾 Tennis Athletic & Fueling Protocol
• **On-Court Performance**: Match play requires fast-twitch rotational power and explosive deceleration.
• **Pre-Match Fueling**: 40-50g fast-digesting carbs 45 mins prior (e.g. banana + rice cakes + electrolyte water).
• **Key Training Drill**: Medicine Ball Lateral Tosses (4x8 reps/side) paired with Hexagon split-step footwork.
• **Recovery Status**: You have burned **${totalBurned} kcal** today. Rehydrate with sodium + potassium!`;
  }

  if (q.includes('mma') || q.includes('fighting') || q.includes('combat')) {
    return `### 🥊 Combat Sports Conditioning Strategy
• **Energy Systems**: MMA requires high aerobic capacity (Zone 2) to buffer intense anaerobic 5-minute championship rounds.
• **Grip & Scramble Stamina**: Integrate Farmer Carries (4 x 40m heavy) and Sandbag Bear Hug Cleans.
• **Fueling for Sparring**: Keep carbs high on sparring days (~3g/kg) to maintain cognitive reaction time and power output.
• **Daily Status**: **${workouts.length} workout(s)** logged today. Ensure adequate magnesium and sleep tonight!`;
  }

  if (q.includes('running') || q.includes('5k') || q.includes('marathon')) {
    return `### 🏃‍♂️ Running Engine & Pace Strategy
• **Cadence Target**: Aim for 170–180 strides per minute to reduce ground contact time and knee stress.
• **Zone 2 Ratio**: 80% of your weekly volume should be easy conversational pace, 20% high-intensity interval speed.
• **Post-Run Refuel**: 3:1 Carb-to-Protein ratio within 45 minutes of finishing long runs.
• **Remaining Room**: You have **${remainingCalories} kcal** left to support muscle glycogen synthesis!`;
  }

  return `### 🎯 LockedIn Athletic Insights
• **Daily Status**: **${totalConsumed} kcal consumed** vs **${totalBurned} kcal burned** (${remainingCalories} kcal net remaining).
• **Sport Focus**: **${sport}**.
• **Logged**: **${meals.length} meals** & **${workouts.length} workouts** today.
• Ask me about sport drills, pre-workout nutrition, recovery routines, or weekly periodization!`;
}

/**
 * Generates a full 7-day periodized program from a free-text custom user prompt.
 */
export async function generateWeeklyScheduleFromPrompt({ promptText, defaultSport = 'weightlifting', daysPerWeek = 4 }) {
  const provider = getActiveProvider();
  const cleanPrompt = (promptText || '').trim();

  if (provider === 'fallback') {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return {
      schedule: getFallbackWeeklySchedule({
        sport: defaultSport,
        goal: cleanPrompt.slice(0, 30) || 'Custom Training',
        daysPerWeek,
        level: 'Intermediate',
      }),
      isMock: true,
      note: 'Built with local periodization algorithm.',
    };
  }

  const systemPrompt = `You are a world-class strength & athletic conditioning director.
The user wants a customized 7-day training schedule (Monday to Sunday) with EXACTLY ${daysPerWeek} active workout days and ${7 - daysPerWeek} rest/recovery days based on their request.
Create a complete 7-day schedule adhering to their prompt and frequency.
Output STRICT RAW JSON ONLY. No markdown formatting.
Schema:
{
  "programTitle": "Creative Program Title based on user prompt",
  "sport": "${defaultSport}",
  "goal": "Summary of user goal",
  "daysPerWeek": ${daysPerWeek},
  "level": "Intermediate",
  "schedule": [
    {
      "day": "Monday",
      "title": "Workout Title or Rest & Recovery",
      "focus": "Focus description",
      "duration": "50m",
      "type": "Strength or Rest",
      "exercises": [
        {"name": "Exercise Name", "sets": "4 sets", "reps": "8 reps", "notes": "Form note or target weight"}
      ]
    }
  ]
}`;

  const userPrompt = `Build a 7-day periodized split with exactly ${daysPerWeek} training days for: "${cleanPrompt}". Return RAW JSON ONLY.`;

  try {
    const res = await callChatCompletions({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 1100,
    });

    const parsed = cleanJsonOutput(res.content);

    if (parsed && Array.isArray(parsed.schedule) && parsed.schedule.length === 7) {
      return {
        schedule: parsed,
        isMock: false,
        source: res.source,
        modelName: res.modelName,
      };
    } else {
      throw new Error('Could not parse 7-day schedule from AI.');
    }
  } catch (error) {
    console.warn('Custom prompt schedule error, using fallback:', error.message);
    return {
      schedule: getFallbackWeeklySchedule({
        sport: defaultSport,
        goal: cleanPrompt.slice(0, 30) || 'Custom Training',
        daysPerWeek: 4,
        level: 'Intermediate',
      }),
      isMock: true,
      error: error.message,
    };
  }
}

/**
 * AI & Scientific Maintenance / Target Calorie Estimator
 */
export async function estimateMaintenanceWithAi({
  gender = 'male',
  height = 180,
  weight = 78,
  age = 22,
  activityLevel = 'moderate',
  goalType = 'maintain',
}) {
  const w = Number(weight) || 78;
  const h = Number(height) || 180;
  const a = Number(age) || 22;

  // 1. Scientific Mifflin-St Jeor Formula
  let bmr = 10 * w + 6.25 * h - 5 * a;
  if (gender === 'male') bmr += 5;
  else if (gender === 'female') bmr -= 161;
  else bmr -= 78;

  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    heavy: 1.725,
    athlete: 1.9,
  };
  const multiplier = multipliers[activityLevel] || 1.55;
  const maintenance = Math.round(bmr * multiplier);

  let targetCalories = maintenance;
  let defaultAdvice = '';
  let proteinGrams = Math.round(w * 1.8);

  if (goalType === 'lose') {
    targetCalories = Math.round(maintenance - 450);
    proteinGrams = Math.round(w * 2.2);
    defaultAdvice = `Calibrated for a sustainable 450 kcal deficit. High protein (${proteinGrams}g) protects muscle mass while shedding fat.`;
  } else if (goalType === 'gain') {
    targetCalories = Math.round(maintenance + 350);
    proteinGrams = Math.round(w * 2.0);
    defaultAdvice = `Calibrated for a lean 350 kcal surplus. Optimal fuel for progressive overload and muscle hypertrophy without excess fat gain.`;
  } else {
    targetCalories = maintenance;
    proteinGrams = Math.round(w * 1.8);
    defaultAdvice = `Calibrated for steady weight maintenance and body recomposition with balanced athletic energy.`;
  }

  // 2. Query AI if available for personalized coach insight
  try {
    const systemPrompt = `You are "Coach Lock", an elite sports nutritionist and performance coach.
Analyze the athlete's biometrics and provide a scientifically calibrated maintenance and calorie target with actionable advice.
Respond ONLY with a JSON object matching this schema:
{
  "maintenance": ${maintenance},
  "targetCalories": ${targetCalories},
  "proteinGrams": ${proteinGrams},
  "advice": "1 or 2 punchy sentences explaining the calorie target and how to hit it."
}`;

    const userPrompt = `Athlete: ${gender}, ${w}kg, ${h}cm, ${a} years old, Activity: ${activityLevel}, Primary Goal: ${goalType} weight.
Calculated BMR: ${Math.round(bmr)} kcal, TDEE: ${maintenance} kcal, Target: ${targetCalories} kcal.
Provide final calibrated values and advice. Return RAW JSON ONLY.`;

    const res = await callChatCompletions({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const parsed = cleanJsonOutput(res.content);
    if (parsed && typeof parsed.targetCalories === 'number') {
      return {
        maintenance: Math.round(parsed.maintenance || maintenance),
        targetCalories: Math.round(parsed.targetCalories || targetCalories),
        proteinGrams: Math.round(parsed.proteinGrams || proteinGrams),
        advice: parsed.advice || defaultAdvice,
        isMock: false,
        source: res.source,
      };
    }
  } catch (err) {
    console.warn('AI maintenance estimate error, using scientific calculation:', err.message);
  }

  return {
    maintenance,
    targetCalories,
    proteinGrams,
    advice: defaultAdvice,
    isMock: true,
  };
}

