// One config object per report. The page renders the column picker, filters,
// table and export buttons from this, so adding a module = adding an entry here.

export type ReportModule =
  | 'promotions'
  | 'badges'
  | 'statistics'
  | 'all_users'
  | 'subscriptions'
  | 'promo_coupons'
  | 'search_statistics';

/** Filters shared by most reports: date range (created date), status, free-text search. */
export type FilterKey = 'dateRange' | 'status' | 'search';

/** How a single column can be filtered ("filter by field"). */
export type FieldType = 'text' | 'number' | 'boolean' | 'date';

/** Per-column filter values. text/boolean: `key`. number/date: `key__min` and `key__max`. */
export type FieldFilters = Record<string, string>;

export type ExportFormat = 'excel' | 'pdf';

/**
 * Tells the page how the API receives a column's filter. Columns WITHOUT this are filtered in the
 * browser instead (always correct, but every matching record has to be loaded first).
 */
export interface ServerFilter {
  eq?: string; // API filter name for an equals/contains value
  min?: string; // API filter name for a minimum (numbers) or "from" (dates)
  max?: string; // API filter name for a maximum (numbers) or "to" (dates)
  exact?: boolean; // the API matches exactly (otherwise it is a partial, case-insensitive match)
  numeric?: boolean; // send the value as a number
}

export interface ColumnDef {
  key: string; // exact column name the API expects (dot paths allowed)
  label: string; // what the admin sees
  type?: FieldType; // set = this column gets a "filter by field" control
  server?: ServerFilter;
}

export interface ReportConfig {
  label: string;
  description: string;
  /** Last segment of POST /admin/reports/export/:exportRoute (note: all_users -> all-users) */
  exportRoute: string;
  /** Statistics is a snapshot with no pagination */
  paginated: boolean;
  /**
   * true = the server's Excel file contains EVERY matching record, so the page downloads it directly.
   * false = the server file only has one page, so the page pages through /preview and builds the file.
   * Flip to true per report once you have checked the row count against the real total.
   */
  serverExportsAll?: boolean;
  columns: ColumnDef[];
  filters: FilterKey[];
  /** TODO: confirm the full list of valid status values per module with the backend */
  statusOptions?: string[];
}

export const REPORT_ORDER: ReportModule[] = [
  'statistics',
  'all_users',
  'badges',
  'promotions',
  'promo_coupons',
  'subscriptions',
  'search_statistics',
];

