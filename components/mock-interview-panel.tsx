"use client";

import { Check, Copy, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Tabs } from "@/components/tabs";
import {
  MockInterviewRoleId,
  getMockInterviewRoleContent,
} from "@/lib/markdown-parser";

const ROLE_TABS: Array<{ id: MockInterviewRoleId; label: string }> = [
  { id: "manager", label: "直属上级" },
  { id: "vp", label: "高级 VP" },
  { id: "hrd", label: "HRD" },
];

interface MockInterviewPanelProps {
  content: string;
  isLoading: boolean;
  error: string;
  hasStarted: boolean;
  copiedRoleId: MockInterviewRoleId | null;
  onStart: () => void;
  onRetry: () => void;
  onCopy: (content: string, roleId: MockInterviewRoleId) => void;
}

export function MockInterviewPanel({
  content,
  isLoading,
  error,
  hasStarted,
  copiedRoleId,
  onStart,
  onRetry,
  onCopy,
}: MockInterviewPanelProps) {
  if (!hasStarted) {
    return (
      <div className="rounded-lg border border-claude-border bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-claude-orange/10 text-claude-orange">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="mb-3 text-xl font-semibold text-claude-text-primary dark:text-white">
            模拟面试
          </h3>
          <p className="mb-6 text-sm leading-7 text-claude-text-secondary dark:text-gray-400">
            基于当前 JD、简历和分析结果，生成直属上级、高级 VP、HRD 三种视角的定制化面试辅导面板。
          </p>
          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 rounded-lg bg-claude-orange px-6 py-3 text-white transition-all hover:scale-105 hover:bg-claude-orange-dark"
          >
            <Sparkles className="h-4 w-4" />
            <span>开始模拟</span>
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-claude-border bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-claude-border border-t-claude-orange" />
          <p className="text-sm text-claude-text-secondary dark:text-gray-400">
            正在生成直属上级 / 高级 VP / HRD 视角问题...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-claude-danger/40 bg-white p-8 shadow-lg dark:bg-gray-800">
        <div className="mx-auto max-w-2xl text-center">
          <h3 className="mb-3 text-xl font-semibold text-claude-text-primary dark:text-white">
            模拟面试生成失败
          </h3>
          <p className="mb-6 text-sm leading-7 text-claude-text-secondary dark:text-gray-400">
            {error}
          </p>
          <button
            onClick={onRetry}
            className="rounded-lg bg-claude-orange px-6 py-3 text-white transition-all hover:bg-claude-orange-dark"
          >
            重新生成
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-claude-border bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <Tabs tabs={ROLE_TABS} defaultTab="manager">
        {(activeRoleTab) => {
          const roleId = activeRoleTab as MockInterviewRoleId;
          const roleContent = getMockInterviewRoleContent(content, roleId);

          return (
            <div className="relative">
              <button
                onClick={() => onCopy(roleContent, roleId)}
                className="absolute right-0 top-0 rounded-md p-2 transition-colors hover:bg-claude-surface-elevated"
                title="复制当前角色内容"
              >
                {copiedRoleId === roleId ? (
                  <Check className="h-4 w-4 text-claude-success" />
                ) : (
                  <Copy className="h-4 w-4 text-claude-text-secondary hover:text-claude-orange" />
                )}
              </button>

              <div className="prose prose-blue max-w-none pr-10 dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {roleContent || "未识别到该角色内容，请重新生成。"}
                </ReactMarkdown>
              </div>
            </div>
          );
        }}
      </Tabs>
    </div>
  );
}
