import React from 'react';

import { Cur, Pct } from '../../utils/valuationUtils';

const ProjectionsTable = ({ _projections, _onUpdate, _currency = 'USD', _financialMetrics }) => {
  // Mock data for demonstration
  const rows = [
    {
      year: 2024,
      revenue: 100000,
      ebitMargin: 0.25,
      ebit: 25000,
      nopat: 18750,
      reinvest: 5000,
      fcff: 13750,
      dep: 3000,
      capex: 6000,
      dNWC: 2000
    },
    {
      year: 2025,
      revenue: 110000,
      ebitMargin: 0.26,
      ebit: 28600,
      nopat: 21450,
      reinvest: 5500,
      fcff: 15950,
      dep: 3300,
      capex: 6600,
      dNWC: 2200
    },
    {
      year: 2026,
      revenue: 121000,
      ebitMargin: 0.27,
      ebit: 32670,
      nopat: 24502,
      reinvest: 6050,
      fcff: 18452,
      dep: 3630,
      capex: 7260,
      dNWC: 2420
    }
  ];
  return (
    <div className="overflow-auto rounded-xl border border-border bg-card text-card-foreground">
      <table className="min-w-[720px] text-right text-[12px]">
        <thead className="bg-muted/40 text-foreground">
          <tr>
            <th className="px-2 py-1 text-left">Year</th>
            <th className="px-2 py-1">Revenue</th>
            <th className="px-2 py-1">EBIT%</th>
            <th className="px-2 py-1">EBIT</th>
            <th className="px-2 py-1">NOPAT</th>
            <th className="px-2 py-1">Reinvest</th>
            <th className="px-2 py-1">FCFF</th>
            <th className="px-2 py-1">D&A</th>
            <th className="px-2 py-1">Capex</th>
            <th className="px-2 py-1">ΔNWC</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.year} className="odd:bg-card even:bg-muted/20">
              <td className="px-2 py-1 text-left">{r.year}</td>
              <td className="px-2 py-1">{Cur(r.revenue, 0)}</td>
              <td className="px-2 py-1">{Pct(r.ebitMargin, 1)}</td>
              <td className="px-2 py-1">{Cur(r.ebit, 0)}</td>
              <td className="px-2 py-1">{Cur(r.nopat, 0)}</td>
              <td className="px-2 py-1">{Cur(r.reinvest, 0)}</td>
              <td className="px-2 py-1 font-semibold">{Cur(r.fcff, 0)}</td>
              <td className="px-2 py-1">{Cur(r.dep, 0)}</td>
              <td className="px-2 py-1">{Cur(r.capex, 0)}</td>
              <td className="px-2 py-1">{Cur(r.dNWC, 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectionsTable;
