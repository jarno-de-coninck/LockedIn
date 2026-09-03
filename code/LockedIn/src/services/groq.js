/**
 * AI Service for LockedIn (Athletic Edition with Recipes & Profiles)
 * Supports:
 * 1. Local llama.cpp server (http://127.0.0.1:8080 or /api/local-ai)
 * 2. Groq Cloud (llama-3.3-70b-versatile)
 * 3. Smart local offline fallback engine
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_DEFAULT_MODEL = 'openai/gpt-oss-20b';
const GROQ_FALLBACK_MODEL = 'llama-3.3-70b-versatile';

export const getActiveProvider = () => {
  const customKey = getGroqApiKey();
  if (customKey) return 'groq';
  const saved = localStorage.getItem('lockedin_ai_provider');
  if (saved) return saved;
  if (import.meta.env.VITE_GROQ_API_KEY) return 'groq';
  return 'fallback';
};

export const getLocalAiEndpoint = () => {
  const saved = localStorage.getItem('lockedin_local_ai_endpoint');
  if (saved && saved.trim()) return saved.trim();

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
    // Keto / Low Carb: 30% Protein, 10% Carbs, 60% Fats
    const p = Math.round((cals * 0.30) / 4);
    const c = Math.max(5, Math.round((cals * 0.10) / 4));
    const f = Math.max(5, Math.round((cals * 0.60) / 9));
    return { protein: p, carbs: c, fats: f };
  } else if (dietType && (dietType.includes('Bulk') || dietType.includes('Bulking'))) {
    // Clean Bulking: 30% Protein, 50% Carbs, 20% Fats
    const p = Math.round((cals * 0.30) / 4);
    const c = Math.round((cals * 0.50) / 4);
    const f = Math.max(4, Math.round((cals * 0.20) / 9));
    return { protein: p, carbs: c, fats: f };
  } else if (dietType && (dietType.includes('Cut') || dietType.includes('Shred'))) {
    // Fat Shred / Cutting: 40% Protein, 35% Carbs, 25% Fats
    const p = Math.round((cals * 0.40) / 4);
    const c = Math.round((cals * 0.35) / 4);
    const f = Math.max(4, Math.round((cals * 0.25) / 9));
    return { protein: p, carbs: c, fats: f };
  } else if (dietType && dietType.includes('Mediterranean')) {
    // Mediterranean Balance: 25% Protein, 45% Carbs, 30% Fats
    const p = Math.round((cals * 0.25) / 4);
    const c = Math.round((cals * 0.45) / 4);
    const f = Math.max(5, Math.round((cals * 0.30) / 9));
    return { protein: p, carbs: c, fats: f };
  } else if (dietType && (dietType.includes('Plant') || dietType.includes('Vegan'))) {
    // Plant-Based: 25% Protein, 55% Carbs, 20% Fats
    const p = Math.round((cals * 0.25) / 4);
    const c = Math.round((cals * 0.55) / 4);
    const f = Math.max(4, Math.round((cals * 0.20) / 9));
    return { protein: p, carbs: c, fats: f };
  } else {
    // High Protein Standard Athletic Split (35% Protein, 45% Carbs, 20% Fats)
    const p = Math.round((cals * 0.35) / 4);
    const c = Math.round((cals * 0.45) / 4);
    const f = Math.max(3, Math.round((cals * 0.20) / 9));
    return { protein: p, carbs: c, fats: f };
  }
}

/* =========================================================================
   ATHLETE DYNAMIC RECIPE CATALOG (36 DIVERSE DISHES ACROSS ALL CUISINES)
   ========================================================================= */

