
import React, { useState, useMemo } from 'react';
import { WorkoutLog, WorkoutPlan, MuscleData, MuscleId } from '../types';
import { X, ChevronLeft, ChevronRight, PlusCircle, Trash2, CheckCircle2, Circle, AlertTriangle } from 'lucide-react';

interface CalendarModalProps {
  history: WorkoutLog[];
  plans: WorkoutPlan[];
  muscles: Record<MuscleId, MuscleData>;
  currentTime: number;
  onClose: () => void;
  onAddPlan: (dateStr: string, muscleIds: MuscleId[]) => void;
  onDeletePlan: (planId: string) => void;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ 
  history, 
  plans, 
  muscles, 
  currentTime, 
  onClose,
  onAddPlan,
  onDeletePlan 
}) => {
  // Use simulated time for "Today"
  const today = new Date(currentTime);
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [selectedPlanMuscles, setSelectedPlanMuscles] = useState<MuscleId[]>([]);

  // Helpers
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const toDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const selectedDateStr = toDateStr(selectedDate);
  const isFuture = selectedDate > today;

  // Data Map for Calendar
  const calendarData = useMemo(() => {
    const map: Record<string, { logs: WorkoutLog[], plans: WorkoutPlan[] }> = {};
    
    // Map History
    history.forEach(log => {
      const dateStr = toDateStr(new Date(log.timestamp));
      if (!map[dateStr]) map[dateStr] = { logs: [], plans: [] };
      map[dateStr].logs.push(log);
    });

    // Map Plans
    plans.forEach(plan => {
      if (!map[plan.dateStr]) map[plan.dateStr] = { logs: [], plans: [] };
      map[plan.dateStr].plans.push(plan);
    });

    return map;
  }, [history, plans]);

  // Calendar Navigation
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Planning Handler
  const handleTogglePlanMuscle = (id: MuscleId) => {
    setSelectedPlanMuscles(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleSubmitPlan = () => {
    if (selectedPlanMuscles.length === 0) return;
    onAddPlan(selectedDateStr, selectedPlanMuscles);
    setSelectedPlanMuscles([]);
  };

  // Render Calendar Grid
  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month); // 0 = Sun
    
    const days = [];
    
    // Padding
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`pad-${i}`} className="h-10 sm:h-12" />);
    }

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateStr = toDateStr(date);
      const data = calendarData[dateStr];
      const hasLogs = data?.logs.length > 0;
      const hasPlans = data?.plans.length > 0;
      const isSelected = dateStr === selectedDateStr;
      const isToday = dateStr === toDateStr(today);

      days.push(
        <button
          key={d}
          onClick={() => setSelectedDate(date)}
          className={`h-10 sm:h-12 rounded-lg flex flex-col items-center justify-center relative transition-all ${
            isSelected 
              ? 'bg-blue-600 text-white shadow-lg scale-105 z-10' 
              : 'hover:bg-slate-700 text-slate-300'
          } ${isToday ? 'border border-blue-400/50' : ''}`}
        >
          <span className={`text-xs sm:text-sm font-bold ${isToday && !isSelected ? 'text-blue-400' : ''}`}>{d}</span>
          
          <div className="flex gap-1 mt-1">
            {hasLogs && (
              <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-green-500'}`} />
            )}
            {hasPlans && (
              <div className={`w-1.5 h-1.5 rounded-full border ${isSelected ? 'border-white' : 'border-purple-400'}`} />
            )}
          </div>
        </button>
      );
    }
    return days;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
        
        {/* Left Side: Calendar View */}
        <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-slate-700">
          
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900/30">
            <h2 className="text-xl font-bold text-white">制定计划</h2>
            <div className="flex items-center gap-4">
              <button onClick={prevMonth} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"><ChevronLeft /></button>
              <span className="font-mono font-bold text-lg w-24 text-center">
                {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
              </span>
              <button onClick={nextMonth} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"><ChevronRight /></button>
            </div>
          </div>

          {/* Weekday Header */}
          <div className="grid grid-cols-7 text-center py-2 bg-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>
          </div>

          {/* Grid */}
          <div className="flex-1 p-2 overflow-y-auto">
             <div className="grid grid-cols-7 gap-1">
               {renderCalendarDays()}
             </div>
          </div>

          {/* Legend */}
          <div className="p-3 text-xs text-slate-500 flex justify-center gap-4 bg-slate-900/30">
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> 已完成</div>
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full border border-purple-400"></div> 计划中</div>
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full border border-blue-400"></div> 今天</div>
          </div>
        </div>

        {/* Right Side: Details & Planning */}
        <div className="w-full md:w-80 flex flex-col bg-slate-800/50">
           
           <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedDateStr}</h3>
                <p className="text-xs text-slate-400">
                    {selectedDateStr === toDateStr(today) ? '今天' : isFuture ? '未来' : '过去'}
                </p>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
           </div>

           <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
              
              {/* Daily Overview */}
              <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">当日概览</h4>
                  <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-700">
                      {calendarData[selectedDateStr]?.plans.length > 0 || calendarData[selectedDateStr]?.logs.length > 0 ? (
                        <div className="space-y-1">
                           {calendarData[selectedDateStr]?.plans.map(p => (
                               <div key={p.id} className="flex justify-between items-center text-sm">
                                   <span className="text-purple-300">计划: {muscles[p.muscleId].name}</span>
                                   <button onClick={() => onDeletePlan(p.id)} className="text-slate-500 hover:text-red-400"><Trash2 size={12}/></button>
                               </div>
                           ))}
                           {calendarData[selectedDateStr]?.logs.map(l => (
                               <div key={l.id} className="flex justify-between items-center text-sm">
                                   <span className="text-green-400">完成: {muscles[l.muscleId].name}</span>
                               </div>
                           ))}
                        </div>
                      ) : (
                          <p className="text-xs text-slate-500 text-center">无记录</p>
                      )}
                  </div>
              </div>

              {/* Add Plan Section (Only for Today or Future) */}
              {(isFuture || selectedDateStr === toDateStr(today)) ? (
                  <div className="pt-2 border-t border-slate-700">
                      <h4 className="text-sm font-bold text-white mb-3">添加训练计划</h4>
                      <p className="text-xs text-slate-400 mb-3">制定计划可获得积分奖励，但请务必完成！</p>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {(Object.values(muscles) as MuscleData[]).map(m => (
                            <button
                                key={m.id}
                                onClick={() => handleTogglePlanMuscle(m.id)}
                                className={`text-xs py-2 rounded-lg border transition-all ${
                                    selectedPlanMuscles.includes(m.id)
                                    ? 'bg-blue-600 border-blue-500 text-white'
                                    : 'bg-slate-700/30 border-slate-700 text-slate-300 hover:bg-slate-700'
                                }`}
                            >
                                {m.name}
                            </button>
                        ))}
                      </div>
                      <button
                        onClick={handleSubmitPlan}
                        disabled={selectedPlanMuscles.length === 0}
                        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                            selectedPlanMuscles.length > 0
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <PlusCircle size={18} />
                        确认添加
                      </button>
                  </div>
              ) : (
                  <div className="p-4 bg-slate-900/30 rounded-lg text-center">
                      <p className="text-xs text-slate-500">无法为过去的日期添加计划</p>
                  </div>
              )}

           </div>
        </div>

      </div>
    </div>
  );
};

export default CalendarModal;
