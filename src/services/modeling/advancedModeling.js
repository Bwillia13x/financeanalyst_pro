// Advanced Financial Modeling Service - Phase 1 Implementation
export class AdvancedModelingService {
  constructor() {
    this.models = new Map();
    this.initializeModels();
  }

  initializeModels() {
    this.models.set('ma', new MergersAcquisitionsModel());
    this.models.set('sotp', new SumOfPartsModel());
    this.models.set('spinoff', new SpinoffAnalysisModel());
  }

  getModel(type) {
    return this.models.get(type);
  }
}

// M&A Analysis Model
export class MergersAcquisitionsModel {
  calculateAccretionAnalysis(inputs) {
    const {
      purchasePrice,
      targetEBITDA,
      targetShares,
      acquirerEBITDA,
      acquirerShares,
      acquirerMultiple,
      stockConsideration,
      synergies,
      taxRate = 25
    } = inputs;

    // Calculate exchange ratio and new shares
    const acquirerStockPrice = acquirerMultiple * (acquirerEBITDA / acquirerShares);
    const newSharesIssued = (purchasePrice * stockConsideration / 100) / acquirerStockPrice;
    const totalSharesPostDeal = acquirerShares + newSharesIssued;

    // Calculate pro forma metrics
    const proFormaEBITDA = acquirerEBITDA + targetEBITDA + synergies;
    const acquirerEPSPre = (acquirerEBITDA * 0.6) / acquirerShares; // Simplified
    const proFormaEPS = (proFormaEBITDA * 0.6) / totalSharesPostDeal;

    const accretionPercent = ((proFormaEPS - acquirerEPSPre) / acquirerEPSPre) * 100;

    return {
      newSharesIssued,
      totalSharesPostDeal,
      proFormaEBITDA,
      acquirerEPSPre,
      proFormaEPS,
      accretionPercent,
      isAccretive: accretionPercent > 0
    };
  }

  calculateSynergies(revenueSynergies, costSynergies, integrationCosts, taxRate = 25) {
    const totalRevenueSynergies = Object.values(revenueSynergies).reduce((sum, val) => sum + val, 0);
    const totalCostSynergies = Object.values(costSynergies).reduce((sum, val) => sum + val, 0);
    const totalSynergies = totalRevenueSynergies + totalCostSynergies;
    const totalIntegrationCosts = Object.values(integrationCosts).reduce((sum, val) => sum + val, 0);

    const afterTaxSynergies = totalSynergies * (1 - taxRate / 100);
    const afterTaxIntegrationCosts = totalIntegrationCosts * (1 - taxRate / 100);

    return {
      totalRevenueSynergies,
      totalCostSynergies,
      totalSynergies,
      afterTaxSynergies,
      totalIntegrationCosts,
      afterTaxIntegrationCosts,
      netSynergies: afterTaxSynergies - afterTaxIntegrationCosts
    };
  }

  calculatePurchasePriceAllocation(purchasePrice, bookValue, identifiableAssets) {
    const totalIdentifiable = Object.values(identifiableAssets).reduce((sum, val) => sum + val, 0);
    const goodwill = purchasePrice - bookValue - totalIdentifiable;

    return {
      bookValue,
      identifiableAssets,
      totalIdentifiable,
      goodwill,
      totalConsideration: purchasePrice,
      goodwillPercent: (goodwill / purchasePrice) * 100
    };
  }
}

// Sum-of-the-Parts Model
export class SumOfPartsModel {
  calculateSOTP(businessUnits) {
    const results = businessUnits.map(unit => {
      const {
        name,
        revenue,
        ebitda,
        multiple,
        method = 'ebitda_multiple',
        growthRate = 0,
        discountRate = 10,
        terminalValue = 0
      } = unit;

      let valuation = 0;
      
      switch (method) {
        case 'ebitda_multiple':
          valuation = ebitda * multiple;
          break;
        case 'revenue_multiple':
          valuation = revenue * multiple;
          break;
        case 'dcf':
          valuation = this.calculateDCFValue(revenue, growthRate, discountRate, terminalValue);
          break;
        default:
          valuation = ebitda * multiple;
      }

      return {
        name,
        revenue,
        ebitda,
        multiple,
        method,
        valuation,
        revenuePercent: 0, // Will be calculated after
        valuePercent: 0    // Will be calculated after
      };
    });

    const totalRevenue = results.reduce((sum, unit) => sum + unit.revenue, 0);
    const totalValue = results.reduce((sum, unit) => sum + unit.valuation, 0);

    // Calculate percentages
    results.forEach(unit => {
      unit.revenuePercent = (unit.revenue / totalRevenue) * 100;
      unit.valuePercent = (unit.valuation / totalValue) * 100;
    });

    return {
      businessUnits: results,
      totalRevenue,
      totalValue,
      impliedMultiple: totalValue / results.reduce((sum, unit) => sum + unit.ebitda, 0)
    };
  }

