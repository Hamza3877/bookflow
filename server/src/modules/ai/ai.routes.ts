import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../../middleware/validate';
import { parseSearchQuery } from '../../services/ai.service';
import { asyncHandler } from '../../utils/asyncHandler';

export const aiRouter = Router();

const schema = z.object({ query: z.string().trim().min(3, 'Type a few words').max(200) });

// "7 seater in Karachi this weekend under 15k"  ->  { city, type, guests, dates, maxPrice }
aiRouter.post(
  '/parse-search',
  validateBody(schema),
  asyncHandler(async (req, res) => {
    res.json(await parseSearchQuery(req.body.query));
  })
);
