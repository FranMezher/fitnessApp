import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { authMiddleware } from '../middleware/auth.js';

export const aiRouter = new Hono().use('*', authMiddleware);

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

// Para endpoints que devuelven JSON estructurado
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash-lite-preview-06-17',
  generationConfig: { responseMimeType: 'application/json' },
});

// Para endpoints que devuelven texto libre (insight)
const textModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite-preview-06-17' });

function cleanBase64(raw: string): string {
  return raw.replace(/^data:image\/\w+;base64,/, '');
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const is429 = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('quota');
      if (is429 && attempt < maxAttempts) {
        const delay = 1000 * 2 ** (attempt - 1); // 1s, 2s, 4s
        console.warn(`Gemini 429 — intento ${attempt}/${maxAttempts}, reintento en ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
  throw new Error('unreachable');
}

const pantrySchema = z.object({
  ingredients: z.array(z.object({
    name:     z.string(),
    quantity: z.string(),
    proteinG: z.number().optional(),
    carbsG:   z.number().optional(),
    fatG:     z.number().optional(),
  })).min(1),
  remainingMacros: z.object({
    calories: z.number(),
    proteinG: z.number(),
    carbsG:   z.number(),
    fatG:     z.number(),
  }),
});

// POST /ai/recipes — Pantry mode
aiRouter.post('/recipes', zValidator('json', pantrySchema), async (c) => {
  const { ingredients, remainingMacros } = c.req.valid('json');

  const ingredientList = ingredients.map((i) => `${i.name} (${i.quantity})`).join(', ');

  const prompt = `Eres un nutricionista experto. Responde SIEMPRE en JSON válido, sin markdown.
Tengo estos ingredientes: ${ingredientList}.
Mi objetivo nutricional restante hoy: ${remainingMacros.calories} kcal, ${remainingMacros.proteinG}g proteína, ${remainingMacros.carbsG}g carbos, ${remainingMacros.fatG}g grasas.
Genera exactamente 3 recetas simples. Responde SOLO con este JSON:
{
  "recipes": [
    {
      "name": "string",
      "instructions": "string (breve, 2-3 pasos)",
      "prepMinutes": number,
      "calories": number,
      "proteinG": number,
      "carbsG": number,
      "fatG": number
    }
  ]
}`;

  const result = await withRetry(() => model.generateContent(prompt));
  const text = result.response.text();
  try {
    return c.json(JSON.parse(text));
  } catch {
    return c.json({ error: 'Failed to parse AI response', raw: text }, 502);
  }
});

const receiptSchema = z.object({
  imageBase64: z.string().min(1),
  mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp']).default('image/jpeg'),
});

// POST /ai/receipt — scan supermarket receipt and extract food items
aiRouter.post('/receipt', zValidator('json', receiptSchema), async (c) => {
  const { imageBase64, mediaType } = c.req.valid('json');

  const promptText = `Analizá este ticket de supermercado. Identificá todos los productos alimenticios (ignorá productos de limpieza, higiene, etc).
Para cada alimento, estimá sus macros nutricionales basándote en valores estándar por 100g.
Respondé con este JSON:
{
  "items": [
    {
      "name": "string",
      "kcalPer100g": number,
      "proteinPer100g": number,
      "carbsPer100g": number,
      "fatPer100g": number
    }
  ]
}`;

  const result = await withRetry(() => model.generateContent([
    { inlineData: { data: cleanBase64(imageBase64), mimeType: mediaType } },
    promptText,
  ]));
  const text = result.response.text();
  try {
    return c.json(JSON.parse(text));
  } catch {
    return c.json({ error: 'Failed to parse AI response', raw: text }, 502);
  }
});

const parseFoodSchema = z.object({
  text: z.string().min(1),
});

// POST /ai/parse-food — natural language food description → FoodLogEntry[]
aiRouter.post('/parse-food', zValidator('json', parseFoodSchema), async (c) => {
  const { text } = c.req.valid('json');

  const prompt = `Eres un nutricionista experto. Responde SIEMPRE en JSON válido, sin markdown ni texto extra.
Analizá esta descripción de comida y extraé los alimentos con sus valores nutricionales estimados.
Descripción: "${text}"

Respondé SOLO con este JSON:
{
  "entries": [
    {
      "foodName": "string",
      "calories": number,
      "proteinG": number,
      "carbsG": number,
      "fatG": number
    }
  ]
}
Estimá los valores para la cantidad mencionada. Si no se menciona cantidad, asumí una porción estándar.`;

  const result = await withRetry(() => model.generateContent(prompt));
  const raw = result.response.text();
  try {
    return c.json(JSON.parse(raw));
  } catch {
    return c.json({ error: 'Failed to parse AI response', raw }, 502);
  }
});

const analyzeFoodPhotoSchema = z.object({
  imageBase64: z.string().min(1),
  mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp']).default('image/jpeg'),
});

// POST /ai/analyze-food-photo — food photo → FoodLogEntry[]
aiRouter.post('/analyze-food-photo', zValidator('json', analyzeFoodPhotoSchema), async (c) => {
  const { imageBase64, mediaType } = c.req.valid('json');

  const promptText = `Identificá los alimentos en esta foto y estimá sus valores nutricionales.
Respondé SOLO con este JSON sin markdown:
{
  "entries": [
    {
      "foodName": "string",
      "calories": number,
      "proteinG": number,
      "carbsG": number,
      "fatG": number
    }
  ]
}
Estimá las cantidades visualmente. Si hay un plato completo, describilo como un ítem.`;

  const result = await withRetry(() => model.generateContent([
    { inlineData: { data: cleanBase64(imageBase64), mimeType: mediaType } },
    promptText,
  ]));
  const raw = result.response.text();
  try {
    return c.json(JSON.parse(raw));
  } catch {
    return c.json({ error: 'Failed to parse AI response', raw }, 502);
  }
});

const insightSchema = z.object({
  sessionData: z.object({
    durationMin:     z.number(),
    caloriesBurned:  z.number(),
    formAccuracyPct: z.number(),
    exercisesDone:   z.number(),
  }),
  weekStats: z.object({
    sessionsCount: z.number(),
    avgFormPct:    z.number(),
    totalKcal:     z.number(),
  }),
});

// POST /ai/insight — post-workout motivational insight
aiRouter.post('/insight', zValidator('json', insightSchema), async (c) => {
  const { sessionData, weekStats } = c.req.valid('json');

  const prompt = `Sesión de hoy: ${sessionData.durationMin} min, ${sessionData.caloriesBurned} kcal, precisión de forma ${sessionData.formAccuracyPct}%, ${sessionData.exercisesDone} ejercicios. Esta semana: ${weekStats.sessionsCount} sesiones, ${weekStats.avgFormPct}% precisión media. Dame un insight motivacional y un tip de mejora en 2-3 frases, en español, tono enérgico.`;

  const result = await withRetry(() => textModel.generateContent(prompt));
  const insight = result.response.text();
  return c.json({ insight });
});
