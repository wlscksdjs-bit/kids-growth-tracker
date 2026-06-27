"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Child, GrowthRecord } from "@/lib/types";
import ChildProfile from "@/components/ChildProfile";
import GrowthChart from "@/components/GrowthChart";
import RecordModal from "@/components/RecordModal";
import ParentHeightModal from "@/components/ParentHeightModal";
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
          if (childrenData && childrenData.length > 0) {
            setSelectedChildId(childrenData[0].id);
          }
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
    <main className="max-w-md mx-auto p-4 sm:p-6 pb-24 relative min-h-screen">
      <header className="mb-8 pt-4">
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
          <section className="grid grid-cols-2 gap-4 mb-8">
            {children.map((child) => (
              <ChildProfile
                key={child.id}
                child={child}
                records={records.filter((r) => r.child_id === child.id)}
                isSelected={selectedChildId === child.id}
                onClick={() => setSelectedChildId(child.id)}
                onEditParentHeight={selectedChildId === child.id ? () => setIsParentModalOpen(true) : undefined}
              />
            ))}
          </section>

          {selectedChild && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={selectedChildId}
              className="space-y-6"
            >
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
                <div className="space-y-3">
                  {[...selectedRecords]
                    .sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime())
                    .slice(0, 5)
                    .map((r, i) => (
                      <div key={r.id || i} className="flex justify-between items-center text-sm p-2 rounded-lg bg-white/30 dark:bg-slate-800/30">
                        <span className="opacity-80">{r.record_date}</span>
                        <div className="flex gap-4 font-medium">
                          <span className="w-16 text-right">{r.height ? `${r.height}cm` : '-'}</span>
                          <span className="w-16 text-right">{r.weight ? `${r.weight}kg` : '-'}</span>
                          {r.percentile && <span className="w-12 text-right text-xs text-primary">{r.percentile}점</span>}
                        </div>
                      </div>
                  ))}
                  {selectedRecords.length === 0 && <p className="text-sm opacity-50 text-center py-2">기록이 없습니다.</p>}
                </div>
              </div>
            </motion.section>
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
