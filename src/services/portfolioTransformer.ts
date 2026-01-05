import { PortfolioSummaryResponse, PortfolioStats, MutualFund } from '../types/portfolio'

export class PortfolioTransformer {
  // Transform API response to Portfolio Stats for dashboard cards
  static toPortfolioStats(apiData: PortfolioSummaryResponse): PortfolioStats {
    const overview = apiData.portfolio_overview
    
    // Calculate today's change (mock for now, will need actual daily data)
    const todayGainLoss = overview.current_value * 0.0081 // Mock 0.81% change
    const todayGainLossPercentage = 0.81
    
    return {
      totalInvested: overview.total_invested,
      currentValue: overview.current_value,
      totalReturns: overview.total_profit_loss,
      returnsPercentage: overview.unrealized_profit_loss_percentage,
      todayGainLoss,
      todayGainLossPercentage,
    }
  }

  // Transform API funds to UI Mutual Funds
  static toMutualFunds(apiData: PortfolioSummaryResponse): MutualFund[] {
    return apiData.funds
      .filter(fund => {
        // Only include funds with current holdings
        const totalCurrentValue = fund.folios.reduce((sum, folio) => sum + folio.current_value, 0)
        return totalCurrentValue > 0
      })
      .map(fund => {
        // Aggregate all folios for this fund
        const totalInvested = fund.folios.reduce((sum, folio) => sum + folio.total_invested, 0)
        const currentValue = fund.folios.reduce((sum, folio) => sum + folio.current_value, 0)
        const totalReturns = fund.folios.reduce((sum, folio) => sum + folio.unrealized_profit_loss, 0)
        const currentUnits = fund.folios.reduce((sum, folio) => sum + folio.current_units, 0)
        const folioNumbers = fund.folios.map(folio => folio.folio_number)

        // Calculate NAV (current value / current units)
        const nav = currentUnits > 0 ? currentValue / currentUnits : 0

        // Calculate returns percentage
        const returnsPercentage = totalInvested > 0 
          ? (totalReturns / totalInvested) * 100 
          : 0

        // Determine risk level based on scheme type
        const riskLevel = this.getRiskLevel(fund.scheme_type)

        // Mock values for fields not in API (will need separate API or calculation)
        const oneDayChange = Math.random() * 2 - 0.5 // -0.5% to 1.5%
        const oneMonthReturn = Math.random() * 5 + 1 // 1% to 6%
        const threeMonthReturn = Math.random() * 10 + 5 // 5% to 15%
        const oneYearReturn = returnsPercentage * 0.6 // Approximate
        const threeYearReturn = returnsPercentage * 0.4 // Approximate

        return {
          id: fund.isin,
          name: fund.scheme_name,
          category: this.formatSchemeType(fund.scheme_type),
          currentValue: Math.round(currentValue * 100) / 100,
          invested: Math.round(totalInvested * 100) / 100,
          returns: Math.round(totalReturns * 100) / 100,
          returnsPercentage: Math.round(returnsPercentage * 100) / 100,
          nav: Math.round(nav * 100) / 100,
          units: Math.round(currentUnits * 1000) / 1000,
          aum: 'N/A', // Not in API
          expenseRatio: 0, // Not in API
          riskLevel,
          oneDayChange: Math.round(oneDayChange * 100) / 100,
          oneMonthReturn: Math.round(oneMonthReturn * 100) / 100,
          threeMonthReturn: Math.round(threeMonthReturn * 100) / 100,
          oneYearReturn: Math.round(oneYearReturn * 100) / 100,
          threeYearReturn: Math.round(threeYearReturn * 100) / 100,
          folioNumbers,
          isin: fund.isin,
          amc: fund.amc,
        }
      })
      .sort((a, b) => b.currentValue - a.currentValue) // Sort by current value descending
  }

  private static getRiskLevel(schemeType: string): 'Low' | 'Medium' | 'High' {
    const type = schemeType.toLowerCase()
    if (type.includes('equity')) return 'High'
    if (type.includes('hybrid') || type.includes('balanced')) return 'Medium'
    if (type.includes('debt') || type.includes('liquid')) return 'Low'
    return 'Medium'
  }

  private static formatSchemeType(schemeType: string): string {
    const typeMap: Record<string, string> = {
      'EQUITY': 'Equity',
      'DEBT': 'Debt',
      'HYBRID': 'Hybrid',
      'LIQUID': 'Liquid',
      'ELSS': 'Tax Saver',
    }
    return typeMap[schemeType] || schemeType
  }
}
