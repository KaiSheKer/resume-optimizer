import { MockInterviewPanel } from "../components/mock-interview-panel";
import type { MockInterviewRoleId } from "../lib/markdown-parser";

const copiedRoleId: MockInterviewRoleId | null = null;

export const panelUsage = (
  <MockInterviewPanel
    content="# 模拟面试"
    isLoading={false}
    error=""
    hasStarted={false}
    copiedRoleId={copiedRoleId}
    onStart={() => {}}
    onRetry={() => {}}
    onCopy={() => {}}
  />
);
