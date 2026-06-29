"use client";

import { useState } from "react";
import { Child, GrowthRecord } from "@/lib/types";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<GrowthRecord>) => void;
  child: Child;
}

export default function RecordModal({ isOpen, onClose, onSubmit, child }: RecordModalProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [percentile, setPercentile] = useState("");
  const [boneAge, setBoneAge] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 키와 몸무게가 모두 있으면 100분의 점수(키 - 몸무게) 자동 계산
    let finalPercentile: number | null = percentile ? parseFloat(percentile) : null;
    if (height && weight) {
      finalPercentile = parseFloat((parseFloat(height) - parseFloat(weight)).toFixed(1));
    }

    onSubmit({
      child_id: child.id,
      record_date: date,
      height: height ? parseFloat(height) : null,
      weight: weight ? parseFloat(weight) : null,
      percentile: finalPercentile,
      bone_age: boneAge ? parseFloat(boneAge) : null,
    });
    
    // Reset form
    setHeight("");
    setWeight("");
    setPercentile("");
    setBoneAge("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-50 p-6 glass-panel rounded-2xl shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{child.name} 성장 기록 추가</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 opacity-80">측정 날짜</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 opacity-80">키 (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="예: 145.2"
                    className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 opacity-80">몸무게 (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="예: 35.4"
                    className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 opacity-80">골연령 / 뼈나이 (선택)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    step="0.1"
                    value={boneAge}
                    onChange={(e) => setBoneAge(e.target.value)}
                    placeholder="병원 측정치 (예: 8.5)"
                    className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                  <span className="text-xs text-slate-500 whitespace-nowrap">세</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">골연령을 입력하면 최종 예측 키의 정확도가 크게 상승합니다.</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 opacity-80">100분의 점수 (키 - 몸무게)</label>
                <input
                  type="number"
                  step="0.01"
                  value={height && weight ? (parseFloat(height) - parseFloat(weight)).toFixed(1) : percentile}
                  onChange={(e) => setPercentile(e.target.value)}
                  placeholder="자동 계산됩니다 (예: 100.5)"
                  className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none text-slate-500"
                  readOnly
                />
                <p className="text-xs text-slate-500 mt-1">키와 몸무게를 모두 입력하면 점수가 자동 기입됩니다.</p>
              </div>

              <button
                type="submit"
                className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl py-3 shadow-lg shadow-primary/30 transition-all active:scale-[0.98]"
              >
                기록 저장하기
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
