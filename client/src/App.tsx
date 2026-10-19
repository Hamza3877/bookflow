import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Spinner } from './components/ui/Feedback';
import { useAppDispatch } from './store';
import { restoreSession } from './store/authSlice';

import Checkout from './pages/Checkout';
import Home from './pages/Home';
import ListingDetail from './pages/ListingDetail';
import Login from './pages/Login';
import MyBookings from './pages/MyBookings';
import NotFound from './pages/NotFound';
import PaymentSuccess from './pages/PaymentSuccess';
import Register from './pages/Register';

// Owner and admin screens are loaded only when needed (smaller first download).
const OwnerDashboard = lazy(() => import('./pages/owner/Dashboard'));
const OwnerListings = lazy(() => import('./pages/owner/OwnerListings'));
const ListingForm = lazy(() => import('./pages/owner/ListingForm'));
const OwnerBookings = lazy(() => import('./pages/owner/OwnerBookings'));
const AdminPanel = lazy(() => import('./pages/admin/AdminPanel'));

export default function App() {
  const dispatch = useAppDispatch();

  // On first load, check whether the visitor already has a valid login cookie.
  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  return (
    <ErrorBoundary>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="listings/:id" element={<ListingDetail />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />

            <Route element={<ProtectedRoute roles={['customer']} />}>
              <Route path="checkout/:id" element={<Checkout />} />
              <Route path="payment/success" element={<PaymentSuccess />} />
              <Route path="bookings" element={<MyBookings />} />
            </Route>

            <Route element={<ProtectedRoute roles={['owner']} />}>
              <Route path="owner" element={<OwnerDashboard />} />
              <Route path="owner/listings" element={<OwnerListings />} />
              <Route path="owner/listings/new" element={<ListingForm />} />
              <Route path="owner/listings/:id/edit" element={<ListingForm />} />
              <Route path="owner/bookings" element={<OwnerBookings />} />
            </Route>

            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route path="admin" element={<AdminPanel />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
