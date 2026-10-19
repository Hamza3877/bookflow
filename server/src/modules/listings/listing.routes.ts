import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import {
  createListing,
  deleteListing,
  getAvailability,
  getListing,
  myListings,
  searchListings,
  setListingActive,
  updateListing,
} from './listing.controller';
import { listingBodySchema, activeSchema } from './listing.schema';

export const listingRouter = Router();

// Public
listingRouter.get('/', searchListings);

// Owner only (must be declared before "/:id" so "mine" is not read as an id)
listingRouter.get('/mine', requireAuth, requireRole('owner'), myListings);
listingRouter.post('/', requireAuth, requireRole('owner'), validateBody(listingBodySchema), createListing);

listingRouter.get('/:id', getListing);
listingRouter.get('/:id/availability', getAvailability);
listingRouter.put('/:id', requireAuth, requireRole('owner'), validateBody(listingBodySchema), updateListing);
listingRouter.patch('/:id/active', requireAuth, requireRole('owner'), validateBody(activeSchema), setListingActive);
listingRouter.delete('/:id', requireAuth, requireRole('owner'), deleteListing);
