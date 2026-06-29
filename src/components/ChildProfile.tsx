import { Child, GrowthRecord } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { calculatePrediction } from "@/lib/prediction";
import { User, Ruler, Weight, Camera } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useState, useRef } from "react";

interface ChildProfileProps {
  child: Child;
  records: GrowthRecord[];
  onClick: () => void;
  onEditParentHeight?: () => void;
  isSelected: boolean;
}

export default function ChildProfile({ child, records, onClick, onEditParentHeight, isSelected }: ChildProfileProps) {
  const sortedRecords = [...records].sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime());
  const latestRecord = sortedRecords[0];
  const previousRecord = sortedRecords[1];
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${child.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      const { error: updateError } = await supabase
        .from('children')
        .update({ photo_url: data.publicUrl })
        .eq('id', child.id);

      if (updateError) throw updateError;
      
      // Reload page to reflect changes
      window.location.reload();
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('사진 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };
  
  const prediction = calculatePrediction(child, records);

  const heightDiff = latestRecord && previousRecord && latestRecord.height && previousRecord.height
    ? (latestRecord.height - previousRecord.height).toFixed(1)
    : null;
    
  const weightDiff = latestRecord && previousRecord && latestRecord.weight && previousRecord.weight
    ? (latestRecord.weight - previousRecord.weight).toFixed(1)
    : null;

  return (
    <div className="glass-panel p-6 rounded-3xl mb-6">
      <div className="flex items-center gap-3 mb-3 relative">
        <div 
          onClick={handlePhotoClick}
          className={`relative w-12 h-12 rounded-full flex items-center justify-center text-white cursor-pointer overflow-hidden group ${child.gender === 'M' ? 'bg-blue-500' : 'bg-pink-500'}`}
        >
          {child.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={child.photo_url} alt={child.name} className="w-full h-full object-cover" />
          ) : (
            <User size={24} />
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Camera size={16} />
            )}
          </div>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange} 
        />
        <div>
          <h3 className="font-bold text-lg leading-tight">{child.name}</h3>
          <p className="text-xs opacity-70">{child.birth_year}년생</p>
        </div>
      </div>
      
      {prediction && (
        <div className="mb-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <Ruler size={64} />
          </div>
          
          <div className="text-xs font-semibold text-primary/80 mb-1 flex items-center gap-1.5">
            ✨ 다중 하이브리드 예측 키 <span className="font-normal opacity-70">(만 20세)</span>
          </div>
          
          <div className="flex items-end gap-2 mb-2">
            <span className="text-4xl font-black text-primary tracking-tight">
              {prediction.predictedHeightFinal.toFixed(1)}
            </span>
            <span className="text-lg font-bold text-primary/70 mb-1">cm</span>
          </div>
          
          <div className="inline-flex items-center gap-1.5 bg-white/50 dark:bg-black/20 px-2.5 py-1 rounded-md text-xs font-medium text-primary/80 mb-3">
            <span>모델 오차 범위:</span>
            <span className="opacity-70">{prediction.predictedHeightMin.toFixed(1)} ~ {prediction.predictedHeightMax.toFixed(1)} cm</span>
          </div>

          <div className="space-y-2 text-xs">
            {!prediction.isBasedOnBoneAge && (
              <div className="flex items-start gap-1.5 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2.5 rounded-lg border border-amber-100 dark:border-amber-900/30">
                <span className="mt-0.5">💡</span>
                <div className="flex-1 leading-relaxed">
                  <strong>골연령(뼈나이)</strong>을 측정 기록에 추가하면 예측이 더욱 정밀해집니다.
                </div>
              </div>
            )}
            
            {!prediction.targetHeight && onEditParentHeight && (
              <div 
                className="flex items-center justify-between gap-2 text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 p-2.5 rounded-lg border border-indigo-100 dark:border-indigo-900/30 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                onClick={(e) => { e.stopPropagation(); onEditParentHeight(); }}
              >
                <div className="flex items-start gap-1.5">
                  <span className="mt-0.5">👨‍👩‍👦</span>
                  <div className="flex-1 leading-relaxed">
                    <strong>부모키</strong>를 입력하여 유전적 목표 모델을 가동하세요.
                  </div>
                </div>
                <span className="bg-indigo-100 dark:bg-indigo-800 px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap">입력하기</span>
              </div>
            )}

            {prediction.isBasedOnBoneAge && prediction.targetHeight && (
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                <span>✅</span>
                <span className="font-medium">병원 수준의 4중 하이브리드 예측 가동 중</span>
              </div>
            )}
            
            {prediction.targetHeight && (
              <div className="flex items-center justify-between text-[10px] opacity-60 px-1 pt-1 mt-1 border-t border-primary/10">
                <span>적용된 유전적 목표 키</span>
                <div className="flex items-center gap-2">
                  <span>{prediction.targetHeight.toFixed(1)} cm</span>
                  {onEditParentHeight && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEditParentHeight(); }}
                      className="underline hover:text-primary transition-colors"
                    >
                      수정
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
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

          {latestRecord.height && latestRecord.weight && (
            <div className="flex justify-between items-end pt-1">
              <div className="flex items-center gap-1.5 opacity-80 text-sm">
                🌟 100분의 점수 <span className="text-[10px] opacity-60">(키-몸무게)</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-lg text-primary">{(latestRecord.height - latestRecord.weight).toFixed(1)}</span>
                <span className="text-xs opacity-70 ml-1">점</span>
              </div>
            </div>
          )}

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
    </div>
  );
}
