"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [jd, setJd] = useState("");
  const [resume, setResume] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!jd.trim() || !resume.trim()) {
      setError("请输入 JD 和简历内容");
      return;
    }

    setIsLoading(true);
    setError("");
    setResult("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd, resume }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `请求失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.content || "无法获取分析结果";
      setResult(content);
      setError("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "分析失败，请重试";
      setError(errorMessage);
      console.error("分析错误:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 头部 */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              产品经理简历优化器
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              使用 AI 分析 JD 与简历匹配度，获得专业优化建议
            </p>
          </div>
        </div>

        {/* 输入区域 */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* JD 输入框 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              JD 职位描述
            </label>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="粘贴目标岗位的 JD 内容..."
              className="w-full h-64 px-4 py-3 border dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:bg-gray-700"
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">
                建议包含完整的职位描述、职责要求、技能要求等
              </p>
              <p className="text-xs text-gray-500">
                {jd.length} / 10000 字符
              </p>
            </div>
          </div>

          {/* 简历输入框 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              你的简历内容
            </label>
            <textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="粘贴你的简历内容..."
              className="w-full h-64 px-4 py-3 border dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:bg-gray-700"
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">
                建议包含个人总结、工作经历、项目经验、技能等完整内容
              </p>
              <p className="text-xs text-gray-500">
                {resume.length} / 10000 字符
              </p>
            </div>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* 分析按钮 */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
          >
            <Sparkles className="w-5 h-5" />
            <span>{isLoading ? "分析中..." : "开始分析"}</span>
          </button>
        </div>

        {/* 加载状态 */}
        {isLoading && !result && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mt-6"></div>
            </div>
          </div>
        )}

        {/* 结果展示 */}
        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b dark:border-gray-700">
              分析结果
            </h2>
            <div className="prose prose-blue dark:prose-invert max-w-none">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
