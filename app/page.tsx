"use client";

import { Dispatch, SetStateAction, useMemo, useRef, useState } from "react";
import { Sparkles, Download, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AnalysisLoading } from "@/components/analysis-loading";
import { MockInterviewPanel } from "@/components/mock-interview-panel";
import { Tabs } from "@/components/tabs";
import { Toast } from "@/components/toast";
import { getTabContentById, type MockInterviewRoleId } from "@/lib/markdown-parser";

const MOCK_INTERVIEW_ROLE_SEQUENCE: MockInterviewRoleId[] = ["manager", "vp", "hrd"];

function composeMockInterviewMarkdown(
  sections: Partial<Record<MockInterviewRoleId, string>>
): string {
  const orderedSections = MOCK_INTERVIEW_ROLE_SEQUENCE.map((roleId) => sections[roleId]?.trim())
    .filter((section): section is string => Boolean(section));

  return orderedSections.length > 0 ? ["# 模拟面试", ...orderedSections].join("\n\n") : "";
}

export default function Home() {
  const [jd, setJd] = useState("");
  const [resume, setResume] = useState("");
  const [result, setResult] = useState("");
  const [icebreakerText, setIcebreakerText] = useState("");
  const [isIcebreakerLoading, setIsIcebreakerLoading] = useState(false);
  const [icebreakerError, setIcebreakerError] = useState("");
  const [mockInterviewSections, setMockInterviewSections] = useState<
    Partial<Record<MockInterviewRoleId, string>>
  >({});
  const [isMockInterviewLoading, setIsMockInterviewLoading] = useState(false);
  const [mockInterviewLoadingRoleId, setMockInterviewLoadingRoleId] =
    useState<MockInterviewRoleId | null>(null);
  const [mockInterviewError, setMockInterviewError] = useState("");
  const [hasMockInterviewStarted, setHasMockInterviewStarted] = useState(false);
  const [copiedMockInterviewRoleId, setCopiedMockInterviewRoleId] =
    useState<MockInterviewRoleId | null>(null);
  const [copiedTabId, setCopiedTabId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const mockInterviewRunIdRef = useRef(0);

  const tabContent = useMemo(
    () => ({
      overview: getTabContentById(result, "overview"),
      analysis: getTabContentById(result, "analysis"),
      suggestions: getTabContentById(result, "suggestions"),
      original: result.trim(),
    }),
    [result]
  );

  const mockInterviewContent = useMemo(
    () => composeMockInterviewMarkdown(mockInterviewSections),
    [mockInterviewSections]
  );

  const resetMockInterviewState = () => {
    mockInterviewRunIdRef.current += 1;
    setMockInterviewSections({});
    setMockInterviewError("");
    setIsMockInterviewLoading(false);
    setMockInterviewLoadingRoleId(null);
    setHasMockInterviewStarted(false);
    setCopiedMockInterviewRoleId(null);
  };

  const handleAnalyze = async () => {
    if (!jd.trim() || !resume.trim()) {
      setError("请输入 JD 和简历内容");
      setToast({ message: "请输入 JD 和简历内容", type: "error" });
      return;
    }

    resetMockInterviewState();
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
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || `API 请求失败: ${response.status}`);
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
      resetMockInterviewState();
      setToast({ message: "已粘贴", type: "success" });
    } catch {
      setToast({ message: "无法读取剪贴板,请手动粘贴", type: "error" });
    }
  };

  const handleStartMockInterview = async () => {
    if (!result.trim()) {
      setToast({ message: "请先完成简历分析", type: "info" });
      return;
    }

    const runId = mockInterviewRunIdRef.current + 1;
    mockInterviewRunIdRef.current = runId;

    setHasMockInterviewStarted(true);
    setIsMockInterviewLoading(true);
    setMockInterviewLoadingRoleId(MOCK_INTERVIEW_ROLE_SEQUENCE[0] ?? null);
    setMockInterviewError("");
    setMockInterviewSections({});
    setCopiedMockInterviewRoleId(null);

    try {
      for (const roleId of MOCK_INTERVIEW_ROLE_SEQUENCE) {
        setMockInterviewLoadingRoleId(roleId);

        const response = await fetch("/api/mock-interview", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jd,
            resume,
            analysis: result,
            roleId,
          }),
        });

        if (mockInterviewRunIdRef.current !== runId) {
          return;
        }

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => ({}));
          throw new Error(errorPayload.error || `模拟面试生成失败: ${response.status}`);
        }

        const data = await response.json();
        const content = typeof data.content === "string" ? data.content.trim() : "";

        if (!content) {
          throw new Error("模拟面试内容为空，请重试");
        }

        setMockInterviewSections((current) => ({
          ...current,
          [roleId]: content,
        }));
      }

      if (mockInterviewRunIdRef.current === runId) {
        setToast({ message: "模拟面试已全部生成", type: "success" });
      }
    } catch (err) {
      if (mockInterviewRunIdRef.current !== runId) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : "模拟面试生成失败，请重试";
      setMockInterviewError(errorMessage);
      setToast({ message: errorMessage, type: "error" });
    } finally {
      if (mockInterviewRunIdRef.current === runId) {
        setIsMockInterviewLoading(false);
        setMockInterviewLoadingRoleId(null);
      }
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

  const handleCopyMockInterviewRole = async (
    content: string,
    roleId: MockInterviewRoleId
  ) => {
    if (!content.trim()) {
      setToast({ message: "当前角色暂无可复制内容", type: "info" });
      return;
    }

    try {
      await navigator.clipboard.writeText(content);
      setCopiedMockInterviewRoleId(roleId);
      setToast({ message: "已复制到剪贴板", type: "success" });
      window.setTimeout(() => {
        setCopiedMockInterviewRoleId((current) => (current === roleId ? null : current));
      }, 1200);
    } catch {
      setToast({ message: "复制失败，请重试", type: "error" });
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
    { id: "mockInterview", label: "模拟面试" },
    { id: "original", label: "原文" },
  ];

  return (
    <div className="min-h-screen bg-claude-bg dark:bg-gray-900">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between animate-slide-down">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-claude-text-primary dark:text-white">
              简历优化器
            </h1>
            <p className="text-claude-text-secondary dark:text-gray-400">
              使用 AI 分析 JD 与简历匹配度,获得专业优化建议
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg border border-claude-border bg-white px-4 py-2 shadow transition-all hover:scale-105 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
          >
            <Download className="w-5 h-5" />
            <span>导出</span>
          </button>
        </div>

        {/* Input Areas */}
        <div className="mb-6 grid gap-6 md:grid-cols-2">
          {/* JD Input */}
          <div
            className="animate-slide-up rounded-lg border border-claude-border bg-white p-6 shadow-sm transition-all duration-300 dark:border-gray-700 dark:bg-gray-800"
            style={{ animationDelay: "50ms" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <label className="block text-sm font-medium text-claude-text-primary dark:text-white">
                JD 职位描述
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => void handlePaste(setJd)}
                  className="rounded px-2 py-1 text-xs text-claude-text-secondary transition-colors hover:bg-claude-surface-elevated hover:text-claude-orange"
                >
                  粘贴
                </button>
                <button
                  onClick={() => {
                    setJd("");
                    resetMockInterviewState();
                  }}
                  className="rounded px-2 py-1 text-xs text-claude-text-secondary transition-colors hover:bg-claude-surface-elevated hover:text-claude-danger"
                >
                  清空
                </button>
              </div>
            </div>
            <textarea
              value={jd}
              onChange={(e) => {
                setJd(e.target.value);
                resetMockInterviewState();
              }}
              placeholder="粘贴目标岗位的 JD 内容..."
              className="h-64 w-full resize-none rounded-md border border-claude-border bg-white px-4 py-3 transition-all duration-200 focus:border-claude-orange focus:outline-none focus:ring-2 focus:ring-claude-orange/20 dark:border-gray-700 dark:bg-gray-800"
            />
            <div className="mt-2 flex justify-between text-xs text-claude-text-tertiary">
              <span>建议包含完整的职位描述、职责要求、技能要求等</span>
              <span>{jd.length} / 10000</span>
            </div>
          </div>

          {/* Resume Input */}
          <div
            className="animate-slide-up rounded-lg border border-claude-border bg-white p-6 shadow-sm transition-all duration-300 dark:border-gray-700 dark:bg-gray-800"
            style={{ animationDelay: "100ms" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <label className="block text-sm font-medium text-claude-text-primary dark:text-white">
                你的简历内容
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => void handlePaste(setResume)}
                  className="rounded px-2 py-1 text-xs text-claude-text-secondary transition-colors hover:bg-claude-surface-elevated hover:text-claude-orange"
                >
                  粘贴
                </button>
                <button
                  onClick={() => {
                    setResume("");
                    resetMockInterviewState();
                  }}
                  className="rounded px-2 py-1 text-xs text-claude-text-secondary transition-colors hover:bg-claude-surface-elevated hover:text-claude-danger"
                >
                  清空
                </button>
              </div>
            </div>
            <textarea
              value={resume}
              onChange={(e) => {
                setResume(e.target.value);
                resetMockInterviewState();
              }}
              placeholder="粘贴你的简历内容..."
              className="h-64 w-full resize-none rounded-md border border-claude-border bg-white px-4 py-3 transition-all duration-200 focus:border-claude-orange focus:outline-none focus:ring-2 focus:ring-claude-orange/20 dark:border-gray-700 dark:bg-gray-800"
            />
            <div className="mt-2 flex justify-between text-xs text-claude-text-tertiary">
              <span>建议包含个人总结、工作经历、项目经验、技能等完整内容</span>
              <span>{resume.length} / 10000</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 animate-shake rounded-md border border-claude-danger bg-claude-danger/10 p-4">
            <p className="text-sm text-claude-danger">{error}</p>
          </div>
        )}

        {/* Analyze Button */}
        <div className="mb-8 flex justify-center animate-scale-in" style={{ animationDelay: "200ms" }}>
          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className={`flex items-center gap-2 rounded-lg bg-claude-orange px-8 py-3 text-white shadow-md transition-all duration-200 hover:bg-claude-orange-dark hover:shadow-lg disabled:cursor-not-allowed disabled:bg-claude-text-tertiary ${
              !isLoading ? "active:scale-95 hover:scale-105" : ""
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
              {(activeTab) =>
                activeTab === "mockInterview" ? (
                  <MockInterviewPanel
                    content={mockInterviewContent}
                    isLoading={isMockInterviewLoading}
                    loadingRoleId={mockInterviewLoadingRoleId}
                    error={mockInterviewError}
                    hasStarted={hasMockInterviewStarted}
                    copiedRoleId={copiedMockInterviewRoleId}
                    onStart={() => void handleStartMockInterview()}
                    onRetry={() => void handleStartMockInterview()}
                    onCopy={(content, roleId) => void handleCopyMockInterviewRole(content, roleId)}
                  />
                ) : (
                  <div className="relative rounded-lg border border-claude-border bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    <button
                      onClick={() => void handleCopy(getCurrentTabContent(activeTab), activeTab)}
                      disabled={activeTab === "icebreaker" && isIcebreakerLoading}
                      className="absolute right-4 top-4 rounded-md p-2 transition-colors hover:bg-claude-surface-elevated disabled:cursor-not-allowed disabled:opacity-40"
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
                        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-claude-border border-t-claude-orange" />
                        <p className="text-sm text-claude-text-secondary">
                          正在生成 HR 破冰文案...
                        </p>
                      </div>
                    ) : (
                      <div className="prose prose-blue max-w-none pr-10 dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {getCurrentTabContent(activeTab) || "未识别到对应章节，已展示完整分析结果。"}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                )
              }
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