  calculateDCFValue(revenue, growthRate, discountRate, terminalValue) {
    // Simplified DCF calculation
    const projectedRevenue = revenue * Math.pow(1 + growthRate / 100, 5);
    const pv = projectedRevenue / Math.pow(1 + discountRate / 100, 5);
    return pv + terminalValue;
  }

  calculateConglomerateDiscount(sotpValue, tradingValue) {
    const discount = (tradingValue - sotpValue) / sotpValue;
    return {
      sotpValue,
      tradingValue,
      discount: discount * 100,
      discountAmount: sotpValue - tradingValue
    };
  }
}

// Spin-off Analysis Model  
export class SpinoffAnalysisModel {
  calculateSpinoffAnalysis(parentCompany, spinoffUnit) {
    const {
      parentRevenue,
      parentEBITDA,
      parentShares,
      parentMultiple,
      spinoffRevenue,
      spinoffEBITDA,
      spinoffMultiple,
      strandedCosts,
      transactionCosts,
      distributionRatio = 1 // 1:1 distribution
    } = { ...parentCompany, ...spinoffUnit };

    // Calculate pro forma parent (RemainCo)
    const remainCoRevenue = parentRevenue - spinoffRevenue;
    const remainCoEBITDA = parentEBITDA - spinoffEBITDA - strandedCosts;
    
    // Calculate valuations
    const parentPreSpinValue = parentEBITDA * parentMultiple;
    const remainCoValue = remainCoEBITDA * parentMultiple;
    const spinoffValue = spinoffEBITDA * spinoffMultiple;
    
    const sumOfPartsValue = remainCoValue + spinoffValue;
    const valueCreation = sumOfPartsValue - parentPreSpinValue - transactionCosts;
    
    // Calculate per-share values
    const remainCoValuePerShare = remainCoValue / parentShares;
    const spinoffValuePerShare = (spinoffValue / parentShares) * distributionRatio;
    const totalValuePerShare = remainCoValuePerShare + spinoffValuePerShare;
    const parentValuePerShare = parentPreSpinValue / parentShares;
    
    return {
      // Pro forma companies
      remainCo: {
        revenue: remainCoRevenue,
        ebitda: remainCoEBITDA,
        valuation: remainCoValue,
        valuePerShare: remainCoValuePerShare
      },
      
      spinoffCo: {
        revenue: spinoffRevenue,
        ebitda: spinoffEBITDA,
        valuation: spinoffValue,
        valuePerShare: spinoffValuePerShare
      },
      
      // Analysis results
      parentPreSpinValue,
      sumOfPartsValue,
      valueCreation,
      valueCreationPercent: (valueCreation / parentPreSpinValue) * 100,
      totalValuePerShare,
      parentValuePerShare,
      valueCreationPerShare: totalValuePerShare - parentValuePerShare,
      
      // Transaction costs
      strandedCosts,
      transactionCosts,
      totalCosts: strandomCosts + transactionCosts
    };
  }

  calculateTaxImplications(spinoffValue, costBasis, distributionType = 'tax-free') {
    if (distributionType === 'tax-free') {
      return {
        taxableGain: 0,
        taxLiability: 0,
        afterTaxValue: spinoffValue,
        costBasisAllocation: costBasis
      };
    }
    
    // Taxable distribution
    const taxableGain = Math.max(0, spinoffValue - costBasis);
    const taxRate = 20; // Assume 20% capital gains rate
    const taxLiability = taxableGain * (taxRate / 100);
    
    return {
      taxableGain,
      taxLiability,
      afterTaxValue: spinoffValue - taxLiability,
      effectiveTaxRate: (taxLiability / spinoffValue) * 100
    };
  }

  calculateStrandedCosts(sharedServices, spinoffRevenuePercent) {
    const strandedCostCategories = {
      corporate_overhead: sharedServices.corporate * (spinoffRevenuePercent / 100),
      it_systems: sharedServices.it * (spinoffRevenuePercent / 100),
      hr_finance: sharedServices.hr * (spinoffRevenuePercent / 100),
      facilities: sharedServices.facilities * (spinoffRevenuePercent / 100)
    };
    
    const totalStranded = Object.values(strandedCostCategories).reduce((sum, cost) => sum + cost, 0);
    
    return {
      categories: strandedCostCategories,
      total: totalStranded,
      percentOfRevenue: (totalStranded / (parentRevenue - spinoffRevenue)) * 100
    };
  }
}

export const advancedModelingService = new AdvancedModelingService();
