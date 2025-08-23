/**
 * Energy & Utilities Analytics Module
 * Specialized tools for oil & gas, renewable energy, and utility analysis
 */

import { EventEmitter } from 'events';

class EnergyAnalyticsService extends EventEmitter {
  constructor() {
    super();
    this.commodityPrices = {
      oil: { current_price: 75, volatility: 0.35, mean_reversion: 0.15 },
      gas: { current_price: 3.5, volatility: 0.45, mean_reversion: 0.20 },
      coal: { current_price: 85, volatility: 0.30, mean_reversion: 0.12 },
      power: { current_price: 45, volatility: 0.25, mean_reversion: 0.18 }
    };

    this.reserveCategories = {
      proved_developed_producing: { risk_factor: 0.95, discount_rate: 0.08 },
      proved_developed_nonproducing: { risk_factor: 0.90, discount_rate: 0.10 },
      proved_undeveloped: { risk_factor: 0.80, discount_rate: 0.12 },
      probable: { risk_factor: 0.65, discount_rate: 0.15 },
      possible: { risk_factor: 0.35, discount_rate: 0.20 }
    };

    this.renewableTypes = {
      solar: { capacity_factor: 0.25, degradation_rate: 0.005, lifespan: 25 },
      wind_onshore: { capacity_factor: 0.35, degradation_rate: 0.002, lifespan: 20 },
      wind_offshore: { capacity_factor: 0.45, degradation_rate: 0.002, lifespan: 25 },
      hydroelectric: { capacity_factor: 0.40, degradation_rate: 0.001, lifespan: 50 },
      geothermal: { capacity_factor: 0.75, degradation_rate: 0.001, lifespan: 30 }
    };

    this.utilitySegments = {
      electric: { allowed_roe: 0.095, equity_ratio: 0.50, rate_base_growth: 0.04 },
      gas_distribution: { allowed_roe: 0.090, equity_ratio: 0.55, rate_base_growth: 0.03 },
      water: { allowed_roe: 0.085, equity_ratio: 0.45, rate_base_growth: 0.035 },
      renewable_developer: { target_roe: 0.12, equity_ratio: 0.30, development_risk: 0.15 }
    };
  }

  /**
   * Oil & Gas Analytics
   */
  async analyzeOilGasAssets(assetData) {
    try {
      const analysis = {
        reserve_valuation: await this.performReserveValuation(assetData),
        production_analysis: this.analyzeProductionProfile(assetData),
        drilling_economics: this.analyzeDrillingEconomics(assetData),
        commodity_hedging: this.analyzeHedgingStrategy(assetData),
        esg_assessment: this.performESGAssessment(assetData),
        portfolio_optimization: this.optimizePortfolio(assetData)
      };

      this.emit('analysis:completed', { type: 'oil_gas_assets', analysis });
      return analysis;
    } catch (error) {
      this.emit('analysis:error', { type: 'oil_gas_assets', error });
      throw error;
    }
  }

  async performReserveValuation(assetData) {
    const reserves = assetData.reserves || [];
    const valuationResults = {};

    for (const reserve of reserves) {
      const pv10 = this.calculatePV10(reserve);
      const pv15 = this.calculatePV15(reserve);
      const riskedValue = this.calculateRiskedValue(reserve);

      valuationResults[reserve.id] = {
        reserve_category: reserve.category,
        estimated_reserves: reserve.estimated_reserves,
        pv10_value: pv10,
        pv15_value: pv15,
        risked_value: riskedValue,
        decline_curve: this.buildDeclineCurve(reserve),
        development_timeline: this.createDevelopmentTimeline(reserve)
      };
    }

    return {
      individual_valuations: valuationResults,
      portfolio_summary: this.summarizePortfolioValue(valuationResults),
      sensitivity_analysis: this.performReserveSensitivity(reserves),
      price_scenarios: this.analyzeReservePriceScenarios(reserves)
    };
  }

  calculatePV10(reserve) {
    const productionProfile = this.buildProductionProfile(reserve);
    const priceAssumptions = this.getReservePriceStrip();
    let pv10 = 0;

    productionProfile.forEach((yearData, index) => {
      const year = index + 1;
      const revenue = yearData.production * priceAssumptions[year - 1];
      const operatingCosts = yearData.production * reserve.operating_cost_per_unit;
      const capitalCosts = yearData.capex || 0;
      const netCashFlow = revenue - operatingCosts - capitalCosts;
      
      const discountFactor = 1 / Math.pow(1.10, year); // 10% discount rate
      pv10 += netCashFlow * discountFactor;
    });

    return pv10;
  }