export const REPORTS: Record<ReportModule, ReportConfig> = {
  statistics: {
    label: 'Statistics',
    description: 'A current snapshot of registrations and active users.',
    exportRoute: 'statistics',
    paginated: false,
    filters: [],
    columns: [
      { key: 'totalRegistrations', label: 'Total registrations' },
      { key: 'serviceProviders.total', label: 'Service providers (total)' },
      { key: 'serviceProviders.active', label: 'Service providers (active)' },
      { key: 'customers.total', label: 'Customers (total)' },
      { key: 'totalActiveUsers', label: 'Active users' },
    ],
  },

  all_users: {
    label: 'All users',
    description: 'Every registered customer and service provider.',
    exportRoute: 'all-users',
    paginated: true,
    filters: ['dateRange', 'search'],
    columns: [
      { key: 'id', label: 'ID', type: 'text' },
      { key: 'uniq_id', label: 'Unique ID', type: 'text' },
      { key: 'type', label: 'Type', type: 'text', server: { eq: 'type', exact: true } },
      { key: 'firstname', label: 'First name', type: 'text' },
      { key: 'lastname', label: 'Last name', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'active', label: 'Active', type: 'boolean', server: { eq: 'active' } },
      { key: 'created_at', label: 'Joined', type: 'date' }, // covered by the date range above
    ],
  },

  badges: {
    label: 'Badges',
    description: 'Service providers and the badges they hold.',
    exportRoute: 'badges',
    paginated: true,
    filters: ['dateRange', 'status'],
    statusOptions: ['ACTIVE'],
    columns: [
      { key: 'id', label: 'ID', type: 'text' },
      { key: 'user_id', label: 'User ID', type: 'text' },
      { key: 'business_name', label: 'Business name', type: 'text' },
      { key: 'badge', label: 'Badge', type: 'text' },
      { key: 'badge_suspended', label: 'Suspended', type: 'boolean', server: { eq: 'badge_suspended' } },
      { key: 'created_at', label: 'Created', type: 'date' },
    ],
  },

  promotions: {
    label: 'Promotions',
    description: 'Payments and the promotions applied to them.',
    exportRoute: 'promotions',
    paginated: true,
    filters: ['dateRange', 'status'],
    statusOptions: ['SUCCESSFUL'],
    columns: [
      { key: 'id', label: 'ID', type: 'text' },
      { key: 'user_unique_id', label: 'User ID', type: 'text' },
      { key: 'amount', label: 'Amount', type: 'number', server: { min: 'min_amount', max: 'max_amount' } },
      { key: 'tnx_reference', label: 'Transaction ref', type: 'text' },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'promo_applied', label: 'Promo applied', type: 'boolean', server: { eq: 'promo_applied' } },
      { key: 'promo_type', label: 'Promo type', type: 'text', server: { eq: 'promo_type', exact: true } },
      { key: 'promo_amount', label: 'Promo amount', type: 'number' },
      { key: 'created_at', label: 'Created', type: 'date' },
    ],
  },

  promo_coupons: {
    label: 'Promo coupons',
    description: 'Coupon codes, their discounts and status.',
    exportRoute: 'promo-coupons',
    paginated: true,
    // The API docs list no filters for this report, so every filter runs in the browser.
    filters: [],
    columns: [
      { key: 'code', label: 'Code', type: 'text' },
      { key: 'discountType', label: 'Discount type', type: 'text' },
      { key: 'discountValue', label: 'Discount value', type: 'number' },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'createdAt', label: 'Created', type: 'date' },
    ],
  },

  subscriptions: {
    label: 'Subscriptions',
    description: 'Subscription payments and their expiry dates.',
    exportRoute: 'subscriptions',
    paginated: true,
    filters: ['dateRange', 'status'],
    statusOptions: ['SUCCESSFUL'],
    columns: [
      { key: 'id', label: 'ID', type: 'text' },
      { key: 'user_unique_id', label: 'User ID', type: 'text' },
      { key: 'amount', label: 'Amount', type: 'number' },
      { key: 'status', label: 'Payment status', type: 'text' },
      { key: 'subscription_status', label: 'Subscription status', type: 'text' },
      { key: 'expiry_date', label: 'Expires', type: 'date', server: { min: 'expiry_from', max: 'expiry_to' } },
      { key: 'created_at', label: 'Created', type: 'date' },
    ],
  },

  search_statistics: {
    label: 'Search analytics',
    description: 'What people search for, where, and how many results they got.',
    exportRoute: 'search-statistics',
    paginated: true,
    serverExportsAll: true, // the API docs state this export returns all matching records
    filters: ['dateRange'], // start_date / end_date apply to createdAt
    // More columns exist (_id, timestamp, updatedAt, search_address_geo, selected_search_item): add here if needed.
    columns: [
      { key: 'search_key_words', label: 'Keywords', type: 'text', server: { eq: 'search_key_words' } },
      { key: 'selected_category_text', label: 'Category', type: 'text', server: { eq: 'selected_category_text' } },
      {
        key: 'selected_category_id',
        label: 'Category ID',
        type: 'text',
        server: { eq: 'selected_category_id', exact: true, numeric: true },
      },
      { key: 'search_address', label: 'Address', type: 'text', server: { eq: 'search_address' } },
      {
        key: 'search_result_count',
        label: 'Results',
        type: 'text',
        server: { eq: 'search_result_count', exact: true, numeric: true },
      },
      { key: 'user_unique_id', label: 'User ID', type: 'text', server: { eq: 'user_unique_id' } },
      { key: 'createdAt', label: 'Date', type: 'date' }, // covered by the date range above
    ],
  },
};