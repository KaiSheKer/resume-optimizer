const INSUFFICIENT_BALANCE_PATTERNS = [
  "insufficient balance",
  "suspended due to insufficient balance",
  "please recharge your account",
];

export function getKimiErrorMessage(status: number, upstreamMessage?: string): string {
  const normalizedMessage = upstreamMessage?.trim() ?? "";
  const loweredMessage = normalizedMessage.toLowerCase();

  if (
    status === 429 &&
    INSUFFICIENT_BALANCE_PATTERNS.some((pattern) => loweredMessage.includes(pattern))
  ) {
    return "Kimi 账户余额不足或套餐不可用，请检查计费状态后重试。";
  }

  if (status === 429 && !normalizedMessage) {
    return "Kimi 请求过于频繁，请稍后重试。";
  }

  return normalizedMessage || `API 请求失败: ${status}`;
}