  calculatePV15(reserve) {
    const productionProfile = this.buildProductionProfile(reserve);
    const priceAssumptions = this.getReservePriceStrip();
    let pv15 = 0;

    productionProfile.forEach((yearData, index) => {
      const year = index + 1;
      const revenue = yearData.production * priceAssumptions[year - 1];
      const operatingCosts = yearData.production * reserve.operating_cost_per_unit;
      const capitalCosts = yearData.capex || 0;
      const netCashFlow = revenue - operatingCosts - capitalCosts;
      
      const discountFactor = 1 / Math.pow(1.15, year); // 15% discount rate
      pv15 += netCashFlow * discountFactor;
    });

    return pv15;
  }

  analyzeProductionProfile(assetData) {
    const wells = assetData.wells || [];
    const aggregateProfile = this.aggregateWellProduction(wells);
    
    return {
      historical_production: this.analyzeHistoricalProduction(wells),
      decline_analysis: this.analyzeDeclineRates(wells),
      type_curve_analysis: this.performTypeCurveAnalysis(wells),
      future_projections: aggregateProfile,
      eur_analysis: this.analyzeEstimatedUltimateRecovery(wells),
      productivity_trends: this.analyzeProductivityTrends(wells)
    };
  }

  analyzeDrillingEconomics(assetData) {
    const drillingProgram = assetData.drilling_program || {};
    
    return {
      breakeven_analysis: this.calculateBreakevenPrices(drillingProgram),
      drilling_inventory: this.assessDrillingInventory(drillingProgram),
      location_economics: this.rankLocationEconomics(drillingProgram),
      capital_efficiency: this.analyzCapitalEfficiency(drillingProgram),
      optimal_development: this.optimizeDevelopmentSequence(drillingProgram)
    };
  }

  /**
   * Renewable Energy Analytics
   */
  async analyzeRenewableProject(projectData) {
    try {
      const analysis = {
        project_economics: await this.performRenewableEconomics(projectData),
        energy_production: this.modelEnergyProduction(projectData),
        ppa_analysis: this.analyzePowerPurchaseAgreement(projectData),
        grid_integration: this.assessGridIntegration(projectData),
        environmental_impact: this.assessEnvironmentalImpact(projectData),
        financing_optimization: this.optimizeProjectFinancing(projectData)
      };

      this.emit('analysis:completed', { type: 'renewable_project', analysis });
      return analysis;
    } catch (error) {
      this.emit('analysis:error', { type: 'renewable_project', error });
      throw error;
    }
  }

  async performRenewableEconomics(projectData) {
    const projectType = projectData.technology_type;
    const techSpecs = this.renewableTypes[projectType] || this.renewableTypes.solar;
    
    const energyProduction = this.calculateAnnualEnergyProduction(projectData, techSpecs);
    const revenueProfile = this.buildRevenueProfile(projectData, energyProduction);
    const costProfile = this.buildCostProfile(projectData, techSpecs);
    
    return {
      project_irr: this.calculateProjectIRR(revenueProfile, costProfile),
      project_npv: this.calculateProjectNPV(revenueProfile, costProfile, projectData.discount_rate || 0.08),
      lcoe: this.calculateLCOE(projectData, energyProduction, costProfile),
      payback_period: this.calculatePaybackPeriod(revenueProfile, costProfile),
      debt_service_coverage: this.analyzeDSCR(revenueProfile, costProfile, projectData.debt),
      sensitivity_analysis: this.performRenewableSensitivity(projectData)
    };
  }

  calculateAnnualEnergyProduction(projectData, techSpecs) {
    const capacity = projectData.installed_capacity; // MW
    const capacityFactor = projectData.capacity_factor || techSpecs.capacity_factor;
    const degradationRate = techSpecs.degradation_rate;
    const lifespan = techSpecs.lifespan;
    
    const productionProfile = [];
    for (let year = 1; year <= lifespan; year++) {
      const degradationFactor = Math.pow(1 - degradationRate, year - 1);
      const annualProduction = capacity * capacityFactor * 8760 * degradationFactor; // MWh
      productionProfile.push({
        year,
        capacity_mw: capacity,
        capacity_factor: capacityFactor * degradationFactor,
        energy_production_mwh: annualProduction,
        degradation_factor: degradationFactor
      });
    }

    return productionProfile;
  }

  analyzePowerPurchaseAgreement(projectData) {
    const ppa = projectData.ppa || {};
    
    return {
      contract_analysis: this.analyzePPATerms(ppa),
      price_escalation: this.analyzePriceEscalation(ppa),
      curtailment_risk: this.assessCurtailmentRisk(ppa),
      counterparty_risk: this.assessCounterpartyRisk(ppa),
      merchant_exposure: this.analyzeMerchantExposure(ppa),
      optimization_opportunities: this.identifyPPAOptimizations(ppa)
    };
  }

