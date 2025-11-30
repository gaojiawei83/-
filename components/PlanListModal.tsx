
import React, { useState, useMemo } from 'react';
import { WorkoutPlan, MuscleData, MuscleId } from '../types';
import { X, Calendar, CheckCircle2, XCircle, AlertCircle, PlusCircle, ArrowRight } from 'lucide-react';
import { XP_PLAN_CREATE, XP_PLAN_COMPLETE, XP_PLAN_MISS } from '../utils';

interface PlanListModalProps {
  plans: WorkoutPlan[];
  muscles: Record<MuscleId, MuscleData>;
  onClose: () => void;
  currentTime: number;
}

const PlanListModal: React.FC<PlanListModalProps> = ({ plans, muscles, onClose, currentTime }) => {
  const [activeTab, setActiveTab] = useState<'todo' | 'completed' | 'missed'>('todo');
  
  const todayStr = new Date(currentTime).toISOString().split('T')[0];

  const { todo, completed, missed } = useMemo(() => {
    const todo: WorkoutPlan[] = [];
    const completed: WorkoutPlan[] = [];
    const missed: WorkoutPlan[] = [];

    // Sort plans by date desc
    const sortedPlans = [...plans].sort((a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime());

    sortedPlans.forEach(plan => {
      if (plan.completed) {
        completed.push(plan);
      } else if (plan.dateStr < todayStr) {
        missed.push(plan);
      } else {
        todo.push(plan);
      }
    });

    return { todo, completed, missed };
  }, [plans, todayStr]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl flex flex-col h-[80vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex items-center justify-between">
            <div>
                <h2 className="text-xl font-bold text-white">训练任务书</h2>
                <p className="text-xs text-slate-400">完成任务赚积分，违约将受到惩罚</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
                <X size={24} />
            </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 gap-2 border-b border-slate-700/50 bg-slate-800">
            <button 
                onClick={() => setActiveTab('todo')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'todo' ? 'bg-blue-600 text-white shadow' : 'bg-slate-700/30 text-slate-500'
                }`}
            >
                <Calendar size={14} /> 待办 ({todo.length})
            </button>
            <button 
                onClick={() => setActiveTab('completed')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'completed' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-700/30 text-slate-500'
                }`}
            >
                <CheckCircle2 size={14} /> 已完成 ({completed.length})
            </button>
            <button 
                onClick={() => setActiveTab('missed')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'missed' ? 'bg-red-600 text-white shadow' : 'bg-slate-700/30 text-slate-500'
                }`}
            >
                <XCircle size={14} /> 已错过 ({missed.length})
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-900/20">
            
            {/* TODO TAB */}
            {activeTab === 'todo' && (
                <div className="space-y-3">
                    {todo.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 flex flex-col items-center gap-2">
                            <Calendar size={32} className="opacity-50" />
                            <p>暂无待办计划</p>
                            <p className="text-xs">去日历中添加新计划赚取积分吧！</p>
                        </div>
                    ) : (
                        todo.map(plan => (
                            <div key={plan.id} className="bg-slate-800 border border-blue-500/30 rounded-xl p-3 flex justify-between items-center relative overflow-hidden group">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-200 font-bold">{muscles[plan.muscleId].name}</span>
                                        {plan.dateStr === todayStr && (
                                            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30">今天</span>
                                        )}
                                    </div>
                                    <span className="text-xs text-slate-500">{plan.dateStr}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-xs font-bold text-emerald-400">完成 +{XP_PLAN_COMPLETE} XP</span>
                                    <span className="text-[10px] text-red-400/70">错过 -{XP_PLAN_MISS} XP</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* COMPLETED TAB */}
            {activeTab === 'completed' && (
                <div className="space-y-3">
                     {completed.map(plan => (
                        <div key={plan.id} className="bg-slate-800/50 border border-emerald-500/20 rounded-xl p-3 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="bg-emerald-900/50 p-2 rounded-full text-emerald-500">
                                    <CheckCircle2 size={16} />
                                </div>
                                <div>
                                    <p className="text-slate-300 font-bold text-sm">{muscles[plan.muscleId].name}</p>
                                    <p className="text-xs text-slate-500">{plan.dateStr}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block text-sm font-bold text-emerald-400">+{XP_PLAN_COMPLETE} XP</span>
                                <span className="text-[10px] text-emerald-600/70">完美执行</span>
                            </div>
                        </div>
                    ))}
                    {completed.length === 0 && <p className="text-center text-slate-500 text-sm mt-10">还没有完成过计划，加油！</p>}
                </div>
            )}

            {/* MISSED TAB */}
            {activeTab === 'missed' && (
                <div className="space-y-3">
                    <div className="bg-red-900/20 border border-red-500/30 p-3 rounded-xl flex items-start gap-2 mb-4">
                        <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-200/80 leading-relaxed">
                            错过的计划会扣除信用积分。制定计划意味着承诺，请量力而行。
                        </p>
                    </div>

                    {missed.map(plan => (
                        <div key={plan.id} className="bg-slate-800/50 border border-red-500/20 rounded-xl p-3 flex justify-between items-center opacity-70 hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-3">
                                <div className="bg-red-900/30 p-2 rounded-full text-red-500">
                                    <XCircle size={16} />
                                </div>
                                <div>
                                    <p className="text-slate-400 font-bold text-sm line-through">{muscles[plan.muscleId].name}</p>
                                    <p className="text-xs text-slate-600">{plan.dateStr}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block text-sm font-bold text-red-400">-{XP_PLAN_MISS} XP</span>
                                <span className="text-[10px] text-red-500/50">任务失败</span>
                            </div>
                        </div>
                    ))}
                    {missed.length === 0 && <p className="text-center text-slate-500 text-sm mt-10">太棒了，没有任何违约记录！</p>}
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default PlanListModal;
