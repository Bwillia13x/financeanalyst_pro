// Advanced Data Visualization Components - Phase 2 Implementation
import * as d3 from 'd3';

export class DataVisualizationService {
  constructor() {
    this.charts = new Map();
    this.themes = new Map();
    this.animations = new Map();
    this.interactionHandlers = new Map();
    this.eventHandlers = new Map();
    this.renderQueue = [];
    this.isProcessingQueue = false;
    this.initializeThemes();
    this.initializeAnimations();
  }

  initializeThemes() {
    const themes = {
      professional: {
        colors: {
          primary: [
            '#1f77b4',
            '#ff7f0e',
            '#2ca02c',
            '#d62728',
            '#9467bd',
            '#8c564b',
            '#e377c2',
            '#7f7f7f',
            '#bcbd22',
            '#17becf'
          ],
          sequential: d3.schemeBlues[9],
          diverging: d3.schemeRdYlBu[11],
          categorical: d3.schemeCategory10
        },
        typography: {
          fontFamily: 'Inter, system-ui, sans-serif',
          titleSize: 16,
          labelSize: 12,
          tickSize: 10
        },
        spacing: {
          margin: { top: 20, right: 20, bottom: 40, left: 60 },
          padding: 10
        },
        style: {
          backgroundColor: '#ffffff',
          gridColor: '#e0e0e0',
          axisColor: '#666666',
          strokeWidth: 2
        }
      },
      dark: {
        colors: {
          primary: [
            '#8dd3c7',
            '#ffffb3',
            '#bebada',
            '#fb8072',
            '#80b1d3',
            '#fdb462',
            '#b3de69',
            '#fccde5',
            '#d9d9d9',
            '#bc80bd'
          ],
          sequential: d3.schemeGreys[9],
          diverging: d3.schemePRGn[11],
          categorical: d3.schemeSet3
        },
        typography: {
          fontFamily: 'Inter, system-ui, sans-serif',
          titleSize: 16,
          labelSize: 12,
          tickSize: 10
        },
        spacing: {
          margin: { top: 20, right: 20, bottom: 40, left: 60 },
          padding: 10
        },
        style: {
          backgroundColor: '#1a1a1a',
          gridColor: '#333333',
          axisColor: '#cccccc',
          strokeWidth: 2
        }
      },
      financial: {
        colors: {
          primary: [
            '#2E86AB',
            '#A23B72',
            '#F18F01',
            '#C73E1D',
            '#592E83',
            '#A8DADC',
            '#457B9D',
            '#1D3557'
          ],
          sequential: d3.schemeGreens[9],
          diverging: d3.schemeRdBu[11],
          categorical: ['#2E86AB', '#A23B72', '#F18F01', '#C73E1D', '#592E83']
        },
        typography: {
          fontFamily: 'Georgia, serif',
          titleSize: 18,
          labelSize: 13,
          tickSize: 11
        },
        spacing: {
          margin: { top: 25, right: 25, bottom: 45, left: 70 },
          padding: 12
        },
        style: {
          backgroundColor: '#fafafa',
          gridColor: '#d1d5db',
          axisColor: '#4b5563',
          strokeWidth: 2.5
        }
      }
    };

    Object.entries(themes).forEach(([name, theme]) => {
      this.themes.set(name, theme);
    });
  }

  initializeAnimations() {
    const animations = {
      fadeIn: {
        duration: 800,
        easing: 'ease-out',
        delay: (d, i) => i * 50
      },
      slideFromLeft: {
        duration: 1000,
        easing: 'ease-out',
        startTransform: 'translateX(-100px)',
        delay: (d, i) => i * 100
      },
      scaleUp: {
        duration: 600,
        easing: 'ease-back',
        startTransform: 'scale(0)',
        delay: (d, i) => i * 75
      },
      drawPath: {
        duration: 1500,
        easing: 'ease-in-out'
      }
    };

    Object.entries(animations).forEach(([name, config]) => {
      this.animations.set(name, config);
    });
  }

  // Advanced Line Chart with Financial Features
  createAdvancedLineChart(containerId, data, config = {}) {
    const defaultConfig = {
      theme: 'professional',
      width: 800,
      height: 400,
      showGrid: true,
      showTooltip: true,
      showLegend: true,
      showCrosshair: true,
      enableZoom: true,
      enableBrush: false,
      animations: true,
      yAxisFormat: 'number',
      xAxisType: 'time',
      lineStyle: 'solid',
      markers: true,
      markerSize: 4,
      interpolation: 'monotoneX'
    };

    const finalConfig = { ...defaultConfig, ...config };
    const theme = this.themes.get(finalConfig.theme);

    const chart = {
      id: this.generateChartId(),
      type: 'advanced_line',
      containerId,
      config: finalConfig,
      data: this.processLineData(data),
      theme
    };

    this.charts.set(chart.id, chart);
    this.queueRender(chart);
    return chart.id;
  }

