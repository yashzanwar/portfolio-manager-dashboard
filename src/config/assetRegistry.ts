/**
 * Asset Type Registry for Frontend
 * 
 * Centralized configuration for all asset types in the dashboard.
 * Reduces code duplication when adding new asset types.
 * 
 * Usage:
 * ```tsx
 * import { ASSET_REGISTRY, AssetType } from './config/assetRegistry';
 * 
 * const config = ASSET_REGISTRY[AssetType.EQUITY_STOCK];
 * const columns = config.columns;
 * const apiEndpoint = config.apiEndpoints.list(portfolioId);
 * ```
 */

import { ColumnDef } from '@tanstack/react-table';
import { formatCurrency, formatPercentage, formatDate, formatNumber } from '../utils/formatters';

// ============================================================================
// Types
// ============================================================================

export enum AssetType {
  MUTUAL_FUND = 'MUTUAL_FUND',
  EQUITY_STOCK = 'EQUITY_STOCK',
  PRECIOUS_METAL = 'PRECIOUS_METAL',
  // Future asset types:
  // FIXED_DEPOSIT = 'FIXED_DEPOSIT',
  // BOND = 'BOND',
  // REAL_ESTATE = 'REAL_ESTATE',
}

export interface TransactionTypeOption {
  value: string;
  label: string;
  isBuy: boolean; // For color coding
}

export interface AssetHolding {
  scheme_id: number;
  scheme_code: string;
  scheme_name: string;
  isin?: string;
  units: number;
  average_price: number;
  current_price: number;
  current_value: number;
  invested_value: number;
  unrealized_gain: number;
  unrealized_gain_percentage: number;
  asset_type: AssetType;
}

export interface ValidationRule {
  field: string;
  validator: (value: any) => string | null; // Returns error message or null
}

export interface AssetTypeConfig {
  // Basic Info
  type: AssetType;
  displayName: string;
  displayNamePlural: string;
  icon: string; // Icon component name or emoji
  color: string; // Tailwind color class

  // Table Configuration
  columns: ColumnDef<any>[];
  identifierField: keyof AssetHolding;
  displayNameField: keyof AssetHolding;

  // Transaction Configuration
  transactionTypes: TransactionTypeOption[];
  defaultTransactionType: string;

  // API Endpoints
  apiEndpoints: {
    list: (portfolioId: number) => string;
    create: (portfolioId: number) => string;
    bulkUpload: (portfolioId: number) => string;
    delete?: (portfolioId: number, transactionId: number) => string;
  };

  // Validation
  validationRules: ValidationRule[];

  // UI Features
  features: {
    supportsBulkUpload: boolean;
    supportsManualEntry: boolean;
    supportsRealTimePrice: boolean;
    showBrokerField: boolean;
    allowsFractionalUnits: boolean;
  };

  // Form Fields
  formFields: {
    identifier: {
      name: string;
      label: string;
      placeholder: string;
      type: 'text' | 'number' | 'select';
      required: boolean;
    };
    units: {
      label: string;
      placeholder: string;
      step: string; // '0.001' for fractional, '1' for whole numbers
    };
    price: {
      label: string;
      placeholder: string;
    };
  };
}

// ============================================================================
// Asset Type Configurations
// ============================================================================

// ----------------------------------------------------------------------------
// Mutual Funds
// ----------------------------------------------------------------------------