const ATHLETE_RECIPE_CATALOG = [
  // --- BREAKFASTS ---
  {
    slot: 'Breakfast',
    title: 'Power Scramble with Spinach, Turkey Bacon & Sourdough',
    cuisine: 'American',
    prepTime: '12 mins',
    tags: ['dairy-free', 'halal', 'high-protein'],
    keywords: ['egg', 'eggs', 'turkey', 'bacon', 'spinach', 'sourdough', 'bread', 'toast'],
    ingredients: ['4 Liquid Egg Whites + 2 Whole Eggs', '2 Slices Lean Turkey Bacon', '1 Cup Fresh Baby Spinach', '1 Slice Artisan Sourdough Toast', '1/2 Tsp Olive Oil & Black Pepper'],
    instructions: ['Crisp turkey bacon in skillet for 4 mins.', 'Add baby spinach until wilted.', 'Whisk eggs, scramble gently until fluffy, and serve on toasted sourdough.'],
  },
  {
    slot: 'Breakfast',
    title: 'High-Protein Fluffy Oat Pancakes with Warm Blueberry Compote',
    cuisine: 'Chef Choice',
    prepTime: '14 mins',
    tags: ['vegetarian', 'high-protein'],
    keywords: ['oats', 'oatmeal', 'pancake', 'pancakes', 'berry', 'berries', 'blueberries', 'protein powder', 'whey'],
    ingredients: ['60g Rolled Oats (Blended)', '1 Scoop Whey/Plant Isolate', '100g Egg Whites', '1/2 Tsp Cinnamon & Baking Powder', '60g Warm Blueberries & Sugar-Free Maple'],
    instructions: ['Blend oats, protein powder, egg whites, and cinnamon.', 'Cook pancakes on non-stick griddle 2 mins per side.', 'Pour warm blueberry compote over top.'],
  },
  {
    slot: 'Breakfast',
    title: 'Avocado & Smoked Salmon Sourdough with Poached Eggs',
    cuisine: 'Mediterranean',
    prepTime: '10 mins',
    tags: ['pescatarian', 'dairy-free', 'high-protein'],
    keywords: ['salmon', 'avocado', 'egg', 'eggs', 'sourdough', 'toast', 'fish'],
    ingredients: ['2 Slices Artisan Sourdough Bread', '70g Wild Smoked Salmon', '1/2 Ripe Avocado (Mashed)', '2 Poached Eggs', 'Everything Bagel Seasoning & Fresh Dill'],
    instructions: ['Toast sourdough until crispy.', 'Spread avocado, layer smoked salmon, and top with poached eggs and dill.'],
  },
  {
    slot: 'Breakfast',
    title: 'Huevos Rancheros Breakfast Skillet with Black Beans & Salsa',
    cuisine: 'Mexican',
    prepTime: '12 mins',
    tags: ['gluten-free', 'vegetarian', 'dairy-free', 'halal'],
    keywords: ['egg', 'eggs', 'beans', 'black beans', 'salsa', 'corn', 'tortilla', 'avocado'],
    ingredients: ['3 Whole Eggs', '1/2 Cup Rinsed Black Beans', '2 Warm Corn Tortillas', '3 Tbsp Fire-Roasted Salsa', '1/4 Avocado Diced & Fresh Cilantro'],
    instructions: ['Warm black beans in skillet with cumin and sea salt.', 'Fry eggs sunny-side up in olive oil.', 'Plate over warm tortillas with beans, salsa, and avocado.'],
  },
  {
    slot: 'Breakfast',
    title: 'Greek Yogurt Athlete Parfait with Raw Honey & Walnuts',
    cuisine: 'Mediterranean',
    prepTime: '4 mins',
    tags: ['vegetarian', 'gluten-free', 'high-protein'],
    keywords: ['yogurt', 'greek yogurt', 'honey', 'walnuts', 'berries', 'strawberries'],
    ingredients: ['220g 0% Non-Fat Greek Yogurt', '1 Scoop Vanilla Protein', '60g Fresh Strawberries & Blueberries', '15g Crushed Raw Walnuts', '1 Tsp Wild Honey'],
    instructions: ['Stir vanilla protein into Greek yogurt until thick and creamy.', 'Layer in a bowl with fresh berries, crushed walnuts, and a drizzle of raw honey.'],
  },
  {
    slot: 'Breakfast',
    title: 'Seared Sirloin & Eggs Power Hash with Crispy Sweet Potatoes',
    cuisine: 'American',
    prepTime: '16 mins',
    tags: ['gluten-free', 'dairy-free', 'high-protein', 'halal'],
    keywords: ['steak', 'sirloin', 'beef', 'egg', 'eggs', 'sweet potato', 'potato'],
    ingredients: ['120g Lean Sirloin Steak Strips', '2 Whole Eggs', '120g Sweet Potato (Cubed)', '1/2 Bell Pepper Diced', '1 Tsp Olive Oil, Garlic Powder & Smoked Paprika'],
    instructions: ['Pan-fry sweet potato cubes and peppers until tender-crisp (8 mins).', 'Sear steak strips 2 mins on high.', 'Crack eggs into the pan to fry and serve together hot.'],
  },
  {
    slot: 'Breakfast',
    title: 'Matcha Green Tea Overnight Oats with Chia Seeds & Almonds',
    cuisine: 'Asian',
    prepTime: '5 mins',
    tags: ['plant-based', 'vegan', 'dairy-free', 'gluten-free'],
    keywords: ['oats', 'matcha', 'chia', 'almonds', 'almond milk', 'berries'],
    ingredients: ['60g Rolled Oats', '1 Tsp Ceremonial Matcha Powder', '1 Tbsp Chia Seeds', '1 Scoop Vanilla Plant Isolate', '180ml Unsweetened Almond Milk & Sliced Almonds'],
    instructions: ['Whisk matcha and protein powder into almond milk.', 'Stir in oats and chia seeds, refrigerate, and top with sliced almonds.'],
  },
  {
    slot: 'Breakfast',
    title: 'Italian Frittata with Sun-Dried Tomatoes, Spinach & Mozzarella',
    cuisine: 'Italian',
    prepTime: '15 mins',
    tags: ['gluten-free', 'vegetarian', 'high-protein'],
    keywords: ['egg', 'eggs', 'tomato', 'spinach', 'mozzarella', 'cheese'],
    ingredients: ['4 Egg Whites + 2 Whole Eggs', '1 Cup Baby Spinach', '30g Sun-Dried Tomatoes', '30g Shredded Part-Skim Mozzarella', 'Fresh Basil & Oregano'],
    instructions: ['Sauté spinach and sun-dried tomatoes for 2 mins.', 'Pour whisked eggs into skillet, top with mozzarella, and bake/broil 8 mins until golden.'],
  },

  // --- LUNCHES ---
  {
    slot: 'Lunch',
    title: 'Grilled Lemon Herb Chicken Bowl with Jasmine Rice & Broccoli',
    cuisine: 'Mediterranean',
    prepTime: '18 mins',
    tags: ['gluten-free', 'dairy-free', 'halal', 'high-protein'],
    keywords: ['chicken', 'chicken breast', 'rice', 'jasmine rice', 'broccoli', 'lemon'],
    ingredients: ['200g Lean Chicken Breast', '1 Cup Cooked Jasmine Rice', '1.5 Cups Steamed Broccoli', '1 Tbsp Lemon Herb Vinaigrette', 'Oregano & Sea Salt'],
    instructions: ['Season chicken breast with oregano, garlic, sea salt, and lemon.', 'Grill 6 mins per side until cooked through.', 'Slice over warm jasmine rice with tender broccoli.'],
  },
  {
    slot: 'Lunch',
    title: 'Chipotle Flank Steak Power Bowl with Cilantro Lime Quinoa',
    cuisine: 'Mexican',
    prepTime: '16 mins',
    tags: ['gluten-free', 'dairy-free', 'halal', 'high-protein'],
    keywords: ['steak', 'beef', 'flank steak', 'quinoa', 'corn', 'beans', 'black beans', 'chipotle', 'avocado'],
    ingredients: ['180g Lean Flank Steak', '3/4 Cup Cooked Quinoa', '1/3 Cup Black Beans & Roasted Sweet Corn', '2 Tbsp Fresh Pico de Gallo', '1/4 Avocado & Lime Wedge'],
    instructions: ['Season steak with chipotle and cumin. Sear on high for 3 mins per side.', 'Assemble bowl with quinoa, black beans, corn, sliced steak, and fresh pico.'],
  },
  {
    slot: 'Lunch',
    title: 'Teriyaki Atlantic Salmon with Edamame & Brown Rice',
    cuisine: 'Asian',
    prepTime: '18 mins',
    tags: ['pescatarian', 'dairy-free', 'high-protein'],
    keywords: ['salmon', 'fish', 'teriyaki', 'edamame', 'rice', 'brown rice', 'soy'],
    ingredients: ['180g Fresh Atlantic Salmon Fillet', '3/4 Cup Steamed Brown Rice', '1/2 Cup Shelled Edamame', '1 Cup Steamed Snap Peas', '1.5 Tbsp Low-Sodium Teriyaki Glaze'],
    instructions: ['Sear salmon fillet in a non-stick pan 4 mins per side.', 'Brush with teriyaki glaze until bubbling.', 'Serve over brown rice with edamame and snap peas.'],
  },
  {
    slot: 'Lunch',
    title: 'Mediterranean Albacore Tuna & Rinsed Chickpea Mezze Salad',
    cuisine: 'Mediterranean',
    prepTime: '8 mins',
    tags: ['pescatarian', 'gluten-free', 'dairy-free', 'high-protein'],
    keywords: ['tuna', 'chickpeas', 'cucumber', 'tomatoes', 'olive oil', 'salad'],
    ingredients: ['1 Large Can Solid White Tuna in Water', '3/4 Cup Rinsed Chickpeas', 'Diced English Cucumbers & Cherry Tomatoes', '1 Tbsp Extra Virgin Olive Oil & Lemon Juice', 'Cracked Black Pepper & Fresh Parsley'],
    instructions: ['Drain tuna and combine with chickpeas, tomatoes, and cucumbers in a large bowl.', 'Toss thoroughly with olive oil, lemon juice, sea salt, and fresh parsley.'],
  },
  {
    slot: 'Lunch',
    title: 'Beef Bolognese with High-Protein Penne & Grated Parmesan',
    cuisine: 'Italian',
    prepTime: '20 mins',
    tags: ['high-protein', 'halal'],
    keywords: ['beef', 'ground beef', 'pasta', 'penne', 'bolognese', 'marinara', 'parmesan'],
    ingredients: ['180g 93/7 Extra Lean Ground Beef', '75g Protein Penne Pasta', '1/2 Cup Crushed San Marzano Marinara', '15g Grated Parmigiano-Reggiano', 'Minced Garlic & Fresh Basil'],
    instructions: ['Boil protein penne until al dente.', 'Brown lean ground beef with minced garlic, add marinara, and simmer 6 mins.', 'Toss pasta in sauce and garnish with parmesan and basil.'],
  },
  {
    slot: 'Lunch',
    title: 'Crispy Sesame Ginger Tofu Bowl with Snap Peas & Jasmine Rice',
    cuisine: 'Asian',
    prepTime: '16 mins',
    tags: ['plant-based', 'vegan', 'gluten-free', 'dairy-free'],
    keywords: ['tofu', 'rice', 'ginger', 'sesame', 'snap peas', 'vegan', 'plant'],
    ingredients: ['220g Extra Firm Tofu (Cubed & Pressed)', '1 Cup Steamed Jasmine Rice', '1.5 Cups Snap Peas & Matchstick Carrots', '1 Tbsp Toasted Sesame Oil & Tamari', '1 Tsp Fresh Grated Ginger'],
    instructions: ['Pan-sear tofu in sesame oil until golden and crispy (8 mins).', 'Sauté snap peas and carrots with ginger and tamari.', 'Plate over warm jasmine rice with toasted sesame seeds.'],
  },
  {
    slot: 'Lunch',
    title: 'Smoked Deli Turkey & Ripe Avocado Artisan Wrap',
    cuisine: 'American',
    prepTime: '6 mins',
    tags: ['dairy-free', 'high-protein'],
    keywords: ['turkey', 'wrap', 'tortilla', 'avocado', 'lettuce', 'tomato'],
    ingredients: ['160g Sliced Deli Smoked Turkey Breast', '1 Large Whole Wheat or Low-Carb Tortilla', '1/2 Ripe Avocado (Sliced)', 'Romaine Lettuce Leaves & Sliced Tomato', '1 Tsp Whole Grain Dijon Mustard'],
    instructions: ['Layer whole wheat tortilla with turkey slices, avocado, tomato, and romaine.', 'Spread Dijon mustard, roll tightly, and slice diagonally to serve.'],
  },
  {
    slot: 'Lunch',
    title: 'Thai Red Curry Chicken with Zucchini, Peppers & Coconut Rice',
    cuisine: 'Asian',
    prepTime: '18 mins',
    tags: ['gluten-free', 'dairy-free', 'halal', 'high-protein'],
    keywords: ['chicken', 'curry', 'thai', 'coconut', 'rice', 'peppers'],
    ingredients: ['190g Diced Chicken Breast', '1 Tbsp Thai Red Curry Paste', '1/2 Cup Light Coconut Milk', '1 Cup Sliced Bell Peppers & Zucchini', '3/4 Cup Jasmine Rice'],
    instructions: ['Sear chicken cubes in a wok for 5 mins.', 'Stir in red curry paste and coconut milk, add vegetables, and simmer 7 mins until thickened.', 'Serve over fragrant rice.'],
  },
  {
    slot: 'Lunch',
    title: 'Chimichurri Flank Steak Salad with Roasted Baby Peppers',
    cuisine: 'Mexican',
    prepTime: '15 mins',
    tags: ['gluten-free', 'dairy-free', 'high-protein', 'halal'],
    keywords: ['steak', 'beef', 'salad', 'peppers', 'chimichurri', 'greens'],
    ingredients: ['180g Grilled Flank Steak (Sliced)', '3 Cups Mixed Baby Greens', '1/2 Cup Roasted Mini Sweet Peppers', '2 Tbsp Fresh Chimichurri (Parsley, Garlic, Olive Oil, Red Wine Vinegar)', 'Sea Salt'],
    instructions: ['Grill or sear steak to medium rare (3 mins per side) and rest 5 mins.', 'Toss baby greens and roasted sweet peppers with chimichurri.', 'Fan steak slices over greens.'],
  },

  // --- DINNERS ---
  {
    slot: 'Dinner',
    title: 'Pan-Seared Sirloin Steak with Roasted Sweet Potato & Garlic Asparagus',
    cuisine: 'American',
    prepTime: '20 mins',
    tags: ['gluten-free', 'dairy-free', 'high-protein', 'halal'],
    keywords: ['steak', 'sirloin', 'beef', 'sweet potato', 'potato', 'asparagus', 'garlic'],
    ingredients: ['200g Lean Top Sirloin Steak', '1 Medium Sweet Potato (Baked)', '10 Fresh Asparagus Spears', '1 Tsp Olive Oil & Minced Garlic', 'Coarse Sea Salt & Cracked Black Pepper'],
    instructions: ['Poke holes in sweet potato and microwave/bake until fork-tender.', 'Sear seasoned steak in a smoking-hot skillet with olive oil for 3.5 mins per side.', 'Sauté asparagus with garlic for 3 mins and serve together.'],
  },
  {
    slot: 'Dinner',
    title: 'Wild Honey Glazed Salmon with Garlic Jasmine Rice & Green Beans',
    cuisine: 'Asian',
    prepTime: '18 mins',
    tags: ['pescatarian', 'gluten-free', 'dairy-free', 'high-protein'],
    keywords: ['salmon', 'fish', 'honey', 'rice', 'green beans', 'garlic'],
    ingredients: ['190g Fresh Salmon Fillet', '1 Tbsp Pure Honey & 1 Tsp Soy Sauce/Tamari', '1 Cup Cooked Jasmine Rice', '1.5 Cups Crisp Green Beans', '1 Tsp Olive Oil'],
    instructions: ['Whisk honey and tamari with minced garlic.', 'Sear salmon in a skillet 4 mins per side, brushing generously with honey glaze.', 'Sauté green beans in remaining pan juices and serve over rice.'],
  },
  {
    slot: 'Dinner',
    title: 'Garlic Butter Jumbo Shrimp with Cherry Tomatoes & Protein Penne',
    cuisine: 'Italian',
    prepTime: '15 mins',
    tags: ['pescatarian', 'high-protein'],
    keywords: ['shrimp', 'prawns', 'pasta', 'garlic', 'tomatoes', 'butter'],
    ingredients: ['220g Peeled Jumbo Shrimp', '70g Protein Penne or Whole Wheat Pasta', '1 Cup Sweet Cherry Tomatoes', '1 Tbsp Grass-Fed Butter & 3 Cloves Garlic', 'Fresh Parsley & Lemon Juice'],
    instructions: ['Boil pasta until al dente.', 'Sauté garlic and cherry tomatoes in melted butter for 2 mins, add shrimp, and cook 3 mins until pink.', 'Toss pasta into skillet with fresh parsley.'],
  },
  {
    slot: 'Dinner',
    title: 'Lean Beef & Turkey Smash Burgers with Air-Fried Sweet Potato Wedges',
    cuisine: 'American',
    prepTime: '20 mins',
    tags: ['gluten-free', 'dairy-free', 'high-protein', 'halal'],
    keywords: ['beef', 'turkey', 'burger', 'sweet potato', 'potato', 'fries'],
    ingredients: ['190g 93/7 Lean Ground Beef or Turkey', '160g Sweet Potato (Cut into Wedges)', 'Crisp Lettuce Leaves & Sliced Ripe Tomato', '1 Tbsp Light Dijonnaise', 'Smoked Sea Salt'],
    instructions: ['Toss sweet potato wedges with sea salt and air fry at 200°C for 14 mins.', 'Form 2 thin burger patties, sear in hot cast iron 2.5 mins per side.', 'Serve in crisp lettuce wrap with fries.'],
  },
  {
    slot: 'Dinner',
    title: 'Pan-Roasted Atlantic Cod with Roasted Asparagus & Herbed Quinoa',
    cuisine: 'Mediterranean',
    prepTime: '18 mins',
    tags: ['pescatarian', 'gluten-free', 'dairy-free', 'high-protein'],
    keywords: ['cod', 'fish', 'white fish', 'quinoa', 'asparagus', 'lemon'],
    ingredients: ['200g Fresh Atlantic Cod Fillet', '3/4 Cup Fluffy Cooked Quinoa', '1 Cup Roasted Asparagus Spears', '1 Tbsp Extra Virgin Olive Oil & Lemon Zest', 'Oregano & Flaky Salt'],
    instructions: ['Roast asparagus at 200°C for 10 mins with olive oil.', 'Sear cod fillet in olive oil 4 mins per side until golden and flaky.', 'Plate over warm herbed quinoa with lemon zest.'],
  },
  {
    slot: 'Dinner',
    title: 'Fajita Spiced Chicken Breast Skillet with Charred Peppers & Guacamole',
    cuisine: 'Mexican',
    prepTime: '16 mins',
    tags: ['gluten-free', 'dairy-free', 'high-protein', 'halal'],
    keywords: ['chicken', 'fajita', 'peppers', 'onions', 'guacamole', 'avocado'],
    ingredients: ['210g Sliced Chicken Breast', '1 Large Bell Pepper & 1/2 Red Onion (Sliced)', '1 Tsp Fajita Spice (Cumin, Chili, Garlic)', '30g Fresh Guacamole', '1 Tbsp Olive Oil & Fresh Lime'],
    instructions: ['Sauté chicken breast slices in hot skillet with fajita seasoning for 6 mins.', 'Add peppers and onions, cooking on high heat until slightly charred.', 'Top with guacamole and lime juice.'],
  },
  {
    slot: 'Dinner',
    title: 'Rosemary Garlic Pork Tenderloin with Roasted Fingerling Potatoes',
    cuisine: 'American',
    prepTime: '22 mins',
    tags: ['gluten-free', 'dairy-free', 'high-protein'],
    keywords: ['pork', 'tenderloin', 'potatoes', 'rosemary', 'garlic'],
    ingredients: ['190g Lean Pork Tenderloin Medallions', '150g Fingerling Potatoes (Halved)', '1 Cup Steamed Green Peas', '1 Tbsp Olive Oil, Fresh Rosemary & Garlic', 'Sea Salt'],
    instructions: ['Roast potatoes in oven/air fryer at 200°C for 16 mins.', 'Sear pork medallions with rosemary and garlic for 4 mins per side.', 'Serve hot with steamed green peas.'],
  },
  {
    slot: 'Dinner',
    title: 'Italian Turkey Meatballs in Rustic Marinara over Zucchini Noodles',
    cuisine: 'Italian',
    prepTime: '18 mins',
    tags: ['gluten-free', 'high-protein', 'keto'],
    keywords: ['turkey', 'meatballs', 'zucchini', 'marinara', 'italian', 'parmesan'],
    ingredients: ['200g Lean Turkey Meatballs (Baked)', '2 Medium Zucchinis (Spiralized into Zoodles)', '1/2 Cup Marinara Sauce', '15g Grated Parmesan Cheese', 'Fresh Basil'],
    instructions: ['Simmer baked turkey meatballs in rustic marinara for 6 mins.', 'Flash-sauté zucchini noodles in olive oil for 90 seconds (keep crisp).', 'Ladle meatballs and sauce over zoodles with parmesan.'],
  },
  {
    slot: 'Dinner',
    title: 'Crispy Chickpea & Lentil Tikka Masala with Steamed Basmati Rice',
    cuisine: 'Asian',
    prepTime: '18 mins',
    tags: ['plant-based', 'vegan', 'gluten-free', 'dairy-free'],
    keywords: ['lentils', 'chickpeas', 'curry', 'tikka', 'rice', 'basmati', 'spinach'],
    ingredients: ['3/4 Cup Cooked Brown Lentils', '1/2 Cup Rinsed Chickpeas', '1/2 Cup Light Coconut Tikka Sauce', '1 Cup Fresh Baby Spinach', '3/4 Cup Steamed Basmati Rice'],
    instructions: ['Simmer lentils, chickpeas, and tikka sauce in a saucepan for 8 mins.', 'Fold in fresh baby spinach until wilted.', 'Serve over hot basmati rice.'],
  },

  // --- SNACKS / RECOVERY FUEL ---
  {
    slot: 'Snack',
    title: 'Pro-Crunch Greek Yogurt Parfait with 85% Dark Chocolate & Almonds',
    cuisine: 'Chef Choice',
    prepTime: '3 mins',
    tags: ['vegetarian', 'gluten-free', 'high-protein'],
    keywords: ['yogurt', 'greek yogurt', 'chocolate', 'almonds', 'snack', 'whey'],
    ingredients: ['170g 0% Greek Yogurt', '1 Scoop Whey Isolate', '10g 85% Dark Chocolate Shavings', '10g Crushed Raw Almonds'],
    instructions: ['Whisk whey isolate into Greek yogurt until thick pudding texture.', 'Top with dark chocolate shavings and crushed almonds.'],
  },
  {
    slot: 'Snack',
    title: 'Salted Brown Rice Cakes with Low-Fat Cottage Cheese & Raw Honey',
    cuisine: 'Chef Choice',
    prepTime: '2 mins',
    tags: ['vegetarian', 'gluten-free', 'high-protein'],
    keywords: ['rice cake', 'rice cakes', 'cottage cheese', 'honey', 'snack'],
    ingredients: ['2 Salted Brown Rice Cakes', '140g Low-Fat Whipped Cottage Cheese', '1 Tsp Pure Raw Honey & Dash of Cinnamon'],
    instructions: ['Spread cottage cheese across rice cakes.', 'Drizzle raw honey and dust with ground cinnamon.'],
  },
  {
    slot: 'Snack',
    title: 'Turkey & Swiss Cheese Roll-Ups with Crisp Apple Slices',
    cuisine: 'American',
    prepTime: '4 mins',
    tags: ['gluten-free', 'high-protein', 'keto'],
    keywords: ['turkey', 'cheese', 'apple', 'snack'],
    ingredients: ['4 Slices Deli Smoked Turkey Breast', '1 Slice Part-Skim Swiss Cheese', '1 Honeycrisp Apple (Sliced)', '1 Tsp Dijon Mustard'],
    instructions: ['Roll turkey slices around cheese and apple wedges with a hint of Dijon.'],
  },
  {
    slot: 'Snack',
    title: 'Steamed Edamame Pods with Coarse Sea Salt & Toasted Sesame',
    cuisine: 'Asian',
    prepTime: '4 mins',
    tags: ['plant-based', 'vegan', 'gluten-free', 'dairy-free', 'high-protein'],
    keywords: ['edamame', 'soy', 'sesame', 'snack', 'vegan'],
    ingredients: ['1.5 Cups Whole Edamame Pods (Steamed)', '1/2 Tsp Coarse Sea Salt', '1/2 Tsp Toasted Sesame Seeds & Pinch of Chili Flakes'],
    instructions: ['Steam edamame pods in microwave or boiling water for 3 mins.', 'Toss with sea salt, sesame seeds, and chili flakes.'],
  },
  {
    slot: 'Snack',
    title: 'Hard-Boiled Eggs with Everything Bagel Spice & Avocado',
    cuisine: 'Chef Choice',
    prepTime: '3 mins',
    tags: ['vegetarian', 'gluten-free', 'dairy-free', 'keto', 'high-protein'],
    keywords: ['egg', 'eggs', 'avocado', 'snack', 'keto'],
    ingredients: ['2 Large Hard-Boiled Eggs (Halved)', '1/4 Ripe Avocado (Sliced)', 'Everything Bagel Seasoning & Sea Salt'],
    instructions: ['Slice hard-boiled eggs in half.', 'Top with avocado slices and dust generously with Everything Bagel spice.'],
  },
  {
    slot: 'Snack',
    title: 'Crisp Honeycrisp Apple Wedges with Creamy Almond Butter',
    cuisine: 'Chef Choice',
    prepTime: '2 mins',
    tags: ['plant-based', 'vegan', 'gluten-free', 'dairy-free'],
    keywords: ['apple', 'almond butter', 'peanut butter', 'fruit', 'snack'],
    ingredients: ['1 Medium Crisp Honeycrisp Apple (Sliced)', '1.5 Tbsp 100% Pure Almond Butter', 'Pinch of Ground Cinnamon'],
    instructions: ['Slice apple into wedges.', 'Dip into creamy almond butter with a light dusting of cinnamon.'],
  },
  {
    slot: 'Snack',
    title: 'Beef Biltong Jerky with Roasted Salted Cashews',
    cuisine: 'American',
    prepTime: '1 min',
    tags: ['gluten-free', 'dairy-free', 'high-protein', 'keto', 'halal'],
    keywords: ['jerky', 'beef', 'cashews', 'nuts', 'snack', 'keto'],
    ingredients: ['40g Lean Grass-Fed Beef Biltong / Jerky', '20g Whole Roasted Salted Cashews'],
    instructions: ['Portion beef jerky and crunchy cashews together for on-the-go fuel.'],
  },
];

