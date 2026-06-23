import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import HotelView from './features/inventory/components/HotelView';
import RoomTypeView from './features/inventory/components/RoomTypeView';
import RoomBedView from './features/inventory/components/RoomBedView';
import RoomFeatureView from './features/inventory/components/RoomFeatureView';
import VatRuleView from './features/pricing/components/VatRuleView';
import HolidayCalendarView from './features/pricing/components/HolidayCalendarView';
import RoleView from './features/iam/components/RoleView';
import PermissionView from './features/iam/components/PermissionView';
import GuestView from './features/crm/components/GuestView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root domain to admin hotels page */}
        <Route path="/" element={<Navigate to="/admin/hotels" replace />} />

        {/* Admin Dashboard Layout and sub-routes */}
        <Route path="/admin" element={<AdminLayout />}>
          {/* Default dashboard tab redirects to hotels */}
          <Route index element={<Navigate to="hotels" replace />} />
          <Route path="hotels" element={<HotelView />} />
          <Route path="room-types" element={<RoomTypeView />} />
          <Route path="room-beds" element={<RoomBedView />} />
          <Route path="room-features" element={<RoomFeatureView />} />
          <Route path="vat-rules" element={<VatRuleView />} />
          <Route path="holiday-calendars" element={<HolidayCalendarView />} />
          <Route path="roles" element={<RoleView />} />
          <Route path="permissions" element={<PermissionView />} />
          <Route path="guests" element={<GuestView />} />
        </Route>

        {/* Catch-all redirects back to admin hotels dashboard */}
        <Route path="*" element={<Navigate to="/admin/hotels" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;