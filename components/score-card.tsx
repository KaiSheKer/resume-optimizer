"use client";

import { useEffect, useRef, useState } from "react";

interface ScoreCardProps {
  score: number;
  label: string;
  delay?: number;
}

export function ScoreCard({ score, label, delay = 0 }: ScoreCardProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 800;
    const steps = 60;
    const increment = score / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score, isVisible]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-[#5B8C5A]";
    if (score >= 60) return "text-[#D97706]";
    return "text-[#C53030]";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "#5B8C5A";
    if (score >= 60) return "#D97706";
    return "#C53030";
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg p-6 border border-[#E8E8E6] dark:border-gray-700 transition-all duration-300 ${
        isVisible ? "animate-scale-in opacity-100" : "opacity-0"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[#585858] dark:text-gray-400">
          {label}
        </span>
        <span
          className={`text-3xl font-bold ${getScoreColor(score)} transition-colors duration-300`}
        >
          {displayScore}
        </span>
      </div>
      <div className="w-full bg-[#F3F3F2] dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-800 ease-out"
          style={{
            width: isVisible ? `${score}%` : "0%",
            backgroundColor: getProgressColor(score),
            transitionDelay: `${delay + 100}ms`,
          }}
        />
      </div>
    </div>
  );
}
