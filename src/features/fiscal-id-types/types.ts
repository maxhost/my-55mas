export type FiscalIdType = {
  id: string;
  code: string;
  sort_order: number;
  is_active: boolean;
};

export type FiscalIdTypeWithDetails = FiscalIdType & {
  translations: Record<string, string>;
  country_ids: string[];
};

export type FiscalIdTypeInput = {
  id?: string;
  code: string;
  sort_order: number;
  is_active: boolean;
  translations: Record<string, string>;
  country_ids: string[];
};

export type SaveFiscalIdTypeInput = {
  fiscalIdType: FiscalIdTypeInput;
};

export type CountryAdminOption = {
  id: string;
  code: string;
  name: string;
};
