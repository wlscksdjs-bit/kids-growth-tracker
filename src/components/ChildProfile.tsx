import { Child, GrowthRecord } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { User, Ruler, Weight } from "lucide-react";
import { motion } from "framer-motion";

interface ChildProfileProps {
  child: Child;
  records: GrowthRecord[];
  onClick: () => void;
  isSelected: boolean;
}

export default function ChildProfile({ child, records, onClick, isSelected }: ChildProfileProps) {
  const sortedRecords = [...records].sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime());
  const latestRecord = sortedRecords[0];
  const previousRecord = sortedRecords[1];

  const heightDiff = latestRecord && previousRecord && latestRecord.height && previousRecord.height
    ? (latestRecord.height - previousRecord.height).toFixed(1)
    : null;
    
  const weightDiff = latestRecord && previousRecord && latestRecord.weight && previousRecord.weight
    ? (latestRecord.weight - previousRecord.weight).toFixed(1)
    : null;

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`glass-panel p-4 rounded-2xl cursor-pointer transition-all duration-300 ${
        isSelected ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${child.gender === 'M' ? 'bg-blue-500' : 'bg-pink-500'}`}>
          <User size={20} />
        </div>
        <div>
          <h3 className="font-bold text-lg leading-tight">{child.name}</h3>
          <p className="text-xs opacity-70">{child.birth_year}년생</p>
        </div>
      </div>
      
      {latestRecord ? (
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-1.5 opacity-80 text-sm">
              <Ruler size={14} /> 키
            </div>
            <div className="text-right">
              <span className="font-semibold text-lg">{latestRecord.height || '- '}</span>
              <span className="text-xs opacity-70 ml-1">cm</span>
              {heightDiff && Number(heightDiff) !== 0 && (
                <span className={`text-xs ml-2 ${Number(heightDiff) > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {Number(heightDiff) > 0 ? '+' : ''}{heightDiff}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-1.5 opacity-80 text-sm">
              <Weight size={14} /> 몸무게
            </div>
            <div className="text-right">
              <span className="font-semibold text-lg">{latestRecord.weight || '- '}</span>
              <span className="text-xs opacity-70 ml-1">kg</span>
              {weightDiff && Number(weightDiff) !== 0 && (
                <span className={`text-xs ml-2 ${Number(weightDiff) > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {Number(weightDiff) > 0 ? '+' : ''}{weightDiff}
                </span>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs opacity-60">
            <span>최근 측정일</span>
            <span>{format(parseISO(latestRecord.record_date), 'yyyy.MM.dd')}</span>
          </div>
        </div>
      ) : (
        <div className="py-4 text-center text-sm opacity-50">
          기록이 없습니다
        </div>
      )}
    </motion.div>
  );
}