  /**
   * Utility Rate Analysis
   */
  analyzeUtilityRateStructure(utilityData) {
    const segment = this.utilitySegments[utilityData.segment] || this.utilitySegments.electric;
    
    return {
      rate_base_analysis: this.analyzeRateBase(utilityData, segment),
      roe_analysis: this.analyzeReturnOnEquity(utilityData, segment),
      cost_recovery: this.analyzeCostRecovery(utilityData),
      regulatory_environment: this.assessRegulatoryEnvironment(utilityData),
      growth_projections: this.projectUtilityGrowth(utilityData, segment)
    };
  }

  analyzeRateBase(utilityData, segment) {
    const currentRateBase = utilityData.rate_base;
    const projectedGrowth = segment.rate_base_growth;
    const projectionYears = 5;
    
    const rateBaseProjection = [];
    for (let year = 1; year <= projectionYears; year++) {
      const projectedRateBase = currentRateBase * Math.pow(1 + projectedGrowth, year);
      rateBaseProjection.push({
        year: new Date().getFullYear() + year,
        rate_base: projectedRateBase,
        growth_rate: projectedGrowth,
        capex_additions: projectedRateBase * 0.08, // Assumed 8% capex rate
        depreciation: projectedRateBase * 0.035 // Assumed 3.5% depreciation rate
      });
    }

    return {
      current_rate_base: currentRateBase,
      projected_rate_base: rateBaseProjection,
      capex_program: this.analyzeCapexProgram(utilityData),
      depreciation_analysis: this.analyzeDepreciation(utilityData)
    };
  }

  /**
   * Energy Storage Economics
   */
  analyzeEnergyStorage(storageData) {
    return {
      technology_comparison: this.compareStorageTechnologies(storageData),
      value_stacking: this.analyzeValueStacking(storageData),
      grid_services: this.assessGridServices(storageData),
      cycling_analysis: this.analyzeCyclingEconomics(storageData),
      degradation_modeling: this.modelBatteryDegradation(storageData)
    };
  }

  analyzeValueStacking(storageData) {
    const valueStreams = {
      energy_arbitrage: this.calculateArbitrageValue(storageData),
      frequency_regulation: this.calculateRegulationValue(storageData),
      spinning_reserves: this.calculateReservesValue(storageData),
      capacity_payments: this.calculateCapacityValue(storageData),
      transmission_deferral: this.calculateDeferralValue(storageData),
      distribution_services: this.calculateDistributionValue(storageData)
    };

    const totalValue = Object.values(valueStreams).reduce((sum, stream) => sum + stream.annual_value, 0);

    return {
      value_streams: valueStreams,
      total_annual_value: totalValue,
      value_per_mwh: totalValue / (storageData.capacity * storageData.annual_cycles),
      optimization_strategy: this.optimizeValueStacking(valueStreams)
    };
  }

  // Helper Methods
  buildProductionProfile(reserve) {
    const initialProduction = reserve.initial_production_rate;
    const declineRate = reserve.decline_rate || 0.15; // 15% annual decline
    const economicLimit = reserve.economic_limit || initialProduction * 0.05;
    
    const profile = [];
    let currentProduction = initialProduction;
    let year = 1;

    while (currentProduction > economicLimit && year <= 30) {
      profile.push({
        year,
        production: currentProduction,
        decline_rate: declineRate,
        cumulative_production: profile.reduce((sum, p) => sum + p.production, 0) + currentProduction
      });
      
      currentProduction *= (1 - declineRate);
      year++;
    }

    return profile;
  }

  buildDeclineCurve(reserve) {
    const profile = this.buildProductionProfile(reserve);
    return {
      decline_type: reserve.decline_type || 'exponential',
      initial_rate: reserve.initial_production_rate,
      decline_rate: reserve.decline_rate,
      economic_life: profile.length,
      estimated_ultimate_recovery: profile.reduce((sum, p) => sum + p.production, 0)
    };
  }

  getReservePriceStrip() {
    // Simplified price strip - would typically come from market data
    const basPrice = this.commodityPrices.oil.current_price;
    const priceStrip = [];
    
    for (let year = 1; year <= 20; year++) {
      // Apply mean reversion and inflation
      const meanReversionFactor = Math.pow(0.95, year - 1);
      const inflationFactor = Math.pow(1.025, year - 1);
      const price = basPrice * meanReversionFactor * inflationFactor;
      priceStrip.push(price);
    }

    return priceStrip;
  }

