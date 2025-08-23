// Industry-Specific Financial Model Templates
export class IndustryTemplateService {
  constructor() {
    this.templates = new Map();
    this.initializeTemplates();
  }

  initializeTemplates() {
    // Technology Sector Templates
    this.registerTemplate('technology', 'saas', this.getSaaSTemplate());
    this.registerTemplate('technology', 'marketplace', this.getMarketplaceTemplate());
    this.registerTemplate('technology', 'hardware', this.getHardwareTemplate());

    // Healthcare Sector Templates
    this.registerTemplate('healthcare', 'biotech', this.getBiotechTemplate());
    this.registerTemplate('healthcare', 'medical_device', this.getMedicalDeviceTemplate());

    // Real Estate Templates
    this.registerTemplate('realestate', 'reit', this.getREITTemplate());
    this.registerTemplate('realestate', 'development', this.getDevelopmentTemplate());

    // Energy Templates
    this.registerTemplate('energy', 'oil_gas', this.getOilGasTemplate());
    this.registerTemplate('energy', 'renewable', this.getRenewableTemplate());
  }

  registerTemplate(sector, type, template) {
    const key = `${sector}_${type}`;
    this.templates.set(key, template);
  }

  getTemplate(sector, type) {
    const key = `${sector}_${type}`;
    return this.templates.get(key);
  }

  getAllTemplates() {
    return Array.from(this.templates.entries()).reduce((acc, [key, template]) => {
      const [sector, type] = key.split('_');
      if (!acc[sector]) acc[sector] = {};
      acc[sector][type] = template;
      return acc;
    }, {});
  }

  // Technology - SaaS Template
  getSaaSTemplate() {
    return {
      id: 'saas_model',
      name: 'SaaS Business Model',
      description: 'Software-as-a-Service revenue and growth modeling',
      category: 'Technology',

      inputs: {
        arr: { label: 'Annual Recurring Revenue ($M)', value: 100, type: 'currency' },
        arr_growth_rate: { label: 'ARR Growth Rate (%)', value: 25, type: 'percentage' },
        customers: { label: 'Total Customers', value: 5000, type: 'number' },
        arpu: { label: 'Average Revenue Per User', value: 20000, type: 'currency' },
        cac: { label: 'Customer Acquisition Cost', value: 5000, type: 'currency' },
        ltv: { label: 'Customer Lifetime Value', value: 25000, type: 'currency' },
        gross_margin: { label: 'Gross Margin (%)', value: 85, type: 'percentage' },
        monthly_churn: { label: 'Monthly Churn Rate (%)', value: 2, type: 'percentage' },
        nrr: { label: 'Net Revenue Retention (%)', value: 110, type: 'percentage' },
        rd_percent: { label: 'R&D as % of Revenue', value: 20, type: 'percentage' },
        sales_marketing_percent: { label: 'Sales & Marketing %', value: 40, type: 'percentage' }
      },

      calculations: {
        rule_of_40: (inputs) => inputs.arr_growth_rate + (inputs.gross_margin - inputs.sales_marketing_percent - inputs.rd_percent),
        magic_number: (inputs) => (inputs.arr * inputs.arr_growth_rate / 100) / (inputs.arr * inputs.sales_marketing_percent / 100),
        unit_economics_score: (inputs) => inputs.ltv / inputs.cac,
        annual_churn: (inputs) => 1 - Math.pow(1 - inputs.monthly_churn / 100, 12)
      },

      keyMetrics: ['ARR', 'MRR', 'CAC', 'LTV', 'LTV/CAC Ratio', 'NRR', 'Churn Rate', 'Rule of 40'],

      benchmarks: {
        arr_growth: { excellent: 40, good: 25, average: 15 },
        nrr: { excellent: 130, good: 110, average: 100 },
        ltv_cac: { excellent: 5, good: 3, average: 2 },
        monthly_churn: { excellent: 1, good: 2, average: 3 }
      }
    };
  }

  // Technology - Marketplace Template
  getMarketplaceTemplate() {
    return {
      id: 'marketplace_model',
      name: 'Marketplace Business Model',
      description: 'Two-sided marketplace with network effects',
      category: 'Technology',

      inputs: {
        gmv: { label: 'Gross Merchandise Value ($M)', value: 500, type: 'currency' },
        take_rate: { label: 'Take Rate (%)', value: 8, type: 'percentage' },
        active_buyers: { label: 'Monthly Active Buyers', value: 100000, type: 'number' },
        active_sellers: { label: 'Monthly Active Sellers', value: 25000, type: 'number' },
        avg_order_value: { label: 'Average Order Value', value: 150, type: 'currency' },
        frequency: { label: 'Purchase Frequency (per year)', value: 8, type: 'number' },
        buyer_retention: { label: 'Annual Buyer Retention (%)', value: 75, type: 'percentage' },
        seller_retention: { label: 'Annual Seller Retention (%)', value: 85, type: 'percentage' }
      },

      calculations: {
        net_revenue: (inputs) => inputs.gmv * inputs.take_rate / 100,
        marketplace_liquidity: (inputs) => inputs.active_sellers / inputs.active_buyers,
        network_density: (inputs) => inputs.gmv / (inputs.active_buyers + inputs.active_sellers)
      },

      keyMetrics: ['GMV', 'Take Rate', 'Net Revenue', 'Active Users', 'Liquidity Ratio', 'Network Effects']
    };
  }