const MUTUAL_FUND_CONFIG: AssetTypeConfig = {
  type: AssetType.MUTUAL_FUND,
  displayName: 'Mutual Fund',
  displayNamePlural: 'Mutual Funds',
  icon: '📊',
  color: 'blue',

  identifierField: 'isin',
  displayNameField: 'scheme_name',

  columns: [
    {
      accessorKey: 'scheme_name',
      header: 'Scheme Name',
      cell: (info: any) => (
        <div className="max-w-xs truncate" title={info.getValue()}>
          {info.getValue()}
        </div>
      ),
    },
    {
      accessorKey: 'isin',
      header: 'ISIN',
      cell: (info: any) => <span className="font-mono text-sm">{info.getValue()}</span>,
    },
    {
      accessorKey: 'units',
      header: 'Units',
      cell: (info: any) => formatNumber(info.getValue()),
    },
    {
      accessorKey: 'average_price',
      header: 'Avg NAV',
      cell: (info: any) => formatCurrency(info.getValue()),
    },
    {
      accessorKey: 'current_price',
      header: 'Current NAV',
      cell: (info: any) => formatCurrency(info.getValue()),
    },
    {
      accessorKey: 'invested_value',
      header: 'Invested',
      cell: (info: any) => formatCurrency(info.getValue()),
    },
    {
      accessorKey: 'current_value',
      header: 'Current Value',
      cell: (info: any) => formatCurrency(info.getValue()),
    },
    {
      accessorKey: 'unrealized_gain',
      header: 'Gain/Loss',
      cell: (info: any) => {
        const gain = info.getValue();
        return (
          <span className={gain >= 0 ? 'text-green-600' : 'text-red-600'}>
            {formatCurrency(gain)}
          </span>
        );
      },
    },
    {
      accessorKey: 'unrealized_gain_percentage',
      header: 'Gain %',
      cell: (info: any) => {
        const gainPct = info.getValue();
        return (
          <span className={gainPct >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
            {formatPercentage(gainPct)}
          </span>
        );
      },
    },
  ],

  transactionTypes: [
    { value: 'PURCHASE', label: 'Purchase', isBuy: true },
    { value: 'REDEMPTION', label: 'Redemption', isBuy: false },
    { value: 'SIP', label: 'SIP', isBuy: true },
    { value: 'SWP', label: 'SWP', isBuy: false },
    { value: 'DIVIDEND', label: 'Dividend', isBuy: false },
  ],
  defaultTransactionType: 'PURCHASE',

  apiEndpoints: {
    list: (portfolioId) => `/api/portfolios/${portfolioId}/transactions?assetType=MUTUAL_FUND`,
    create: (portfolioId) => `/api/portfolios/${portfolioId}/transactions`,
    bulkUpload: (portfolioId) => `/api/portfolios/${portfolioId}/bulk-upload`,
  },

  validationRules: [
    {
      field: 'isin',
      validator: (value) => {
        if (!value) return 'ISIN is required';
        if (!/^[A-Z]{2}[A-Z0-9]{10}$/.test(value)) return 'Invalid ISIN format';
        return null;
      },
    },
    {
      field: 'units',
      validator: (value) => {
        if (!value || value <= 0) return 'Units must be greater than zero';
        return null;
      },
    },
  ],

  features: {
    supportsBulkUpload: true,
    supportsManualEntry: true,
    supportsRealTimePrice: false,
    showBrokerField: false,
    allowsFractionalUnits: true,
  },

  formFields: {
    identifier: {
      name: 'isin',
      label: 'ISIN',
      placeholder: 'INF123456789',
      type: 'text',
      required: true,
    },
    units: {
      label: 'Units',
      placeholder: '100.50',
      step: '0.001',
    },
    price: {
      label: 'NAV',
      placeholder: '50.75',
    },
  },
};

// ----------------------------------------------------------------------------
// Equity Stocks
// ----------------------------------------------------------------------------

const EQUITY_STOCK_CONFIG: AssetTypeConfig = {
  type: AssetType.EQUITY_STOCK,
  displayName: 'Stock',
  displayNamePlural: 'Stocks',
  icon: '📈',
  color: 'green',

  identifierField: 'isin',
  displayNameField: 'scheme_name',

  columns: [
    {
      accessorKey: 'scheme_name',
      header: 'Company',
      cell: (info: any) => (
        <div className="max-w-xs truncate font-semibold" title={info.getValue()}>
          {info.getValue()}
        </div>
      ),
    },
    {
      accessorKey: 'ticker_symbol',
      header: 'Ticker',
      cell: (info: any) => <span className="font-mono font-bold text-blue-600">{info.getValue()}</span>,
    },
    {
      accessorKey: 'units',
      header: 'Shares',
      cell: (info: any) => formatNumber(info.getValue(), 0), // Whole numbers for stocks
    },
    {
      accessorKey: 'average_price',
      header: 'Avg Price',
      cell: (info: any) => formatCurrency(info.getValue()),
    },
    {
      accessorKey: 'current_price',
      header: 'LTP',
      cell: (info: any) => formatCurrency(info.getValue()),
    },
    {
      accessorKey: 'invested_value',
      header: 'Invested',
      cell: (info: any) => formatCurrency(info.getValue()),
    },
    {
      accessorKey: 'current_value',
      header: 'Current Value',
      cell: (info: any) => formatCurrency(info.getValue()),
    },
    {
      accessorKey: 'unrealized_gain',
      header: 'P&L',
      cell: (info: any) => {
        const gain = info.getValue();
        return (
          <span className={gain >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
            {formatCurrency(gain)}
          </span>
        );
      },
    },
    {
      accessorKey: 'unrealized_gain_percentage',
      header: 'Returns %',
      cell: (info: any) => {
        const gainPct = info.getValue();
        return (
          <span className={gainPct >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
            {formatPercentage(gainPct)}
          </span>
        );
      },
    },
  ],

  transactionTypes: [
    { value: 'STOCK_BUY', label: 'Buy', isBuy: true },
    { value: 'STOCK_SELL', label: 'Sell', isBuy: false },
    { value: 'DIVIDEND', label: 'Dividend', isBuy: false },
    { value: 'BONUS', label: 'Bonus', isBuy: true },
    { value: 'SPLIT', label: 'Split', isBuy: false },
  ],
  defaultTransactionType: 'STOCK_BUY',

  apiEndpoints: {
    list: (portfolioId) => `/api/portfolios/${portfolioId}/stocks/transactions`,
    create: (portfolioId) => `/api/portfolios/${portfolioId}/stocks/transactions`,
    bulkUpload: (portfolioId) => `/api/portfolios/${portfolioId}/stocks/bulk-upload`,
  },

  validationRules: [
    {
      field: 'ticker',
      validator: (value) => {
        if (!value) return 'Ticker symbol is required';
        if (!/^[A-Z0-9]+$/.test(value)) return 'Invalid ticker format';
        return null;
      },
    },
    {
      field: 'units',
      validator: (value) => {
        if (!value || value <= 0) return 'Shares must be greater than zero';
        if (!Number.isInteger(value)) return 'Shares must be whole numbers';
        return null;
      },
    },
  ],

  features: {
    supportsBulkUpload: true,
    supportsManualEntry: true,
    supportsRealTimePrice: true,
    showBrokerField: true,
    allowsFractionalUnits: false, // Stocks must be whole numbers
  },

  formFields: {
    identifier: {
      name: 'ticker',
      label: 'Ticker Symbol',
      placeholder: 'RELIANCE, TCS',
      type: 'text',
      required: true,
    },
    units: {
      label: 'Shares',
      placeholder: '10',
      step: '1', // Whole numbers only
    },
    price: {
      label: 'Price per Share',
      placeholder: '2500.00',
    },
  },
};

// ----------------------------------------------------------------------------
// Precious Metals
// ----------------------------------------------------------------------------

const PRECIOUS_METAL_CONFIG: AssetTypeConfig = {
  type: AssetType.PRECIOUS_METAL,
  displayName: 'Metal',
  displayNamePlural: 'Metals',
  icon: '🥇',
  color: 'yellow',

  identifierField: 'scheme_code',
  displayNameField: 'scheme_name',

  columns: [
    {
      accessorKey: 'scheme_name',
      header: 'Metal Type',
      cell: (info: any) => (
        <div className="flex items-center gap-2">
          <span className="text-xl">
            {info.getValue().includes('Gold') ? '🥇' : '⚪'}
          </span>
          <span className="font-semibold">{info.getValue()}</span>
        </div>
      ),
    },
    {
      accessorKey: 'metal_type',
      header: 'Type',
      cell: (info: any) => <span className="uppercase font-mono">{info.getValue()}</span>,
    },
    {
      accessorKey: 'purity',
      header: 'Purity',
      cell: (info: any) => <span className="font-semibold">{info.getValue()}</span>,
    },
    {
      accessorKey: 'units',
      header: 'Grams',
      cell: (info: any) => `${formatNumber(info.getValue())}g`,
    },
    {
      accessorKey: 'average_price',
      header: 'Avg Price/g',
      cell: (info: any) => formatCurrency(info.getValue()),
    },
    {
      accessorKey: 'current_price',
      header: 'Current Price/g',
      cell: (info: any) => formatCurrency(info.getValue()),
    },
    {
      accessorKey: 'invested_value',
      header: 'Invested',
      cell: (info: any) => formatCurrency(info.getValue()),
    },
    {
      accessorKey: 'current_value',
      header: 'Current Value',
      cell: (info: any) => formatCurrency(info.getValue()),
    },
    {
      accessorKey: 'unrealized_gain',
      header: 'Gain/Loss',
      cell: (info: any) => {
        const gain = info.getValue();
        return (
          <span className={gain >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
            {formatCurrency(gain)}
          </span>
        );
      },
    },
    {
      accessorKey: 'unrealized_gain_percentage',
      header: 'Returns %',
      cell: (info: any) => {
        const gainPct = info.getValue();
        return (
          <span className={gainPct >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
            {formatPercentage(gainPct)}
          </span>
        );
      },
    },
  ],

  transactionTypes: [
    { value: 'METAL_BUY', label: 'Buy', isBuy: true },
    { value: 'METAL_SELL', label: 'Sell', isBuy: false },
  ],
  defaultTransactionType: 'METAL_BUY',

  apiEndpoints: {
    list: (portfolioId) => `/api/portfolios/${portfolioId}/metals/transactions`,
    create: (portfolioId) => `/api/portfolios/${portfolioId}/metals/transactions`,
    bulkUpload: (portfolioId) => `/api/portfolios/${portfolioId}/metals/bulk-upload`,
  },

  validationRules: [
    {
      field: 'scheme_code',
      validator: (value) => {
        if (!value) return 'Metal type is required';
        const validCodes = ['GOLD_24K', 'GOLD_22K', 'SILVER_999'];
        if (!validCodes.includes(value)) return 'Invalid metal type';
        return null;
      },
    },
    {
      field: 'units',
      validator: (value) => {
        if (!value || value <= 0) return 'Weight must be greater than zero';
        return null;
      },
    },
  ],

  features: {
    supportsBulkUpload: true,
    supportsManualEntry: true,
    supportsRealTimePrice: false,
    showBrokerField: false,
    allowsFractionalUnits: true,
  },

  formFields: {
    identifier: {
      name: 'scheme_code',
      label: 'Metal Type',
      placeholder: 'Select metal',
      type: 'select',
      required: true,
    },
    units: {
      label: 'Weight (grams)',
      placeholder: '10.5',
      step: '0.001',
    },
    price: {
      label: 'Price per Gram',
      placeholder: '6500.00',
    },
  },
};

// ============================================================================
// Asset Registry
// ============================================================================

export const ASSET_REGISTRY: Record<AssetType, AssetTypeConfig> = {
  [AssetType.MUTUAL_FUND]: MUTUAL_FUND_CONFIG,
  [AssetType.EQUITY_STOCK]: EQUITY_STOCK_CONFIG,
  [AssetType.PRECIOUS_METAL]: PRECIOUS_METAL_CONFIG,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get asset type configuration by type.
 */
export function getAssetConfig(assetType: AssetType): AssetTypeConfig {
  const config = ASSET_REGISTRY[assetType];
  if (!config) {
    throw new Error(`No configuration found for asset type: ${assetType}`);
  }
  return config;
}

/**
 * Get all registered asset types.
 */
export function getAllAssetTypes(): AssetType[] {
  return Object.keys(ASSET_REGISTRY) as AssetType[];
}

/**
 * Validate transaction data using asset-specific rules.
 */
export function validateTransaction(assetType: AssetType, data: any): { valid: boolean; errors: string[] } {
  const config = getAssetConfig(assetType);
  const errors: string[] = [];

  for (const rule of config.validationRules) {
    const error = rule.validator(data[rule.field]);
    if (error) {
      errors.push(error);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get transaction type options for dropdown.
 */
export function getTransactionTypeOptions(assetType: AssetType): TransactionTypeOption[] {
  const config = getAssetConfig(assetType);
  return config.transactionTypes;
}

/**
 * Check if asset type supports a feature.
 */
export function supportsFeature(assetType: AssetType, feature: keyof AssetTypeConfig['features']): boolean {
  const config = getAssetConfig(assetType);
  return config.features[feature];
}

/**
 * Get API endpoint for an operation.
 */
export function getApiEndpoint(
  assetType: AssetType,
  operation: 'list' | 'create' | 'bulkUpload',
  portfolioId: number
): string {
  const config = getAssetConfig(assetType);
  return config.apiEndpoints[operation](portfolioId);
}
