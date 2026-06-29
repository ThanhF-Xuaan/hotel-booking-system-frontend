import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import HotelView from './features/inventory/components/HotelView';
import RoomTypeView from './features/inventory/components/RoomTypeView';
import RoomBedView from './features/inventory/components/RoomBedView';
import RoomFeatureView from './features/inventory/components/RoomFeatureView';
import VatRuleView from './features/pricing/components/VatRuleView';
import HolidayCalendarView from './features/pricing/components/HolidayCalendarView';
import PricingRulePage from './features/pricing/pricing-rule/components/PricingRulePage';
import CampaignPage from './features/pricing/campaign/components/CampaignPage';
import DiscountRulePage from './features/pricing/discount-rule/components/DiscountRulePage';
import SurchargeRulePage from './features/pricing/surcharge-rule/components/SurchargeRulePage';
import PricingRuleTypePage from './features/pricing/pricing-rule-type/components/PricingRuleTypePage';
import DiscountRuleTypePage from './features/pricing/discount-rule-type/components/DiscountRuleTypePage';
import RoleView from './features/iam/components/RoleView';
import PermissionView from './features/iam/components/PermissionView';
import GuestView from './features/crm/components/GuestView';
import CatalogItemPage from './features/inventory/catalog-item/components/CatalogItemPage';
import StaffPage from './features/iam/staff/components/StaffPage';
import RoomInstancePage from './features/inventory/room-instance/components/RoomInstancePage';
import HotelRoomTypeListPage from './features/inventory/hotel-room-type/components/HotelRoomTypeListPage';
import HotelRoomTypeDetailPage from './features/inventory/hotel-room-type/components/HotelRoomTypeDetailPage';
import LoginPage from './features/auth/components/LoginPage';
import ProtectedRoute from './features/auth/components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root domain to admin hotels page */}
        <Route path="/" element={<Navigate to="/admin/hotels" replace />} />

        <Route path="/login" element={<LoginPage />} />

        {/* Admin Dashboard Layout and sub-routes */}
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          {/* Default dashboard tab redirects to hotels */}
          <Route index element={<Navigate to="hotels" replace />} />
          <Route path="hotels" element={<HotelView />} />
          <Route path="room-types" element={<RoomTypeView />} />
          <Route path="room-beds" element={<RoomBedView />} />
          <Route path="room-features" element={<RoomFeatureView />} />
          <Route path="room-instances" element={<RoomInstancePage />} />
          <Route path="hotel-room-types" element={<HotelRoomTypeListPage />} />
          <Route path="hotel-room-types/:id" element={<HotelRoomTypeDetailPage />} />
          <Route path="catalog-items" element={<CatalogItemPage />} />
          <Route path="vat-rules" element={<VatRuleView />} />
          <Route path="holiday-calendars" element={<HolidayCalendarView />} />
          <Route path="pricing-rules" element={<PricingRulePage />} />
          <Route path="campaigns" element={<CampaignPage />} />
          <Route path="discount-rules" element={<DiscountRulePage />} />
          <Route path="surcharge-rules" element={<SurchargeRulePage />} />
          <Route path="pricing-rule-types" element={<PricingRuleTypePage />} />
          <Route path="discount-rule-types" element={<DiscountRuleTypePage />} />
          <Route path="roles" element={<RoleView />} />
          <Route path="permissions" element={<PermissionView />} />
          <Route path="staffs" element={<StaffPage />} />
          <Route path="guests" element={<GuestView />} />
        </Route>

        {/* Catch-all redirects back to admin hotels dashboard */}
        <Route path="*" element={<Navigate to="/admin/hotels" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;