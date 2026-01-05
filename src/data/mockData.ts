export interface MutualFund {
  id: string
  name: string
  category: string
  currentValue: number
  invested: number
  returns: number
  returnsPercentage: number
  nav: number
  units: number
  aum: string
  expenseRatio: number
  riskLevel: 'Low' | 'Medium' | 'High'
  oneDayChange: number
  oneMonthReturn: number
  threeMonthReturn: number
  oneYearReturn: number
  threeYearReturn: number
  folioNumbers?: string[]
  isin?: string
  amc?: string
}

export const mockMutualFunds: MutualFund[] = [
  {
    id: '1',
    name: 'HDFC Top 100 Fund',
    category: 'Large Cap',
    currentValue: 125000,
    invested: 100000,
    returns: 25000,
    returnsPercentage: 25.0,
    nav: 625.50,
    units: 199.84,
    aum: '₹25,432 Cr',
    expenseRatio: 1.85,
    riskLevel: 'Medium',
    oneDayChange: 1.2,
    oneMonthReturn: 3.5,
    threeMonthReturn: 8.2,
    oneYearReturn: 18.5,
    threeYearReturn: 15.8,
  },
  {
    id: '2',
    name: 'SBI Bluechip Fund',
    category: 'Large Cap',
    currentValue: 87500,
    invested: 75000,
    returns: 12500,
    returnsPercentage: 16.67,
    nav: 87.25,
    units: 1003.15,
    aum: '₹42,125 Cr',
    expenseRatio: 1.25,
    riskLevel: 'Low',
    oneDayChange: 0.8,
    oneMonthReturn: 2.8,
    threeMonthReturn: 7.1,
    oneYearReturn: 16.2,
    threeYearReturn: 14.5,
  },
  {
    id: '3',
    name: 'Axis Midcap Fund',
    category: 'Mid Cap',
    currentValue: 156000,
    invested: 120000,
    returns: 36000,
    returnsPercentage: 30.0,
    nav: 78.00,
    units: 2000.00,
    aum: '₹18,650 Cr',
    expenseRatio: 2.10,
    riskLevel: 'High',
    oneDayChange: -0.5,
    oneMonthReturn: 4.2,
    threeMonthReturn: 12.5,
    oneYearReturn: 28.3,
    threeYearReturn: 22.1,
  },
  {
    id: '4',
    name: 'ICICI Prudential Balanced Advantage',
    category: 'Hybrid',
    currentValue: 68000,
    invested: 60000,
    returns: 8000,
    returnsPercentage: 13.33,
    nav: 45.33,
    units: 1500.00,
    aum: '₹56,890 Cr',
    expenseRatio: 1.55,
    riskLevel: 'Low',
    oneDayChange: 0.3,
    oneMonthReturn: 1.9,
    threeMonthReturn: 5.5,
    oneYearReturn: 12.8,
    threeYearReturn: 11.2,
  },
  {
    id: '5',
    name: 'Kotak Small Cap Fund',
    category: 'Small Cap',
    currentValue: 94000,
    invested: 70000,
    returns: 24000,
    returnsPercentage: 34.29,
    nav: 188.00,
    units: 500.00,
    aum: '₹9,245 Cr',
    expenseRatio: 2.35,
    riskLevel: 'High',
    oneDayChange: 2.1,
    oneMonthReturn: 6.8,
    threeMonthReturn: 15.3,
    oneYearReturn: 32.5,
    threeYearReturn: 24.7,
  },
]

export interface PortfolioStats {
  totalInvested: number
  currentValue: number
  totalReturns: number
  returnsPercentage: number
  todayGainLoss: number
  todayGainLossPercentage: number
}

export const mockPortfolioStats: PortfolioStats = {
  totalInvested: 425000,
  currentValue: 530500,
  totalReturns: 105500,
  returnsPercentage: 24.82,
  todayGainLoss: 4250,
  todayGainLossPercentage: 0.81,
}
