import React from 'react';

import { Cur, Pct } from '../../utils/valuationUtils';

const ProjectionsTable = ({ rows, _currency }) => {
  return (
    <div className="overflow-auto rounded-xl border border-slate-200">
      <table className="min-w-[720px] text-right text-[12px]">
        <thead className="bg-slate-50 text-slate-600">
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
            <tr key={r.year} className="odd:bg-white even:bg-slate-50/40">
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