/**
 * Intelligent filter and randomizer that picks distinct, varied recipes
 */
function pickFromRecipeCatalog(slot, targetCals, dietType, options = {}, usedTitles = new Set(), mealId = 1) {
  const cuisine = (options.cuisine || 'Chef Choice').toLowerCase();
  const restrictions = Array.isArray(options.restrictions)
    ? options.restrictions.map((r) => r.toLowerCase())
    : [];
  const pantryWords = (options.customIngredients || '')
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((w) => w.length > 2);

  // 1. Filter recipes matching slot (map 'Afternoon Snack' / 'Evening Fuel' to 'Snack')
  const baseSlot = slot.toLowerCase().includes('snack') || slot.toLowerCase().includes('fuel') ? 'Snack' : slot;
  let candidates = ATHLETE_RECIPE_CATALOG.filter(
    (r) => r.slot.toLowerCase() === baseSlot.toLowerCase()
  );

  if (candidates.length === 0) {
    candidates = ATHLETE_RECIPE_CATALOG.filter((r) => r.slot === 'Breakfast');
  }

  // 2. Filter out already used titles in the current plan
  const unused = candidates.filter((r) => !usedTitles.has(r.title));
  if (unused.length > 0) candidates = unused;

  // 3. Filter restrictions if specified
  if (restrictions.length > 0) {
    const strictFiltered = candidates.filter((r) => {
      return restrictions.every((res) => {
        if (res.includes('dairy')) return r.tags.includes('dairy-free');
        if (res.includes('gluten')) return r.tags.includes('gluten-free');
        if (res.includes('nut')) return !r.keywords.some((k) => k.includes('nut') || k.includes('peanut') || k.includes('almond') || k.includes('cashew') || k.includes('walnut'));
        if (res.includes('pesca')) return r.tags.includes('pescatarian') || r.tags.includes('vegetarian');
        if (res.includes('vegan') || res.includes('plant')) return r.tags.includes('vegan') || r.tags.includes('plant-based');
        if (res.includes('halal')) return !r.keywords.some((k) => k.includes('pork') || k.includes('bacon'));
        return true;
      });
    });
    if (strictFiltered.length > 0) candidates = strictFiltered;
  }

  // 4. Score candidates with a randomized tiebreaker so generations are always fresh
  const scored = candidates.map((r) => {
    let score = Math.random() * 3; // randomized jitter ensures variety every click!

    // Cuisine bonus
    if (cuisine !== 'chef choice' && cuisine !== 'any') {
      if (r.cuisine.toLowerCase().includes(cuisine)) {
        score += 6;
      }
    }

    // Pantry / Cravings keyword bonus
    if (pantryWords.length > 0) {
      for (const word of pantryWords) {
        if (
          r.keywords.some((k) => k.includes(word)) ||
          r.title.toLowerCase().includes(word)
        ) {
          score += 5;
        }
      }
    }

    // Diet style alignment bonus
    if (dietType.includes('Keto') && r.tags.includes('keto')) score += 3;
    if (dietType.includes('Plant') && (r.tags.includes('vegan') || r.tags.includes('plant-based'))) score += 3;

    return { recipe: r, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const chosen = scored[0]?.recipe || candidates[0];
  usedTitles.add(chosen.title);

  const macros = computeRealisticMacros(targetCals, dietType);

  return {
    id: mealId,
    meal: slot,
    title: chosen.title,
    calories: targetCals,
    protein: macros.protein,
    carbs: macros.carbs,
    fats: macros.fats,
    prepTime: chosen.prepTime,
    ingredients: chosen.ingredients,
    instructions: chosen.instructions,
  };
}

export function getFallbackDietPlan(
  dietType = 'High Protein',
  targetGoal = 2000,
  options = {}
) {
  const goal = Number(targetGoal) || 2000;
  const count = Number(options.mealCount) || 4;
  const cuisine = options.cuisine || 'Chef Choice';
  const restrictions = Array.isArray(options.restrictions) ? options.restrictions : [];
  const customIngredients = options.customIngredients || '';

  let slots = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
  let ratios = [0.25, 0.35, 0.30, 0.10];
  if (count === 3) {
    slots = ['Breakfast', 'Lunch', 'Dinner'];
    ratios = [0.30, 0.40, 0.30];
  } else if (count === 5) {
    slots = ['Breakfast', 'Lunch', 'Afternoon Snack', 'Dinner', 'Evening Fuel'];
    ratios = [0.22, 0.30, 0.14, 0.24, 0.10];
  }

  const slotTargets = {};
  let running = 0;
  for (let i = 0; i < slots.length; i++) {
    if (i === slots.length - 1) {
      slotTargets[slots[i]] = Math.max(50, goal - running);
    } else {
      const c = Math.round(goal * ratios[i]);
      slotTargets[slots[i]] = c;
      running += c;
    }
  }

  const usedTitles = new Set();
  const plan = slots.map((slot, idx) => {
    const cals = slotTargets[slot];
    return pickFromRecipeCatalog(
      slot,
      cals,
      dietType,
      { cuisine, restrictions, customIngredients },
      usedTitles,
      idx + 1
    );
  });

  return plan;
}

/**
 * Fallback alternatives when user regenerates a single meal slot.
 */
function getSingleMealFallback(mealSlot, targetCals, dietType = 'High Protein', options = {}) {
  const cals = Number(targetCals) || 500;
  return pickFromRecipeCatalog(mealSlot, cals, dietType, options, new Set(), 1);
}

/**
 * Generates an exact-matched daily diet plan with AI (or varied culinary engine).
 */
export async function generateDietPlan({
  goal,
  dietType = 'High Protein',
  cuisine = 'Chef Choice',
  restrictions = [],
  customIngredients = '',
  mealCount = 4,
}) {
  const provider = getActiveProvider();
  const targetGoal = Number(goal) || 2000;
  const count = Number(mealCount) || 4;

  let slots = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
  let ratios = [0.25, 0.35, 0.30, 0.10];
  if (count === 3) {
    slots = ['Breakfast', 'Lunch', 'Dinner'];
    ratios = [0.30, 0.40, 0.30];
  } else if (count === 5) {
    slots = ['Breakfast', 'Lunch', 'Afternoon Snack', 'Dinner', 'Evening Fuel'];
    ratios = [0.22, 0.30, 0.14, 0.24, 0.10];
  }

  const slotTargets = {};
  let running = 0;
  for (let i = 0; i < slots.length; i++) {
    if (i === slots.length - 1) {
      slotTargets[slots[i]] = Math.max(50, targetGoal - running);
    } else {
      const c = Math.round(targetGoal * ratios[i]);
      slotTargets[slots[i]] = c;
      running += c;
    }
  }

  if (provider === 'fallback') {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return {
      plan: getFallbackDietPlan(dietType, targetGoal, {
        cuisine,
        restrictions,
        customIngredients,
        mealCount: count,
      }),
      isMock: true,
      note: 'Crafted with Athletic Culinary Engine',
    };
  }

  const systemPrompt = `You are a Michelin-level Olympic Sports Nutritionist & Executive Chef.
Generate an athletic ${count}-meal daily menu.
Total Daily Calories MUST EQUAL EXACTLY ${targetGoal} kcal.
- Cuisine Style: ${cuisine}
- Dietary Paradigm: ${dietType}
- Restrictions/Allergies: ${restrictions.length > 0 ? restrictions.join(', ') : 'None'}
- Kitchen Pantry / Desired Ingredients: ${customIngredients || 'Fresh athletic whole foods'}

Slot targets:
${slots.map((s) => `- ${s}: ${slotTargets[s]} kcal`).join('\n')}

CRITICAL CONSTRAINTS TO SAVE TOKENS & MAXIMIZE CULINARY QUALITY:
1. Provide creative, mouth-watering meal titles fitting ${cuisine} and ${dietType}.
2. 3 to 4 real ingredients with gram weights per meal.
3. 2 concise preparation steps per meal.
4. Output STRICT RAW JSON ONLY. No markdown, no explanations.

Schema:
[
  {
    "id": 1,
    "meal": "${slots[0]}",
    "title": "Recipe Title",
    "calories": ${slotTargets[slots[0]]},
    "prepTime": "15 mins",
    "ingredients": ["180g Grilled Protein", "100g Rice/Carb", "80g Veggies"],
    "instructions": ["Season and cook protein.", "Assemble with carbs & greens."]
  }
]`;

  const userPrompt = `Create an athletic ${cuisine} ${dietType} ${count}-meal menu for ${targetGoal} kcal total. Return JSON array only.`;

  try {
    const res = await callChatCompletions({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.55,
      max_tokens: count === 5 ? 1100 : 880,
    });

    const parsedPlan = cleanJsonOutput(res.content);

    if (Array.isArray(parsedPlan) && parsedPlan.length >= 1) {
      const finalMeals = slots.map((slot, idx) => {
        const item =
          parsedPlan.find((p) => p.meal?.toLowerCase() === slot.toLowerCase()) ||
          parsedPlan[idx] ||
          {};
        const slotCalorieTarget = slotTargets[slot];

        // Mathematically guarantee (Protein * 4) + (Carbs * 4) + (Fats * 9) === slotCalorieTarget
        const macros = computeRealisticMacros(slotCalorieTarget, dietType);

        return {
          id: idx + 1,
          meal: slot,
          title:
            item.title && item.title.trim().length > 3
              ? item.title.trim()
              : `${dietType} ${slot} Plate`,
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
    return {
      plan: getFallbackDietPlan(dietType, targetGoal, {
        cuisine,
        restrictions,
        customIngredients,
        mealCount: count,
      }),
      isMock: true,
      error: error.message,
    };
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

function sanitizeReps(rawReps) {
  if (!rawReps) return '10';
  const str = String(rawReps).trim();
  const rangeMatch = str.match(/(\d+)\s*[-–—]\s*(\d+)/);
  if (rangeMatch) {
    const upper = parseInt(rangeMatch[2], 10);
    if (!isNaN(upper) && upper > 0 && upper <= 50) return String(upper);
  }
  if (/(\d+)\s*s\b/i.test(str)) return '12';
  const match = str.match(/\b(\d+)\b/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (!isNaN(num) && num > 0 && num <= 50) return String(num);
  }
  return '10';
}

function sanitizeWeight(rawWeight) {
  if (!rawWeight) return '20';
  const match = String(rawWeight).match(/\d+(\.\d+)?/);
  return match ? match[0] : '20';
}

function buildExerciseSets(numSets, repsDefault, defaultWeight = '') {
  const count = parseInt(numSets, 10) || 3;
  const cleanReps = sanitizeReps(repsDefault);
  const cleanWeight = sanitizeWeight(defaultWeight);
  return Array.from({ length: count }, (_, idx) => ({
    setNumber: idx + 1,
    weight: cleanWeight,
    reps: cleanReps,
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

