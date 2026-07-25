import React, { useState, useMemo } from 'react';
import { X, TrendingUp, Calendar, Clock, Activity } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';

export default function GrowthChartModal({ isOpen, onClose, bills }) {
  const [timeframe, setTimeframe] = useState('monthly'); // 'daily', 'monthly', 'yearly'

  const chartData = useMemo(() => {
    if (!bills || bills.length === 0) return [];

    const now = new Date();
    const dataMap = new Map();

    bills.forEach(bill => {
      const amount = parseFloat(bill.total) || 0;
      if (amount <= 0) return;
      
      const date = new Date(bill.created_at || bill.date);
      let key = '';

      if (timeframe === 'daily') {
        // Last 6 days
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        if (diffDays <= 6) {
          key = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        }
      } else if (timeframe === 'monthly') {
        // Last 6 months
        const monthDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
        if (monthDiff >= 0 && monthDiff < 6) {
          key = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        }
      } else if (timeframe === 'yearly') {
        // Last 6 years
        const yearDiff = now.getFullYear() - date.getFullYear();
        if (yearDiff >= 0 && yearDiff < 6) {
          key = date.getFullYear().toString();
        }
      }

      if (key) {
        dataMap.set(key, (dataMap.get(key) || 0) + amount);
      }
    });

    // Ensure we have empty slots for the selected timeframe if no data
    const finalData = [];
    
    if (timeframe === 'daily') {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        finalData.push({ time: key, earnings: dataMap.get(key) || 0 });
      }
    } else if (timeframe === 'monthly') {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        finalData.push({ time: key, earnings: dataMap.get(key) || 0 });
      }
    } else if (timeframe === 'yearly') {
      for (let i = 5; i >= 0; i--) {
        const yearKey = (now.getFullYear() - i).toString();
        finalData.push({ time: yearKey, earnings: dataMap.get(yearKey) || 0 });
      }
    }

    return finalData;
  }, [bills, timeframe]);

  if (!isOpen) return null;

  const totalEarningsInPeriod = chartData.reduce((sum, item) => sum + item.earnings, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-4xl shadow-2xl border-slate-700 bg-slate-900 rounded-2xl flex flex-col p-6">
        
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
              <TrendingUp size={22} className="text-indigo-400" /> Company Growth Chart
            </h2>
            <p className="text-xs text-slate-400 mt-1">Interactive overview of total earnings.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
              <button
                onClick={() => setTimeframe('daily')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${timeframe === 'daily' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              >
                Daily
              </button>
              <button
                onClick={() => setTimeframe('monthly')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${timeframe === 'monthly' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setTimeframe('yearly')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${timeframe === 'yearly' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              >
                Yearly
              </button>
            </div>
            
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 rounded-xl hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Chart Stats summary */}
        <div className="flex gap-6 mb-6">
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/60 min-w-[200px]">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-1">
              <Activity size={12} /> Total for Period
            </span>
            <span className="text-2xl font-extrabold text-slate-200">
              Rs. {totalEarningsInPeriod.toFixed(2)}
            </span>
          </div>
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/60 min-w-[200px]">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-1">
              <Clock size={12} /> Timeframe
            </span>
            <span className="text-lg font-bold text-indigo-300 capitalize">
              Last 6 {timeframe === 'daily' ? 'Days' : timeframe === 'monthly' ? 'Months' : 'Years'}
            </span>
          </div>
        </div>

        {/* Chart Container */}
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                stroke="#64748b" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `Rs.${value}`}
                dx={-10}
              />
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                formatter={(value) => [`Rs. ${value.toFixed(2)}`, 'Earnings']}
                labelStyle={{ color: '#cbd5e1', marginBottom: '5px' }}
              />
              <Area 
                type="monotone" 
                dataKey="earnings" 
                stroke="#818cf8" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorEarnings)" 
                activeDot={{ r: 6, fill: '#818cf8', stroke: '#c7d2fe', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}
