import { Router } from 'express';
import { getRates } from '../../services/currency.service';
import { asyncHandler } from '../../utils/asyncHandler';

export const currencyRouter = Router();

currencyRouter.get(
  '/rates',
  asyncHandler(async (_req, res) => {
    const { rates, live } = await getRates();
    res.json({ base: 'PKR', rates, live });
  })
);
