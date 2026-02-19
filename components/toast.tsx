"use client";

import { useEffect, useState } from "react";

type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
}

export function Toast({ message, type = "info", duration = 2000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // 入场动画
    setIsVisible(true);

    // 自动关闭
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose?.();
    }, 200);
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "info":
        return "ⓘ";
      default:
        return "ⓘ";
    }
  };

  const getStyles = () => {
    const base = "fixed bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 transition-all duration-200";

    const typeStyles = {
      success: "bg-[#5B8C5A] text-white",
      error: "bg-[#C53030] text-white",
      info: "bg-[#0B7285] text-white",
    };

    const animation = isVisible
      ? "translate-y-0 opacity-100"
      : isExiting
      ? "translate-y-4 opacity-0"
      : "translate-y-4 opacity-0";

    return `${base} ${typeStyles[type]} ${animation}`;
  };

  return (
    <div className={getStyles()}>
      <span className="text-lg">{getIcon()}</span>
      <span className="font-medium">{message}</span>
    </div>
  );
}
