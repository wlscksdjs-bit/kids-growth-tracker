import { Child } from "@/lib/types";
import { User } from "lucide-react";
import { motion } from "framer-motion";

interface MiniChildCardProps {
  child: Child;
  isSelected?: boolean;
  onClick: () => void;
  layout?: "grid" | "row";
}

export default function MiniChildCard({ child, isSelected, onClick, layout = "grid" }: MiniChildCardProps) {
  const isRow = layout === "row";
  
  return (
    <motion.div
      layoutId={`card-${child.id}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`glass-panel cursor-pointer transition-all duration-300 flex items-center gap-3 overflow-hidden
        ${isSelected ? "ring-2 ring-primary shadow-lg shadow-primary/20 opacity-100" : "opacity-80 hover:opacity-100 hover:shadow-md"}
        ${isRow ? "p-2 rounded-full pr-4 min-w-[120px]" : "p-4 rounded-2xl flex-col text-center"}
      `}
    >
      <div 
        className={`relative shrink-0 rounded-full flex items-center justify-center text-white overflow-hidden shadow-inner
          ${child.gender === 'M' || child.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'}
          ${isRow ? "w-8 h-8" : "w-16 h-16 mx-auto mb-2"}
        `}
      >
        {child.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={child.photo_url} alt={child.name} className="w-full h-full object-cover" />
        ) : (
          <User size={isRow ? 16 : 32} />
        )}
      </div>
      
      <div className={isRow ? "flex-1 text-left" : "w-full"}>
        <h3 className={`font-bold leading-tight truncate ${isRow ? "text-sm" : "text-lg"}`}>
          {child.name}
        </h3>
        {!isRow && (
          <p className="text-xs opacity-70 mt-1">{child.birth_year}년생</p>
        )}
      </div>
    </motion.div>
  );
}
