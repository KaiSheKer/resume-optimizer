"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
}

export function ApiKeyModal({ isOpen, onClose, onSave }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const savedKey = localStorage.getItem("kimi_api_key") || "";
      setApiKey(savedKey);
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem("kimi_api_key", apiKey.trim());
      onSave(apiKey.trim());
      setIsVisible(false);
      setTimeout(onClose, 200);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 transition-all duration-200 ${
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold">配置 Kimi API Key</h2>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 200);
            }}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            请输入你的 Kimi API Key（存储在浏览器本地，不会上传到服务器）
          </p>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full px-4 py-2 border dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
          />
          <p className="text-xs text-gray-500 mt-2">
            获取 API Key:{" "}
            <a
              href="https://platform.moonshot.cn/console/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              platform.moonshot.cn
            </a>
          </p>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t dark:border-gray-700">
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 200);
            }}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
