// components/analysis-loading.tsx
"use client";

import { useState, useEffect } from "react";

export function AnalysisLoading() {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    "解析 JD 中...",
    "匹配技能...",
    "生成建议...",
    "优化简历...",
    "Offer 在路上..."
  ];

  // 自动推进进度
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 2; // 每 50ms 增加 2%, 约 2.5秒到达 100%
      });
    }, 50);

    return () => clearInterval(timer);
  }, []);

  // 根据进度切换文案
  useEffect(() => {
    const stepIndex = Math.min(Math.floor(progress / 20), 4);
    setCurrentStep(stepIndex);
  }, [progress]);

  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      {/* 进度条容器 */}
      <div className="w-full max-w-md bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        {/* 进度条填充 */}
        <div
          className="h-full bg-claude-orange transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 步骤文案 */}
      <p className="mt-4 text-claude-text-secondary dark:text-gray-400 text-sm animate-pulse-soft">
        {steps[currentStep]}
      </p>
    </div>
  );
}
