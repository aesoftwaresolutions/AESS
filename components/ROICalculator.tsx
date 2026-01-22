import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const ROICalculator: React.FC = () => {
  const [employees, setEmployees] = useState(3);
  const [hoursPerWeek, setHoursPerWeek] = useState(5);
  const [hourlyRate, setHourlyRate] = useState(35);

  const weeklyCost = employees * hoursPerWeek * hourlyRate;
  const yearlyCost = weeklyCost * 52;
  
  // Assumption: Automation saves 70% of manual admin time
  const savingsPercent = 0.7;
  const yearlySavings = yearlyCost * savingsPercent;
  const automatedCost = yearlyCost - yearlySavings;

  const data = [
    { name: 'Current Cost', value: yearlyCost },
    { name: 'With Automation', value: automatedCost },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="p-6 md:p-8 bg-slate-900 text-white">
        <h3 className="text-xl md:text-2xl font-bold mb-2">The Cost of Manual Work</h3>
        <p className="text-slate-300 text-sm">Estimate how much repetitive tasks are costing your business.</p>
      </div>
      
      <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
        {/* Controls */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Staff doing admin tasks
            </label>
            <input 
              type="range" 
              min="1" 
              max="20" 
              value={employees} 
              onChange={(e) => setEmployees(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="text-right font-bold text-blue-600 mt-1">{employees} people</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Hours spent on admin/week (per person)
            </label>
            <input 
              type="range" 
              min="1" 
              max="40" 
              value={hoursPerWeek} 
              onChange={(e) => setHoursPerWeek(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="text-right font-bold text-blue-600 mt-1">{hoursPerWeek} hours</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Average Hourly Rate ($)
            </label>
            <input 
              type="number" 
              value={hourlyRate} 
              onChange={(e) => setHourlyRate(Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          
          <div className="pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-500 mb-1">Potential Yearly Savings</p>
            <p className="text-3xl font-extrabold text-green-600">
              ${yearlySavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64 md:h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={100} 
                tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }}
              />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Annual Cost']}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                 {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#94a3b8' : '#2563eb'} />
                  ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ROICalculator;