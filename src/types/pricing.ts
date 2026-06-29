export interface DiscountCondition {
  minNights?: number | null;
  maxNights?: number | null;
  minAdvanceBookingDays?: number | null;
  promoCode?: string | null;
}

export interface DiscountTierRequest {
  conditions: DiscountCondition;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
}

export interface DiscountRuleCreateRequest {
  campaignId?: number | null;
  ruleTypeCode: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  appliedRoomTypeIds: number[];
  tiers: DiscountTierRequest[];
  status: 'ACTIVE' | 'INACTIVE';
}

export interface DiscountRuleResponse {
  id: number;
  hotelRoomTypeId: number;
  hotelRoomTypeName: string;
  campaignId?: number | null;
  ruleTypeCode: string;
  conditions: DiscountCondition;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'ACTIVE' | 'INACTIVE';
}

export interface DiscountRuleUpdateRequest {
  hotelRoomTypeId: number;
  campaignId?: number | null;
  ruleTypeCode: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'ACTIVE' | 'INACTIVE';
  conditions: DiscountCondition;
}

// Campaign DTOs
export interface CampaignResponse {
  id: number;
  hotelId: number;
  name: string;
  description?: string | null;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'ACTIVE' | 'INACTIVE';
}

export interface CampaignCreateRequest {
  hotelId: number;
  name: string;
  description?: string | null;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'ACTIVE' | 'INACTIVE';
}

export interface CampaignUpdateRequest {
  hotelId: number;
  name: string;
  description?: string | null;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'ACTIVE' | 'INACTIVE';
}

// Pricing Rule DTOs
export interface PricingRuleResponse {
  id: number;
  hotelRoomTypeId: number;
  hotelRoomTypeName: string;
  holidayCalendarId?: number | null;
  holidayCalendarName?: string | null;
  ruleTypeCode: string;
  adjustmentType: 'PERCENT' | 'FIXED';
  adjustmentValue: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'ACTIVE' | 'INACTIVE';
}

export interface PricingRuleCreateRequest {
  hotelRoomTypeId: number;
  holidayCalendarId?: number | null;
  ruleTypeCode: string;
  adjustmentType: 'PERCENT' | 'FIXED';
  adjustmentValue: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'ACTIVE' | 'INACTIVE';
}

export interface PricingRuleUpdateRequest {
  hotelRoomTypeId: number;
  holidayCalendarId?: number | null;
  ruleTypeCode: string;
  adjustmentType: 'PERCENT' | 'FIXED';
  adjustmentValue: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'ACTIVE' | 'INACTIVE';
}

// Surcharge Rule DTOs
export interface SurchargeRuleResponse {
  id: number;
  hotelRoomTypeId: number;
  hotelRoomTypeName: string;
  ruleType: string;
  guestType?: 'ADULT' | 'CHILD' | 'INFANT' | null;
  adjustmentType: 'PERCENT' | 'FIXED';
  adjustmentValue: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'ACTIVE' | 'INACTIVE';
}

export interface SurchargeRuleCreateRequest {
  hotelRoomTypeId: number;
  ruleType: string;
  guestType?: 'ADULT' | 'CHILD' | 'INFANT' | null;
  adjustmentType: 'PERCENT' | 'FIXED';
  adjustmentValue: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'ACTIVE' | 'INACTIVE';
}

export interface SurchargeRuleUpdateRequest {
  hotelRoomTypeId: number;
  ruleType: string;
  guestType?: 'ADULT' | 'CHILD' | 'INFANT' | null;
  adjustmentType: 'PERCENT' | 'FIXED';
  adjustmentValue: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'ACTIVE' | 'INACTIVE';
}

// Config Types for Rule Types
export interface RuleTypeResponse {
  code: string;
  displayName: string;
  priority: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface RuleTypeCreateRequest {
  code: string;
  displayName: string;
  priority: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface RuleTypeUpdateRequest {
  displayName: string;
  priority: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface HolidayCalendarResponse {
  id: number;
  name: string;
  date: string; // YYYY-MM-DD
  status: 'ACTIVE' | 'INACTIVE';
}

export interface VatRuleResponse {
  id: number;
  vatCode: string;
  vatName: string;
  vatPercent: number;
  appliesTo: string;
  startDate?: string | null;
  endDate?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}