  // Technology - Hardware Template
  getHardwareTemplate() {
    return {
      id: 'hardware_model',
      name: 'Hardware Technology Model',
      description: 'Hardware manufacturing with R&D cycles',
      category: 'Technology',

      inputs: {
        units_sold: { label: 'Units Sold (millions)', value: 50, type: 'number' },
        asp: { label: 'Average Selling Price', value: 800, type: 'currency' },
        gross_margin: { label: 'Gross Margin (%)', value: 40, type: 'percentage' },
        cogs_material: { label: 'Material Cost per Unit', value: 300, type: 'currency' },
        cogs_labor: { label: 'Labor Cost per Unit', value: 50, type: 'currency' },
        rd_intensity: { label: 'R&D as % of Revenue', value: 8, type: 'percentage' },
        product_lifecycle: { label: 'Product Lifecycle (years)', value: 3, type: 'number' }
      },

      keyMetrics: ['Units Sold', 'ASP', 'Gross Margin', 'COGS', 'R&D Intensity', 'Product Lifecycle']
    };
  }

  // Healthcare - Biotech Template
  getBiotechTemplate() {
    return {
      id: 'biotech_model',
      name: 'Biotechnology Company Model',
      description: 'Drug development pipeline with clinical trials',
      category: 'Healthcare',

      inputs: {
        phase1_assets: { label: 'Phase I Assets', value: 3, type: 'number' },
        phase2_assets: { label: 'Phase II Assets', value: 2, type: 'number' },
        phase3_assets: { label: 'Phase III Assets', value: 1, type: 'number' },
        phase1_success: { label: 'Phase I Success Rate (%)', value: 65, type: 'percentage' },
        phase2_success: { label: 'Phase II Success Rate (%)', value: 35, type: 'percentage' },
        phase3_success: { label: 'Phase III Success Rate (%)', value: 65, type: 'percentage' },
        peak_sales: { label: 'Peak Sales Potential ($M)', value: 2000, type: 'currency' },
        development_cost: { label: 'Total Development Cost ($M)', value: 230, type: 'currency' },
        discount_rate: { label: 'Risk-Adjusted Discount Rate (%)', value: 12, type: 'percentage' }
      },

      calculations: {
        overall_success_prob: (inputs) => (inputs.phase1_success / 100) * (inputs.phase2_success / 100) * (inputs.phase3_success / 100),
        risk_adjusted_npv: (inputs) => {
          const successProb = this.calculations.overall_success_prob(inputs);
          return (inputs.peak_sales * successProb) - inputs.development_cost;
        }
      },

      keyMetrics: ['Pipeline rNPV', 'Success Probability', 'Peak Sales', 'Development Cost', 'Patent Life']
    };
  }

  // Healthcare - Medical Device Template
  getMedicalDeviceTemplate() {
    return {
      id: 'medical_device_model',
      name: 'Medical Device Company Model',
      description: 'Medical device manufacturing and regulatory',
      category: 'Healthcare',

      inputs: {
        device_sales: { label: 'Device Sales Revenue ($M)', value: 500, type: 'currency' },
        consumable_sales: { label: 'Consumable Sales ($M)', value: 200, type: 'currency' },
        service_revenue: { label: 'Service Revenue ($M)', value: 100, type: 'currency' },
        manufacturing_margin: { label: 'Manufacturing Margin (%)', value: 70, type: 'percentage' },
        rd_percent: { label: 'R&D as % of Revenue', value: 12, type: 'percentage' },
        regulatory_cost: { label: 'Regulatory Cost ($M)', value: 10, type: 'currency' }
      },

      keyMetrics: ['Device Revenue', 'Consumable Attach Rate', 'Service Revenue', 'Regulatory Timeline', 'R&D Pipeline']
    };
  }

