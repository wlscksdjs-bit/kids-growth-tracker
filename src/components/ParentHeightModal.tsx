import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Child } from "@/lib/types";

interface ParentHeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (father: number | null, mother: number | null) => void;
  child: Child;
}

export default function ParentHeightModal({ isOpen, onClose, onSubmit, child }: ParentHeightModalProps) {
  const [father, setFather] = useState<string>("");
  const [mother, setMother] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFather(child.father_height ? child.father_height.toString() : "");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMother(child.mother_height ? child.mother_height.toString() : "");
    }
  }, [isOpen, child]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(
      father ? parseFloat(father) : null,
      mother ? parseFloat(mother) : null
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="glass-panel w-full max-w-sm rounded-2xl overflow-hidden pointer-events-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-lg font-bold">부모 키 입력</h2>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-5">
                <div className="bg-white/5 rounded-xl p-3 border border-white/10 text-sm opacity-80 mb-4">
                  부모님의 키를 입력하시면 더 정확한 최종 예상 키(유전적 목표 키)를 확인할 수 있습니다.
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium opacity-80 block">아빠 키 (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={father}
                    onChange={(e) => setFather(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white"
                    placeholder="예: 175.5"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium opacity-80 block">엄마 키 (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={mother}
                    onChange={(e) => setMother(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white"
                    placeholder="예: 162.0"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-primary/25"
                  >
                    저장하기
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
