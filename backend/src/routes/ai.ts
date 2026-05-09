import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { authMiddleware } from '../middleware/auth.js';

export const aiRouter = new Hono().use('*', authMiddleware);

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
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const ingredientList = ingredients.map((i) => `${i.name} (${i.quantity})`).join(', ');

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: 'Eres un nutricionista experto. Responde SIEMPRE en JSON válido, sin markdown.',
    messages: [{
      role: 'user',
      content: `Tengo estos ingredientes: ${ingredientList}.
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
}`,
    }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}';
  try {
    return c.json(JSON.parse(text));
  } catch {
    return c.json({ error: 'Failed to parse AI response', raw: text }, 502);
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
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Sesión de hoy: ${sessionData.durationMin} min, ${sessionData.caloriesBurned} kcal, precisión de forma ${sessionData.formAccuracyPct}%, ${sessionData.exercisesDone} ejercicios. Esta semana: ${weekStats.sessionsCount} sesiones, ${weekStats.avgFormPct}% precisión media. Dame un insight motivacional y un tip de mejora en 2-3 frases, en español, tono enérgico.`,
    }],
  });

  const insight = message.content[0].type === 'text' ? message.content[0].text : '';
  return c.json({ insight });
});
