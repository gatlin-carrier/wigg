import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { type SwipeValue } from "./SwipeRating";

interface RatingMetaphorProps {
  variant: "mountain" | "wave" | "flame" | "classic";
  value?: SwipeValue;
  isActive?: boolean;
}

export function RatingMetaphor({ variant, value, isActive = false }: RatingMetaphorProps) {
  const getRatingData = (rating: SwipeValue) => {
    switch (rating) {
      case 0: return { label: "Filler", color: "hsl(var(--muted))", emoji: "😴" };
      case 1: return { label: "Warming Up", color: "hsl(var(--orange))", emoji: "🌱" };
      case 2: return { label: "Getting Good", color: "hsl(var(--blue))", emoji: "⚡" };
      case 3: return { label: "Peak Perfection", color: "hsl(var(--primary))", emoji: "🔥" };
      default: return { label: "", color: "", emoji: "" };
    }
  };

  const renderMountainMetaphor = () => {
    const paths = [
      "M0,80 L20,75 L40,85 L60,80 L80,90 L100,85", // Filler (valley)
      "M0,70 L20,60 L40,65 L60,55 L80,60 L100,50", // Warming Up
      "M0,50 L20,40 L40,35 L60,30 L80,25 L100,20", // Getting Good
      "M0,40 L20,25 L40,15 L60,5 L80,10 L100,0"    // Peak Perfection
    ];

    return (
      <div className="relative h-24 w-full bg-gradient-to-b from-sky-100 to-green-100 rounded-lg overflow-hidden">
        <svg viewBox="0 0 100 90" className="absolute inset-0 w-full h-full">
          {paths.map((path, index) => (
            <motion.path
              key={index}
              d={path}
              stroke={value === index ? getRatingData(value).color : "hsl(var(--muted))"}
              strokeWidth={value === index ? "3" : "1"}
              fill="none"
              opacity={value === index ? 1 : 0.3}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: value === index ? 1 : 0.3 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />
          ))}
        </svg>
        {value !== undefined && (
          <div className="absolute top-2 right-2 text-2xl">
            {getRatingData(value).emoji}
          </div>
        )}
      </div>
    );
  };

  const renderWaveMetaphor = () => {
    const amplitude = value !== undefined ? [10, 25, 40, 60][value] : 20;
    const frequency = value !== undefined ? [0.5, 1, 1.5, 2][value] : 1;

    return (
      <div className="relative h-24 w-full bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg overflow-hidden">
        <motion.div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at center, ${value !== undefined ? getRatingData(value).color : 'hsl(var(--muted))'} 0%, transparent 70%)`
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <svg viewBox="0 0 200 60" className="absolute inset-0 w-full h-full">
          <motion.path
            d={`M0,30 ${Array.from({ length: 20 }, (_, i) => 
              `L${i * 10},${30 + Math.sin(i * frequency) * amplitude}`
            ).join(' ')}`}
            stroke={value !== undefined ? getRatingData(value).color : "hsl(var(--muted))"}
            strokeWidth="3"
            fill="none"
            animate={{
              d: `M0,30 ${Array.from({ length: 20 }, (_, i) => 
                `L${i * 10},${30 + Math.sin(i * frequency + Date.now() * 0.001) * amplitude}`
              ).join(' ')}`
            }}
            transition={{ duration: 0.1, repeat: Infinity }}
          />
        </svg>
        {value !== undefined && (
          <div className="absolute top-2 right-2 text-2xl">
            {getRatingData(value).emoji}
          </div>
        )}
      </div>
    );
  };

  const renderFlameMetaphor = () => {
    const intensity = value !== undefined ? value : 0;
    const flameHeight = [20, 40, 60, 80][intensity];

    return (
      <div className="relative h-24 w-full bg-gradient-to-t from-gray-800 to-gray-600 rounded-lg overflow-hidden">
        <motion.div
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
          style={{
            width: 40,
            height: flameHeight,
            background: intensity === 0 
              ? "linear-gradient(to top, #374151, #6b7280)"
              : `linear-gradient(to top, ${getRatingData(value!).color}, #fbbf24, #f59e0b)`,
            borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
          }}
          animate={{
            scale: [1, 1.1, 0.9, 1],
            skewX: [-2, 2, -1, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        {Array.from({ length: intensity + 1 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
            style={{
              width: 20 - i * 3,
              height: flameHeight - i * 10,
              background: `linear-gradient(to top, ${getRatingData(value || 0).color}, #fbbf24)`,
              borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
              marginLeft: i * 5 - 10,
            }}
            animate={{
              scale: [0.8, 1.2, 0.9, 1],
              opacity: [0.7, 1, 0.8, 0.9],
            }}
            transition={{
              duration: 1 + i * 0.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.1,
            }}
          />
        ))}
        {value !== undefined && (
          <div className="absolute top-2 right-2 text-2xl">
            {getRatingData(value).emoji}
          </div>
        )}
      </div>
    );
  };

  const renderClassicMetaphor = () => {
    return (
      <div className="relative h-24 w-full bg-gradient-to-r from-background to-muted rounded-lg overflow-hidden border">
        <div className="absolute inset-0 flex items-center justify-center">
          {value !== undefined && (
            <motion.div
              className="text-center"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-4xl mb-2">{getRatingData(value).emoji}</div>
              <Badge 
                variant="outline" 
                style={{ backgroundColor: getRatingData(value).color, color: "white" }}
              >
                {getRatingData(value).label}
              </Badge>
            </motion.div>
          )}
        </div>
      </div>
    );
  };

  switch (variant) {
    case "mountain": return renderMountainMetaphor();
    case "wave": return renderWaveMetaphor();
    case "flame": return renderFlameMetaphor();
    case "classic": return renderClassicMetaphor();
    default: return renderClassicMetaphor();
  }
}