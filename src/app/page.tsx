"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Child, GrowthRecord } from "@/lib/types";
import ChildProfile from "@/components/ChildProfile";
import GrowthChart from "@/components/GrowthChart";
import RecordModal from "@/components/RecordModal";
import ParentHeightModal from "@/components/ParentHeightModal";
import MiniChildCard from "@/components/MiniChildCard";
import { Plus, Activity, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [children, setChildren] = useState<Child[]>([]);
  const [records, setRecords] = useState<GrowthRecord[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      try {
        const { data: childrenData, error: childErr } = await supabase.from("children").select("*").order("birth_year", { ascending: true });
        if (childErr) throw childErr;
        
        const { data: recordsData, error: recErr } = await supabase.from("growth_records").select("*").order("record_date", { ascending: true });
        if (recErr) throw recErr;

        if (mounted) {
          setChildren(childrenData || []);
          // Do not auto-select child anymore. Let it be null.
          setRecords(recordsData || []);
        }
      } catch (err) {
        if (mounted) {
          setError("데이터베이스 연결에 실패했습니다. Supabase 설정을 확인해주세요.");
          console.error(err);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => { mounted = false; };
  }, []);

  const handleAddRecord = async (recordData: Partial<GrowthRecord>) => {
    try {
      const { data, error } = await supabase.from("growth_records").insert([recordData]).select();
      if (error) throw error;
      if (data) {
        setRecords([...records, data[0]]);
      }
    } catch (err) {
      alert("기록 추가에 실패했습니다.");
      console.error(err);
    }
  };

  const handleUpdateParentHeight = async (father: number | null, mother: number | null) => {
    if (!selectedChildId) return;
    try {
      const { error } = await supabase
        .from("children")
        .update({ father_height: father, mother_height: mother })
        .eq("id", selectedChildId);
      
      if (error) throw error;
      
      setChildren(children.map(c => 
        c.id === selectedChildId ? { ...c, father_height: father, mother_height: mother } : c
      ));
      setIsParentModalOpen(false);
    } catch (err) {
      alert("부모 키 저장에 실패했습니다.");
      console.error(err);
    }
  };

  const selectedChild = children.find((c) => c.id === selectedChildId);
  const selectedRecords = records.filter((r) => r.child_id === selectedChildId);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <main className="max-w-md mx-auto p-4 sm:p-6 pb-24 relative min-h-screen flex flex-col">
      <header className={`transition-all duration-500 ${selectedChildId ? 'mb-4 pt-2' : 'mb-8 pt-8 text-center flex flex-col items-center'}`}>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="text-primary" />
          우리아이 성장노트
        </h1>
        <p className="text-sm opacity-70 mt-1">아이들의 소중한 성장 기록을 남겨보세요.</p>
      </header>

      {error ? (
        <div className="glass-panel p-4 rounded-xl text-rose-500 flex items-start gap-3">
          <AlertCircle className="shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">설정 필요</p>
            <p>{error}</p>
            <p className="mt-2 text-xs opacity-80">
              `supabase-setup.sql` 스크립트를 Supabase SQL Editor에서 실행했는지 확인해주세요.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* 아무도 선택되지 않았을 때: 2x2 갤러리 그리드 뷰 */}
          {!selectedChildId && (
            <motion.section 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-2 gap-4 flex-1"
            >
              {children.map((child) => (
                <div key={child.id}>
                   <MiniChildCard
                    child={child}
                    layout="grid"
                    onClick={() => setSelectedChildId(child.id)}
                  />
                </div>
              ))}
            </motion.section>
          )}

          {/* 아이가 선택되었을 때: 상단 미니 리스트 + 하단 상세 뷰 */}
          {selectedChildId && selectedChild && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col flex-1"
            >
              {/* 상단 미니 가로 리스트 */}
              <div className="flex gap-3 overflow-x-auto pb-4 mb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 snap-x hide-scrollbar">
                {children.map((child) => (
                  <div key={child.id} className="snap-start shrink-0">
                    <MiniChildCard
                      child={child}
                      layout="row"
                      isSelected={selectedChildId === child.id}
                      onClick={() => setSelectedChildId(child.id)}
                    />
                  </div>
                ))}
              </div>

              {/* 선택된 아이 상세 뷰 */}
              <motion.section 
                key={selectedChildId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <ChildProfile
                  child={selectedChild}
                  records={selectedRecords}
                  onEditParentHeight={() => setIsParentModalOpen(true)}
                  isSelected={false} // No longer acts as a selectable card
                  onClick={() => {}} // No-op
                />
              <div className="glass-panel p-5 rounded-2xl">
                <h3 className="font-bold mb-2 flex items-center justify-between">
                  키 성장 곡선 (cm)
                  <span className="text-xs font-normal opacity-60 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full">
                    최종 예상 키 포함
                  </span>
                </h3>
                <GrowthChart records={selectedRecords} child={selectedChild} metric="height" />
              </div>

              <div className="glass-panel p-5 rounded-2xl">
                <h3 className="font-bold mb-2">몸무게 성장 곡선 (kg)</h3>
                <GrowthChart records={selectedRecords} child={selectedChild} metric="weight" />
              </div>

              {/* 최근 측정 기록 목록 (간략히) */}
              <div className="glass-panel p-5 rounded-2xl">
                <h3 className="font-bold mb-4">최근 측정 기록</h3>
                <div className="flex justify-between text-xs opacity-60 px-2 pb-2 mb-2 border-b border-slate-200 dark:border-slate-700">
                  <span>측정일</span>
                  <div className="flex gap-3 text-right">
                    <span className="w-16">키</span>
                    <span className="w-16">몸무게</span>
                    <span className="w-16 text-primary">백분위점수</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {[...selectedRecords]
                    .sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime())
                    .slice(0, 5)
                    .map((r, i) => (
                      <div key={r.id || i} className="flex justify-between items-center text-sm p-2 rounded-lg bg-white/30 dark:bg-slate-800/30">
                        <span className="opacity-80">{r.record_date}</span>
                        <div className="flex gap-3 font-medium text-right">
                          <span className="w-16">{r.height ? `${r.height}cm` : '-'}</span>
                          <span className="w-16">{r.weight ? `${r.weight}kg` : '-'}</span>
                          <span className="w-16 text-primary font-bold">
                            {r.percentile 
                              ? `${r.percentile}점` 
                              : (r.height && r.weight ? `${(r.height - r.weight).toFixed(1)}점` : '-')}
                          </span>
                        </div>
                      </div>
                  ))}
                  {selectedRecords.length === 0 && <p className="text-sm opacity-50 text-center py-2">기록이 없습니다.</p>}
                </div>
              </div>
              </motion.section>
            </motion.div>
          )}

          {/* 하단 플로팅 버튼 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsModalOpen(true)}
            className="fixed bottom-6 right-6 md:right-1/2 md:translate-x-[200px] bg-primary text-primary-foreground p-4 rounded-full shadow-xl shadow-primary/30 z-30"
          >
            <Plus size={24} />
          </motion.button>
        </>
      )}

      {selectedChild && (
        <RecordModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddRecord}
          child={selectedChild}
        />
      )}
      
      {selectedChild && (
        <ParentHeightModal
          isOpen={isParentModalOpen}
          onClose={() => setIsParentModalOpen(false)}
          onSubmit={handleUpdateParentHeight}
          child={selectedChild}
        />
      )}
    </main>
  );
}