  processLineData(data) {
    if (!Array.isArray(data) || data.length === 0) return [];

    // Handle multiple series
    if (data[0].series) {
      return data.map(d => ({
        ...d,
        values: d.values.map(v => ({
          ...v,
          date: new Date(v.date),
          value: +v.value
        }))
      }));
    }

    // Handle single series
    return [
      {
        name: 'Series 1',
        values: data.map(d => ({
          date: new Date(d.date),
          value: +d.value
        }))
      }
    ];
  }

  renderAdvancedLineChart(chart) {
    const container = d3.select(`#${chart.containerId}`);
    container.selectAll('*').remove();

    const { width, height } = chart.config;
    const { margin } = chart.theme.spacing;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background-color', chart.theme.style.backgroundColor);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3
      .scaleTime()
      .domain(
        d3.extent(
          chart.data.flatMap(d => d.values),
          d => d.date
        )
      )
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain(
        d3.extent(
          chart.data.flatMap(d => d.values),
          d => d.value
        )
      )
      .nice()
      .range([innerHeight, 0]);

    // Color scale
    const colorScale = d3
      .scaleOrdinal()
      .domain(chart.data.map(d => d.name))
      .range(chart.theme.colors.primary);

    // Line generator
    const line = d3
      .line()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value))
      .curve(d3[chart.config.interpolation] || d3.curveMonotoneX);

    // Grid
    if (chart.config.showGrid) {
      this.addGrid(g, xScale, yScale, innerWidth, innerHeight, chart.theme);
    }

    // Axes
    this.addAxes(g, xScale, yScale, innerWidth, innerHeight, chart.config, chart.theme);

    // Lines and areas
    const seriesGroups = g
      .selectAll('.series')
      .data(chart.data)
      .enter()
      .append('g')
      .attr('class', 'series');

    // Add lines
    seriesGroups
      .append('path')
      .attr('class', 'line')
      .attr('d', d => line(d.values))
      .attr('fill', 'none')
      .attr('stroke', d => colorScale(d.name))
      .attr('stroke-width', chart.theme.style.strokeWidth)
      .attr('stroke-dasharray', chart.config.lineStyle === 'dashed' ? '5,5' : null);

    // Add markers
    if (chart.config.markers) {
      seriesGroups
        .selectAll('.marker')
        .data(d => d.values)
        .enter()
        .append('circle')
        .attr('class', 'marker')
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d.value))
        .attr('r', chart.config.markerSize)
        .attr('fill', (d, i, nodes) => {
          const seriesData = d3.select(nodes[i].parentNode).datum();
          return colorScale(seriesData.name);
        })
        .attr('stroke', chart.theme.style.backgroundColor)
        .attr('stroke-width', 1);
    }

    // Interactions
    if (chart.config.showTooltip) {
      this.addTooltip(chart, g, xScale, yScale, colorScale);
    }

    if (chart.config.enableZoom) {
      this.addZoom(chart, svg, g, xScale, yScale);
    }

    if (chart.config.showLegend) {
      this.addLegend(chart, svg, colorScale);
    }

    // Animations
    if (chart.config.animations) {
      this.animateChart(chart, seriesGroups);
    }
  }

  // Advanced Bar Chart with Grouping and Stacking
  createAdvancedBarChart(containerId, data, config = {}) {
    const defaultConfig = {
      theme: 'professional',
      width: 800,
      height: 400,
      orientation: 'vertical',
      barType: 'grouped', // grouped, stacked, normalized
      showValues: false,
      showGrid: true,
      showTooltip: true,
      showLegend: true,
      animations: true,
      cornerRadius: 0,
      barPadding: 0.1,
      groupPadding: 0.2
    };

    const finalConfig = { ...defaultConfig, ...config };
    const theme = this.themes.get(finalConfig.theme);

    const chart = {
      id: this.generateChartId(),
      type: 'advanced_bar',
      containerId,
      config: finalConfig,
      data: this.processBarData(data),
      theme
    };

    this.charts.set(chart.id, chart);
    this.queueRender(chart);
    return chart.id;
  }

  processBarData(data) {
    // Ensure consistent data structure for grouped/stacked bars
    if (!Array.isArray(data) || data.length === 0) return [];

    return data.map(d => ({
      ...d,
      values: Array.isArray(d.values)
        ? d.values.map(v => ({ ...v, value: +v.value }))
        : [{ category: d.category, value: +d.value }]
    }));
  }

  renderAdvancedBarChart(chart) {
    const container = d3.select(`#${chart.containerId}`);
    container.selectAll('*').remove();

    const { width, height, orientation, barType } = chart.config;
    const { margin } = chart.theme.spacing;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background-color', chart.theme.style.backgroundColor);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Process data for stacking if needed
    let processedData = chart.data;
    if (barType === 'stacked' || barType === 'normalized') {
      processedData = this.stackData(chart.data, barType === 'normalized');
    }

    // Scales
    const categories = chart.data.map(d => d.category);
    const series = chart.data[0]?.values?.map(d => d.series) || ['value'];

    let xScale, yScale;
    if (orientation === 'vertical') {
      xScale = d3
        .scaleBand()
        .domain(categories)
        .range([0, innerWidth])
        .padding(chart.config.groupPadding);

      yScale = d3
        .scaleLinear()
        .domain([0, d3.max(processedData.flatMap(d => d.values.map(v => v.y1 || v.value)))])
        .nice()
        .range([innerHeight, 0]);
    } else {
      xScale = d3
        .scaleLinear()
        .domain([0, d3.max(processedData.flatMap(d => d.values.map(v => v.y1 || v.value)))])
        .nice()
        .range([0, innerWidth]);

      yScale = d3
        .scaleBand()
        .domain(categories)
        .range([0, innerHeight])
        .padding(chart.config.groupPadding);
    }

    const colorScale = d3.scaleOrdinal().domain(series).range(chart.theme.colors.primary);

    // Grid
    if (chart.config.showGrid) {
      this.addGrid(g, xScale, yScale, innerWidth, innerHeight, chart.theme);
    }

    // Axes
    this.addAxes(g, xScale, yScale, innerWidth, innerHeight, chart.config, chart.theme);

    // Bars
    this.renderBars(g, processedData, xScale, yScale, colorScale, chart.config, orientation);

    // Interactions
    if (chart.config.showTooltip) {
      this.addBarTooltip(chart, g);
    }

    if (chart.config.showLegend) {
      this.addLegend(chart, svg, colorScale);
    }
  }

  // Heatmap for Correlation Matrices and Data Tables
  createHeatmap(containerId, data, config = {}) {
    const defaultConfig = {
      theme: 'professional',
      width: 600,
      height: 400,
      colorScheme: 'RdYlBu',
      showValues: true,
      showTooltip: true,
      cornerRadius: 2,
      cellPadding: 1
    };

    const finalConfig = { ...defaultConfig, ...config };
    const theme = this.themes.get(finalConfig.theme);

    const chart = {
      id: this.generateChartId(),
      type: 'heatmap',
      containerId,
      config: finalConfig,
      data: this.processHeatmapData(data),
      theme
    };

    this.charts.set(chart.id, chart);
    this.queueRender(chart);
    return chart.id;
  }

  processHeatmapData(data) {
    // Convert matrix data to array of objects with row, col, value
    const processed = [];
    data.forEach((row, i) => {
      row.forEach((value, j) => {
        processed.push({
          row: i,
          col: j,
          value,
          rowLabel: data.rowLabels?.[i] || `Row ${i}`,
          colLabel: data.colLabels?.[j] || `Col ${j}`
        });
      });
    });
    return processed;
  }

  renderHeatmap(chart) {
    const container = d3.select(`#${chart.containerId}`);
    container.selectAll('*').remove();

    const { width, height } = chart.config;
    const { margin } = chart.theme.spacing;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background-color', chart.theme.style.backgroundColor);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Dimensions
    const numRows = Math.max(...chart.data.map(d => d.row)) + 1;
    const numCols = Math.max(...chart.data.map(d => d.col)) + 1;
    const cellWidth = innerWidth / numCols;
    const cellHeight = innerHeight / numRows;

    // Color scale
    const colorScale = d3
      .scaleSequential()
      .domain(d3.extent(chart.data, d => d.value))
      .interpolator(d3[`interpolate${chart.config.colorScheme}`]);

    // Cells
    const cells = g
      .selectAll('.cell')
      .data(chart.data)
      .enter()
      .append('rect')
      .attr('class', 'cell')
      .attr('x', d => d.col * cellWidth)
      .attr('y', d => d.row * cellHeight)
      .attr('width', cellWidth - chart.config.cellPadding)
      .attr('height', cellHeight - chart.config.cellPadding)
      .attr('rx', chart.config.cornerRadius)
      .attr('fill', d => colorScale(d.value));

    // Values
    if (chart.config.showValues) {
      g.selectAll('.cell-text')
        .data(chart.data)
        .enter()
        .append('text')
        .attr('class', 'cell-text')
        .attr('x', d => d.col * cellWidth + cellWidth / 2)
        .attr('y', d => d.row * cellHeight + cellHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .style('font-size', Math.min(cellWidth, cellHeight) * 0.2)
        .style('fill', d => (d3.lab(colorScale(d.value)).l > 50 ? '#000' : '#fff'))
        .text(d => d3.format('.2f')(d.value));
    }

    // Tooltip
    if (chart.config.showTooltip) {
      this.addHeatmapTooltip(chart, cells);
    }
  }

  // Scatter Plot with Regression Lines and Clusters
  createScatterPlot(containerId, data, config = {}) {
    const defaultConfig = {
      theme: 'professional',
      width: 800,
      height: 400,
      showRegression: false,
      regressionType: 'linear',
      showClusters: false,
      bubbleSize: 'fixed',
      sizeRange: [3, 20],
      showTooltip: true,
      enableBrush: false,
      animations: true
    };

    const finalConfig = { ...defaultConfig, ...config };
    const theme = this.themes.get(finalConfig.theme);

    const chart = {
      id: this.generateChartId(),
      type: 'scatter',
      containerId,
      config: finalConfig,
      data: this.processScatterData(data),
      theme
    };

    this.charts.set(chart.id, chart);
    this.queueRender(chart);
    return chart.id;
  }

  processScatterData(data) {
    // Placeholder implementation for scatter plot data processing
    if (!Array.isArray(data) || data.length === 0) return [];

    return data.map(d => ({
      ...d,
      x: +d.x || 0,
      y: +d.y || 0,
      size: +d.size || 5,
      category: d.category || 'default'
    }));
  }

  renderScatterPlot(chart) {
    // Placeholder implementation for scatter plot rendering
    const container = d3.select(`#${chart.containerId}`);
    container.selectAll('*').remove();

    const svg = container
      .append('svg')
      .attr('width', chart.config.width)
      .attr('height', chart.config.height)
      .style('background-color', chart.theme.style.backgroundColor);

    // Add placeholder text
    svg
      .append('text')
      .attr('x', chart.config.width / 2)
      .attr('y', chart.config.height / 2)
      .attr('text-anchor', 'middle')
      .style('font-family', chart.theme.typography.fontFamily)
      .style('font-size', '16px')
      .style('fill', chart.theme.style.axisColor)
      .text('Scatter plot rendering - placeholder implementation');
  }

  renderFinancialDashboard(chart) {
    // Placeholder implementation for financial dashboard rendering
    const container = d3.select(`#${chart.containerId}`);
    container.selectAll('*').remove();

    const svg = container
      .append('svg')
      .attr('width', chart.config.width || 800)
      .attr('height', chart.config.height || 600)
      .style('background-color', chart.theme.style.backgroundColor);

    // Add placeholder text
    svg
      .append('text')
      .attr('x', (chart.config.width || 800) / 2)
      .attr('y', (chart.config.height || 600) / 2)
      .attr('text-anchor', 'middle')
      .style('font-family', chart.theme.typography.fontFamily)
      .style('font-size', '16px')
      .style('fill', chart.theme.style.axisColor)
      .text('Financial dashboard rendering - placeholder implementation');
  }

  // Interactive Financial Dashboard Components
  createFinancialDashboard(containerId, data, config = {}) {
    const dashboard = {
      id: this.generateChartId(),
      type: 'financial_dashboard',
      containerId,
      config: { theme: 'financial', ...config },
      data,
      components: []
    };

    // Create KPI cards
    if (data.kpis) {
      dashboard.components.push(this.createKPIGrid(data.kpis, config.kpiConfig));
    }

    // Create trend charts
    if (data.trends) {
      dashboard.components.push(this.createTrendCharts(data.trends, config.trendConfig));
    }

    // Create comparison tables
    if (data.comparisons) {
      dashboard.components.push(this.createComparisonTable(data.comparisons, config.tableConfig));
    }

    this.charts.set(dashboard.id, dashboard);
    this.queueRender(dashboard);
    return dashboard.id;
  }

  // Utility Methods
  addGrid(g, xScale, yScale, width, height, theme) {
    const xAxis = d3.axisBottom(xScale).tickSize(-height).tickFormat('');
    const yAxis = d3.axisLeft(yScale).tickSize(-width).tickFormat('');

    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .selectAll('line')
      .style('stroke', theme.style.gridColor)
      .style('stroke-width', 0.5)
      .style('opacity', 0.5);

    g.append('g')
      .attr('class', 'grid')
      .call(yAxis)
      .selectAll('line')
      .style('stroke', theme.style.gridColor)
      .style('stroke-width', 0.5)
      .style('opacity', 0.5);
  }

  addAxes(g, xScale, yScale, width, height, config, theme) {
    const xAxis = g
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    const yAxis = g.append('g').attr('class', 'y-axis').call(d3.axisLeft(yScale));

    // Style axes
    [xAxis, yAxis].forEach(axis => {
      axis
        .selectAll('text')
        .style('font-family', theme.typography.fontFamily)
        .style('font-size', theme.typography.tickSize)
        .style('fill', theme.style.axisColor);

      axis.selectAll('line, path').style('stroke', theme.style.axisColor);
    });
  }

  addTooltip(chart, g, xScale, yScale, _colorScale) {
    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'chart-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', 'rgba(0,0,0,0.8)')
      .style('color', 'white')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', 1000);

    // Add invisible overlay for mouse tracking
    g.append('rect')
      .attr('class', 'overlay')
      .attr('width', xScale.range()[1])
      .attr('height', yScale.range()[0])
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mousemove', event => {
        const [mouseX] = d3.pointer(event);
        const date = xScale.invert(mouseX);

        // Find closest data point
        const closestData = this.findClosestDataPoint(chart.data, date);
        if (closestData) {
          tooltip
            .style('opacity', 1)
            .style('left', event.pageX + 10 + 'px')
            .style('top', event.pageY - 10 + 'px').html(`
              <strong>${closestData.series}</strong><br/>
              Date: ${d3.timeFormat('%Y-%m-%d')(closestData.date)}<br/>
              Value: ${d3.format(',.2f')(closestData.value)}
            `);
        }
      })
      .on('mouseout', () => {
        tooltip.style('opacity', 0);
      });
  }

  addLegend(chart, svg, colorScale) {
    const legend = svg
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${chart.config.width - 120}, 20)`);

    const legendItems = legend
      .selectAll('.legend-item')
      .data(colorScale.domain())
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 20})`);

    legendItems.append('rect').attr('width', 12).attr('height', 12).attr('fill', colorScale);

    legendItems
      .append('text')
      .attr('x', 18)
      .attr('y', 6)
      .attr('dy', '0.35em')
      .style('font-family', chart.theme.typography.fontFamily)
      .style('font-size', chart.theme.typography.labelSize)
      .style('fill', chart.theme.style.axisColor)
      .text(d => d);
  }

  queueRender(chart) {
    this.renderQueue.push(chart);
    if (!this.isProcessingQueue) {
      this.processRenderQueue();
    }
  }

  async processRenderQueue() {
    this.isProcessingQueue = true;

    while (this.renderQueue.length > 0) {
      const chart = this.renderQueue.shift();

      try {
        switch (chart.type) {
          case 'advanced_line':
            this.renderAdvancedLineChart(chart);
            break;
          case 'advanced_bar':
            this.renderAdvancedBarChart(chart);
            break;
          case 'heatmap':
            this.renderHeatmap(chart);
            break;
          case 'scatter':
            this.renderScatterPlot(chart);
            break;
          case 'financial_dashboard':
            this.renderFinancialDashboard(chart);
            break;
        }

        // Small delay to prevent blocking the UI
        await new Promise(resolve => setTimeout(resolve, 16));
      } catch (error) {
        console.error(`Error rendering chart ${chart.id}:`, error);
      }
    }

    this.isProcessingQueue = false;
  }

  // Chart Management
  updateChart(chartId, newData) {
    const chart = this.charts.get(chartId);
    if (!chart) return false;

    chart.data = newData;
    this.queueRender(chart);
    return true;
  }

  removeChart(chartId) {
    const chart = this.charts.get(chartId);
    if (!chart) return false;

    d3.select(`#${chart.containerId}`).selectAll('*').remove();
    this.charts.delete(chartId);
    return true;
  }

  resizeChart(chartId, width, height) {
    const chart = this.charts.get(chartId);
    if (!chart) return false;

    chart.config.width = width;
    chart.config.height = height;
    this.queueRender(chart);
    return true;
  }

  generateChartId() {
    return `chart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  findClosestDataPoint(data, targetDate) {
    let closest = null;
    let minDistance = Infinity;

    data.forEach(series => {
      series.values.forEach(point => {
        const distance = Math.abs(point.date - targetDate);
        if (distance < minDistance) {
          minDistance = distance;
          closest = { ...point, series: series.name };
        }
      });
    });

    return closest;
  }

  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  emit(event, data) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in visualization event handler for ${event}:`, error);
        }
      });
    }
  }
}

export const dataVisualizationService = new DataVisualizationService();
