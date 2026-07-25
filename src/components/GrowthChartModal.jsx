import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, TrendingUp, ChevronLeft, ChevronRight, CalendarClock, Info } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';

export default function GrowthChartModal({ isOpen, onClose, bills }) {
  const [timeframe, setTimeframe] = useState('monthly'); // 'daily', 'monthly', 'yearly'
  const scrollContainerRef = useRef(null);
  const [visibleRange, setVisibleRange] = useState('');
  const [lastUpdated] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  // Mouse drag to scroll refs
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);

  const chartData = useMemo(() => {
    const now = new Date();
    const dataMap = new Map();

    if (bills && bills.length > 0) {
      bills.forEach(bill => {
        const amount = parseFloat(bill.total) || 0;
        if (amount <= 0) return;
        
        const date = new Date(bill.created_at || bill.date);
        let key = '';

        if (timeframe === 'daily') {
          key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        } else if (timeframe === 'monthly') {
          key = `${date.getFullYear()}-${date.getMonth()}`;
        } else if (timeframe === 'yearly') {
          key = `${date.getFullYear()}`;
        }
        dataMap.set(key, (dataMap.get(key) || 0) + amount);
      });
    }

    const finalData = [];
    
    if (timeframe === 'daily') {
      // Last 30 days
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        const label = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        finalData.push({ time: label, earnings: dataMap.get(key) || 0, rawDate: d });
      }
    } else if (timeframe === 'monthly') {
      // Last 24 months
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const label = d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
        finalData.push({ time: label, earnings: dataMap.get(key) || 0, rawDate: d });
      }
    } else if (timeframe === 'yearly') {
      // Last 10 years
      for (let i = 9; i >= 0; i--) {
        const y = now.getFullYear() - i;
        const key = `${y}`;
        finalData.push({ time: key, earnings: dataMap.get(key) || 0, rawDate: new Date(y, 0, 1) });
      }
    }

    return finalData;
  }, [bills, timeframe]);

  const updateVisibleRange = () => {
    if (!scrollContainerRef.current || chartData.length === 0) return;
    const el = scrollContainerRef.current;
    
    const scrollPercentStart = el.scrollLeft / el.scrollWidth;
    const scrollPercentEnd = (el.scrollLeft + el.clientWidth) / el.scrollWidth;
    
    let startIndex = Math.floor(scrollPercentStart * chartData.length);
    let endIndex = Math.floor(scrollPercentEnd * chartData.length) - 1;
    
    // Bounds checking
    if (startIndex < 0) startIndex = 0;
    if (endIndex >= chartData.length) endIndex = chartData.length - 1;
    if (startIndex > endIndex) startIndex = endIndex;
    
    const startData = chartData[startIndex];
    const endData = chartData[endIndex];
    
    if (startData && endData) {
      if (startData.time === endData.time) {
        setVisibleRange(startData.time);
      } else {
        setVisibleRange(`${startData.time} – ${endData.time}`);
      }
    }
  };

  const scrollToRight = () => {
    if (scrollContainerRef.current) {
      const el = scrollContainerRef.current;
      el.scrollLeft = el.scrollWidth;
      updateVisibleRange();
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToRight, 50);
    }
  }, [isOpen, timeframe, chartData]);

  const handleScroll = () => {
    updateVisibleRange();
  };

  const scrollByAmount = (direction) => {
    if (scrollContainerRef.current) {
      const shift = scrollContainerRef.current.clientWidth * 0.75; // Shift by 75% of view width
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -shift : shift,
        behavior: 'smooth'
      });
      setTimeout(updateVisibleRange, 400); // Update range after smooth scroll finishes
    }
  };

  // Mouse Drag to Scroll Handlers
  const handleMouseDown = (e) => {
    if (!scrollContainerRef.current) return;
    isDragging.current = true;
    scrollContainerRef.current.classList.add('cursor-grabbing');
    scrollContainerRef.current.classList.remove('cursor-grab');
    startX.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeftStart.current = scrollContainerRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.classList.remove('cursor-grabbing');
      scrollContainerRef.current.classList.add('cursor-grab');
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.classList.remove('cursor-grabbing');
      scrollContainerRef.current.classList.add('cursor-grab');
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5; // Drag sensitivity
    scrollContainerRef.current.scrollLeft = scrollLeftStart.current - walk;
    updateVisibleRange();
  };

  const getChartWidth = () => {
    if (timeframe === 'daily') return Math.max(800, chartData.length * 70);
    if (timeframe === 'monthly') return Math.max(800, chartData.length * 80);
    if (timeframe === 'yearly') return Math.max(800, chartData.length * 100);
    return 800;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <style>{`
        .custom-growth-scroll::-webkit-scrollbar {
          height: 8px;
        }
        .custom-growth-scroll::-webkit-scrollbar-track {
          background: #0B1220;
          border-radius: 4px;
        }
        .custom-growth-scroll::-webkit-scrollbar-thumb {
          background: #7C4DFF;
          border-radius: 4px;
        }
        .custom-growth-scroll::-webkit-scrollbar-thumb:hover {
          background: #651fff;
        }
      `}</style>
      
      <div className="glass-panel w-full max-w-6xl shadow-2xl border-slate-700 bg-slate-900 rounded-2xl flex flex-col p-6 h-[85vh]">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-200 flex items-center gap-2">
              <TrendingUp size={26} className="text-[#7C4DFF]" /> Company Growth Chart
            </h2>
            <p className="text-sm text-slate-400 mt-1">Interactive overview of company earnings and revenue.</p>
          </div>
          
          <div className="flex items-center gap-6">
            {/* View Toggle Buttons */}
            <div className="flex bg-[#0B1220] rounded-full p-1 border border-slate-800 shadow-inner">
              <button
                onClick={() => setTimeframe('daily')}
                className={`px-5 py-2 text-xs font-bold rounded-full transition-all ${timeframe === 'daily' ? 'bg-[#7C4DFF] text-white shadow-md scale-105' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              >
                Daily
              </button>
              <button
                onClick={() => setTimeframe('monthly')}
                className={`px-5 py-2 text-xs font-bold rounded-full transition-all ${timeframe === 'monthly' ? 'bg-[#7C4DFF] text-white shadow-md scale-105' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setTimeframe('yearly')}
                className={`px-5 py-2 text-xs font-bold rounded-full transition-all ${timeframe === 'yearly' ? 'bg-[#7C4DFF] text-white shadow-md scale-105' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              >
                Yearly
              </button>
            </div>
            
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-rose-500/20 hover:text-rose-400 transition-colors border border-transparent hover:border-rose-500/50"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Navigation Row */}
        <div className="flex items-center justify-center gap-4 mb-4 bg-slate-950/40 py-2 px-4 rounded-xl border border-slate-800/50">
          <button 
            onClick={() => scrollByAmount('left')}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shadow-sm"
          >
            <ChevronLeft size={18} />
          </button>
          
          <div className="flex flex-col items-center min-w-[250px]">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">Visible Range</span>
            <span className="text-sm font-semibold text-slate-200 bg-slate-900 px-3 py-1 rounded-md border border-slate-800 shadow-inner">
              {visibleRange || 'Loading...'}
            </span>
          </div>

          <button 
            onClick={() => scrollByAmount('right')}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shadow-sm"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Chart Container (Scrollable) */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className="flex-1 w-full overflow-x-auto custom-growth-scroll cursor-grab pb-4 rounded-xl border border-slate-800/60 bg-slate-950/20 relative"
          style={{ scrollBehavior: 'auto' }} // auto needed for drag to feel responsive
        >
          {/* We set a very wide width on the inner div to force scrolling */}
          <div style={{ width: `${getChartWidth()}px`, height: '100%', minHeight: '300px' }} className="pt-4 pr-6 select-none">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#64748b" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  dy={10}
                  tick={{ fill: '#94a3b8' }}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `Rs.${value}`}
                  dx={-10}
                  tick={{ fill: '#94a3b8' }}
                />
                <Tooltip 
                  cursor={{ fill: '#1e293b', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#0B1220', borderColor: '#334155', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                  itemStyle={{ color: '#7C4DFF', fontWeight: 'bold' }}
                  formatter={(value) => [`Rs. ${value.toFixed(2)}`, 'Earnings']}
                  labelStyle={{ color: '#f8fafc', marginBottom: '8px', fontWeight: 'bold', borderBottom: '1px solid #334155', paddingBottom: '4px' }}
                />
                <Bar 
                  dataKey="earnings" 
                  radius={[6, 6, 0, 0]}
                  barSize={timeframe === 'daily' ? 30 : timeframe === 'monthly' ? 40 : 50}
                  animationDuration={1000}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.earnings > 0 ? '#7C4DFF' : '#334155'} 
                      className="hover:opacity-80 transition-opacity duration-300"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card Footer */}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/60 pt-4">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-slate-400" />
            <span>
              Showing data for: Last {timeframe === 'daily' ? '30 Days' : timeframe === 'monthly' ? '24 Months' : '10 Years'}
            </span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <CalendarClock size={14} className="text-slate-400" />
            <span>Last Updated: Today {lastUpdated}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