  calculateLCOE(projectData, energyProduction, costProfile) {
    const discountRate = projectData.discount_rate || 0.08;
    let presentValueCosts = 0;
    let presentValueEnergy = 0;

    energyProduction.forEach((yearData, index) => {
      const year = index + 1;
      const discountFactor = 1 / Math.pow(1 + discountRate, year);
      
      presentValueCosts += (costProfile[index]?.total_costs || 0) * discountFactor;
      presentValueEnergy += yearData.energy_production_mwh * discountFactor;
    });

    return presentValueCosts / presentValueEnergy; // $/MWh
  }

  calculateProjectIRR(revenueProfile, costProfile) {
    const cashFlows = revenueProfile.map((revenue, index) => {
      return revenue.annual_revenue - (costProfile[index]?.total_costs || 0);
    });

    // Add initial investment as negative cash flow
    cashFlows.unshift(-costProfile[0]?.capital_cost || 0);

    return this.calculateIRR(cashFlows);
  }

  calculateIRR(cashFlows) {
    // Newton-Raphson method for IRR calculation
    let rate = 0.1; // Initial guess
    const maxIterations = 100;
    const tolerance = 0.00001;

    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      let dnpv = 0;

      cashFlows.forEach((cf, period) => {
        npv += cf / Math.pow(1 + rate, period);
        if (period > 0) {
          dnpv -= period * cf / Math.pow(1 + rate, period + 1);
        }
      });

      const newRate = rate - npv / dnpv;
      if (Math.abs(newRate - rate) < tolerance) {
        return newRate;
      }
      rate = newRate;
    }

    return rate; // Return best estimate if convergence not achieved
  }

  // Additional helper methods would be implemented here...
  calculateRiskedValue() { /* Implementation */ }
  createDevelopmentTimeline() { /* Implementation */ }
  summarizePortfolioValue() { /* Implementation */ }
  performReserveSensitivity() { /* Implementation */ }
  analyzeReservePriceScenarios() { /* Implementation */ }
  analyzeHistoricalProduction() { /* Implementation */ }
  analyzeDeclineRates() { /* Implementation */ }
  performTypeCurveAnalysis() { /* Implementation */ }
  aggregateWellProduction() { /* Implementation */ }
  analyzeEstimatedUltimateRecovery() { /* Implementation */ }
  analyzeProductivityTrends() { /* Implementation */ }
  calculateBreakevenPrices() { /* Implementation */ }
  assessDrillingInventory() { /* Implementation */ }
  rankLocationEconomics() { /* Implementation */ }
  analyzCapitalEfficiency() { /* Implementation */ }
  optimizeDevelopmentSequence() { /* Implementation */ }
  analyzeHedgingStrategy() { /* Implementation */ }
  performESGAssessment() { /* Implementation */ }
  optimizePortfolio() { /* Implementation */ }
  modelEnergyProduction() { /* Implementation */ }
  assessGridIntegration() { /* Implementation */ }
  assessEnvironmentalImpact() { /* Implementation */ }
  optimizeProjectFinancing() { /* Implementation */ }
  buildRevenueProfile() { /* Implementation */ }
  buildCostProfile() { /* Implementation */ }
  calculateProjectNPV() { /* Implementation */ }
  calculatePaybackPeriod() { /* Implementation */ }
  analyzeDSCR() { /* Implementation */ }
  performRenewableSensitivity() { /* Implementation */ }
  analyzePPATerms() { /* Implementation */ }
  analyzePriceEscalation() { /* Implementation */ }
  assessCurtailmentRisk() { /* Implementation */ }
  assessCounterpartyRisk() { /* Implementation */ }
  analyzeMerchantExposure() { /* Implementation */ }
  identifyPPAOptimizations() { /* Implementation */ }
  analyzeReturnOnEquity() { /* Implementation */ }
  analyzeCostRecovery() { /* Implementation */ }
  assessRegulatoryEnvironment() { /* Implementation */ }
  projectUtilityGrowth() { /* Implementation */ }
  analyzeCapexProgram() { /* Implementation */ }
  analyzeDepreciation() { /* Implementation */ }
  compareStorageTechnologies() { /* Implementation */ }
  assessGridServices() { /* Implementation */ }
  analyzeCyclingEconomics() { /* Implementation */ }
  modelBatteryDegradation() { /* Implementation */ }
  calculateArbitrageValue() { /* Implementation */ }
  calculateRegulationValue() { /* Implementation */ }
  calculateReservesValue() { /* Implementation */ }
  calculateCapacityValue() { /* Implementation */ }
  calculateDeferralValue() { /* Implementation */ }
  calculateDistributionValue() { /* Implementation */ }
  optimizeValueStacking() { /* Implementation */ }
}

export default new EnergyAnalyticsService();