  // Real Estate - REIT Template
  getREITTemplate() {
    return {
      id: 'reit_model',
      name: 'Real Estate Investment Trust',
      description: 'REIT with property portfolio and dividends',
      category: 'Real Estate',

      inputs: {
        total_properties: { label: 'Total Properties', value: 150, type: 'number' },
        occupancy_rate: { label: 'Occupancy Rate (%)', value: 92, type: 'percentage' },
        rental_income: { label: 'Rental Income ($M)', value: 800, type: 'currency' },
        noi: { label: 'Net Operating Income ($M)', value: 600, type: 'currency' },
        cap_rate: { label: 'Capitalization Rate (%)', value: 6.5, type: 'percentage' },
        ffo: { label: 'Funds from Operations ($M)', value: 500, type: 'currency' },
        dividend_yield: { label: 'Dividend Yield (%)', value: 4.2, type: 'percentage' },
        payout_ratio: { label: 'FFO Payout Ratio (%)', value: 80, type: 'percentage' }
      },

      calculations: {
        noi_margin: (inputs) => inputs.noi / inputs.rental_income,
        implied_property_value: (inputs) => inputs.noi / (inputs.cap_rate / 100),
        dividend_coverage: (inputs) => 1 / (inputs.payout_ratio / 100)
      },

      keyMetrics: ['FFO', 'AFFO', 'NOI', 'Occupancy', 'Cap Rate', 'NAV', 'Dividend Yield']
    };
  }

  // Real Estate - Development Template
  getDevelopmentTemplate() {
    return {
      id: 'development_model',
      name: 'Real Estate Development Model',
      description: 'Development project with construction phases',
      category: 'Real Estate',

      inputs: {
        total_units: { label: 'Total Units', value: 200, type: 'number' },
        land_cost: { label: 'Land Cost ($M)', value: 15, type: 'currency' },
        construction_cost: { label: 'Construction Cost ($M)', value: 48, type: 'currency' },
        stabilized_rent: { label: 'Stabilized Rent PSF', value: 35, type: 'currency' },
        exit_cap_rate: { label: 'Exit Cap Rate (%)', value: 5.5, type: 'percentage' },
        development_period: { label: 'Development Period (months)', value: 24, type: 'number' }
      },

      calculations: {
        total_cost: (inputs) => inputs.land_cost + inputs.construction_cost,
        development_yield: (inputs) => (inputs.stabilized_rent * inputs.total_units * 12) / this.calculations.total_cost(inputs)
      },

      keyMetrics: ['Total Development Cost', 'Yield on Cost', 'IRR', 'Development Timeline', 'Exit Value']
    };
  }

  // Energy - Oil & Gas Template
  getOilGasTemplate() {
    return {
      id: 'oil_gas_model',
      name: 'Oil & Gas Company Model',
      description: 'Oil & gas exploration and production',
      category: 'Energy',

      inputs: {
        daily_production: { label: 'Daily Production (barrels)', value: 100000, type: 'number' },
        oil_price: { label: 'Oil Price per Barrel', value: 70, type: 'currency' },
        production_cost: { label: 'Production Cost per Barrel', value: 35, type: 'currency' },
        proved_reserves: { label: 'Proved Reserves (million barrels)', value: 500, type: 'number' },
        reserve_life: { label: 'Reserve Life (years)', value: 12, type: 'number' },
        capex_per_barrel: { label: 'Capex per Barrel Developed', value: 15, type: 'currency' }
      },

      calculations: {
        annual_production: (inputs) => inputs.daily_production * 365,
        operating_margin: (inputs) => (inputs.oil_price - inputs.production_cost) / inputs.oil_price,
        pv10_value: (inputs) => inputs.proved_reserves * (inputs.oil_price - inputs.production_cost) * 0.6
      },

      keyMetrics: ['Daily Production', 'Operating Margin', 'Reserve Life', 'PV-10 Value', 'Finding Cost']
    };
  }

  // Energy - Renewable Template
  getRenewableTemplate() {
    return {
      id: 'renewable_model',
      name: 'Renewable Energy Model',
      description: 'Solar/wind renewable energy projects',
      category: 'Energy',

      inputs: {
        installed_capacity: { label: 'Installed Capacity (MW)', value: 500, type: 'number' },
        capacity_factor: { label: 'Capacity Factor (%)', value: 35, type: 'percentage' },
        ppa_price: { label: 'PPA Price ($/MWh)', value: 45, type: 'currency' },
        capex_per_mw: { label: 'Capex per MW ($M)', value: 1.2, type: 'currency' },
        opex_per_mw: { label: 'Opex per MW ($K)', value: 25, type: 'currency' },
        project_life: { label: 'Project Life (years)', value: 25, type: 'number' }
      },

      calculations: {
        annual_generation: (inputs) => inputs.installed_capacity * inputs.capacity_factor / 100 * 8760,
        annual_revenue: (inputs) => this.calculations.annual_generation(inputs) * inputs.ppa_price,
        project_irr: (inputs) => {
          const revenue = this.calculations.annual_revenue(inputs);
          const capex = inputs.installed_capacity * inputs.capex_per_mw;
          const opex = inputs.installed_capacity * inputs.opex_per_mw;
          return ((revenue - opex) / capex) * 100;
        }
      },

      keyMetrics: ['Capacity Factor', 'Annual Generation', 'PPA Price', 'Project IRR', 'LCOE']
    };
  }
}

export const industryTemplateService = new IndustryTemplateService();
