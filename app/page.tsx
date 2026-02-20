"use client";

import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { Sparkles, Download, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Tabs } from "@/components/tabs";
import { AnalysisLoading } from "@/components/analysis-loading";
import { Toast } from "@/components/toast";
import { getTabContentById } from "@/lib/markdown-parser";

export default function Home() {
  const [jd, setJd] = useState("");
  const [resume, setResume] = useState("");
  const [result, setResult] = useState("");
  const [icebreakerText, setIcebreakerText] = useState("");
  const [isIcebreakerLoading, setIsIcebreakerLoading] = useState(false);
  const [icebreakerError, setIcebreakerError] = useState("");
  const [copiedTabId, setCopiedTabId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const tabContent = useMemo(
    () => ({
      overview: getTabContentById(result, "overview"),
      analysis: getTabContentById(result, "analysis"),
      suggestions: getTabContentById(result, "suggestions"),
      original: result.trim(),
    }),
    [result]
  );

  const handleAnalyze = async () => {
    if (!jd.trim() || !resume.trim()) {
      setError("请输入 JD 和简历内容");
      setToast({ message: "请输入 JD 和简历内容", type: "error" });
      return;
    }

    setIsLoading(true);
    setError("");
    setResult("");
    setIcebreakerText("");
    setIcebreakerError("");
    setIsIcebreakerLoading(false);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jd, resume }),
      });

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`);
      }

      const data = await response.json();
      const analysisContent = typeof data.content === "string" ? data.content.trim() : "";
      if (!analysisContent) {
        throw new Error("分析结果为空,请重试");
      }

      setResult(analysisContent);

      setIsIcebreakerLoading(true);
      try {
        const icebreakerResponse = await fetch("/api/icebreaker", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jd,
            resume,
            analysis: analysisContent,
          }),
        });

        if (!icebreakerResponse.ok) {
          throw new Error(`破冰文案生成失败: ${icebreakerResponse.status}`);
        }

        const icebreakerData = await icebreakerResponse.json();
        const content = typeof icebreakerData.content === "string" ? icebreakerData.content.trim() : "";

        if (!content) {
          setIcebreakerError("破冰文案暂未生成,你可以先使用原文内容投递。");
        } else {
          setIcebreakerText(content);
        }
      } catch (icebreakerRequestError) {
        console.error("破冰文案生成失败:", icebreakerRequestError);
        setIcebreakerError("破冰文案生成失败,不影响主分析结果。");
      } finally {
        setIsIcebreakerLoading(false);
      }

      setToast({ message: "分析完成!", type: "success" });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "分析失败,请重试";
      setError(errorMessage);
      setToast({ message: errorMessage, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaste = async (setter: Dispatch<SetStateAction<string>>) => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText.trim()) {
        setToast({ message: "剪贴板为空", type: "info" });
        return;
      }

      setter(clipboardText);
      setToast({ message: "已粘贴", type: "success" });
    } catch {
      setToast({ message: "无法读取剪贴板,请手动粘贴", type: "error" });
    }
  };

  const handleExport = () => {
    if (!result) {
      setToast({ message: "请先进行分析", type: "info" });
      return;
    }

    const blob = new Blob([result], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "简历分析结果.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setToast({ message: "导出成功!", type: "success" });
  };

  const handleCopy = async (content: string, tabId: string) => {
    if (!content.trim()) {
      setToast({ message: "当前标签暂无可复制内容", type: "info" });
      return;
    }

    try {
      await navigator.clipboard.writeText(content);
      setCopiedTabId(tabId);
      setToast({ message: "已复制到剪贴板", type: "success" });
      window.setTimeout(() => {
        setCopiedTabId((current) => (current === tabId ? null : current));
      }, 1200);
    } catch {
      setToast({ message: "复制失败,请重试", type: "error" });
    }
  };

  const getCurrentTabContent = (tabId: string): string => {
    if (tabId === "icebreaker") {
      if (icebreakerText.trim()) {
        return icebreakerText;
      }

      if (icebreakerError.trim()) {
        return `> ${icebreakerError}`;
      }

      return "";
    }

    if (tabId === "original") {
      return tabContent.original || result;
    }

    if (tabId === "overview") {
      return tabContent.overview || result;
    }

    if (tabId === "analysis") {
      return tabContent.analysis || result;
    }

    if (tabId === "suggestions") {
      return tabContent.suggestions || result;
    }

    return result;
  };

  const tabs = [
    { id: "overview", label: "概览" },
    { id: "analysis", label: "详细分析" },
    { id: "suggestions", label: "优化建议" },
    { id: "icebreaker", label: "HR 破冰" },
    { id: "original", label: "原文" },
  ];

  return (
    <div className="min-h-screen bg-claude-bg dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 animate-slide-down">
          <div>
            <h1 className="text-3xl font-bold text-claude-text-primary dark:text-white mb-2">
              简历优化器
            </h1>
            <p className="text-claude-text-secondary dark:text-gray-400">
              使用 AI 分析 JD 与简历匹配度,获得专业优化建议
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-all border border-claude-border dark:border-gray-700 hover:scale-105"
          >
            <Download className="w-5 h-5" />
            <span>导出</span>
          </button>
        </div>

        {/* Input Areas */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* JD Input */}
          <div
            className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-claude-border dark:border-gray-700 transition-all duration-300 animate-slide-up`}
            style={{ animationDelay: "50ms" }}
          >
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-claude-text-primary dark:text-white">
                JD 职位描述
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => void handlePaste(setJd)}
                  className="text-xs px-2 py-1 text-claude-text-secondary hover:text-claude-orange hover:bg-claude-surface-elevated rounded transition-colors"
                >
                  粘贴
                </button>
                <button
                  onClick={() => setJd("")}
                  className="text-xs px-2 py-1 text-claude-text-secondary hover:text-claude-danger hover:bg-claude-surface-elevated rounded transition-colors"
                >
                  清空
                </button>
              </div>
            </div>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="粘贴目标岗位的 JD 内容..."
              className="w-full h-64 px-4 py-3 border border-claude-border dark:border-gray-700 rounded-md focus:outline-none focus:border-claude-orange focus:ring-2 focus:ring-claude-orange/20 resize-none bg-white dark:bg-gray-800 transition-all duration-200"
            />
            <div className="flex justify-between mt-2 text-xs text-claude-text-tertiary">
              <span>建议包含完整的职位描述、职责要求、技能要求等</span>
              <span>{jd.length} / 10000</span>
            </div>
          </div>

          {/* Resume Input */}
          <div
            className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-claude-border dark:border-gray-700 transition-all duration-300 animate-slide-up`}
            style={{ animationDelay: "100ms" }}
          >
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-claude-text-primary dark:text-white">
                你的简历内容
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => void handlePaste(setResume)}
                  className="text-xs px-2 py-1 text-claude-text-secondary hover:text-claude-orange hover:bg-claude-surface-elevated rounded transition-colors"
                >
                  粘贴
                </button>
                <button
                  onClick={() => setResume("")}
                  className="text-xs px-2 py-1 text-claude-text-secondary hover:text-claude-danger hover:bg-claude-surface-elevated rounded transition-colors"
                >
                  清空
                </button>
              </div>
            </div>
            <textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="粘贴你的简历内容..."
              className="w-full h-64 px-4 py-3 border border-claude-border dark:border-gray-700 rounded-md focus:outline-none focus:border-claude-orange focus:ring-2 focus:ring-claude-orange/20 resize-none bg-white dark:bg-gray-800 transition-all duration-200"
            />
            <div className="flex justify-between mt-2 text-xs text-claude-text-tertiary">
              <span>建议包含个人总结、工作经历、项目经验、技能等完整内容</span>
              <span>{resume.length} / 10000</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-claude-danger/10 border border-claude-danger rounded-md animate-shake">
            <p className="text-claude-danger text-sm">{error}</p>
          </div>
        )}

        {/* Analyze Button */}
        <div className="flex justify-center mb-8 animate-scale-in" style={{ animationDelay: "200ms" }}>
          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className={`flex items-center gap-2 px-8 py-3 bg-claude-orange text-white rounded-lg hover:bg-claude-orange-dark disabled:bg-claude-text-tertiary disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg ${
              !isLoading ? "hover:scale-105 active:scale-95" : ""
            }`}
          >
            <Sparkles className={`w-5 h-5 ${!isLoading ? "animate-pulse" : ""}`} />
            <span>{isLoading ? "分析中..." : "开始分析"}</span>
          </button>
        </div>

        {/* Results */}
        {isLoading && <AnalysisLoading />}

        {result && !isLoading && (
          <div className="animate-fade-in">
            <Tabs tabs={tabs} defaultTab="overview">
              {(activeTab) => (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-claude-border dark:border-gray-700 relative">
                  <button
                    onClick={() => void handleCopy(getCurrentTabContent(activeTab), activeTab)}
                    disabled={activeTab === "icebreaker" && isIcebreakerLoading}
                    className="absolute top-4 right-4 p-2 rounded-md hover:bg-claude-surface-elevated disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                    title="复制当前标签内容"
                  >
                    {copiedTabId === activeTab ? (
                      <Check className="w-4 h-4 text-claude-success" />
                    ) : (
                      <Copy className="w-4 h-4 text-claude-text-secondary hover:text-claude-orange" />
                    )}
                  </button>

                  {activeTab === "icebreaker" && isIcebreakerLoading ? (
                    <div className="py-16 text-center">
                      <div className="w-8 h-8 rounded-full border-2 border-claude-border border-t-claude-orange animate-spin mx-auto mb-4" />
                      <p className="text-sm text-claude-text-secondary">
                        正在生成 HR 破冰文案...
                      </p>
                    </div>
                  ) : (
                    <div className="prose prose-blue dark:prose-invert max-w-none pr-10">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {getCurrentTabContent(activeTab) || "未识别到对应章节，已展示完整分析结果。"}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              )}
            </Tabs>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
}
