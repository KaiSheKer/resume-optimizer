interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface KimiResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function analyzeResume(jd: string, resume: string, apiKey: string): Promise<string> {
  const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "kimi-k2.5",
      messages: [
        {
          role: "system",
          content: "你是一个资深互联网 HR 和产品总监，擅长分析产品经理简历与 JD 的匹配度，并给出专业优化建议。",
        },
        {
          role: "user",
          content: `JD 内容：\n${jd}\n\n简历内容：\n${resume}\n\n请分析匹配度并给出优化建议，使用 Markdown 格式输出。`,
        },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
  }

  const data: KimiResponse = await response.json();
  return data.choices[0]?.message?.content || "无法获取分析结果";
}

export default analyzeResume;
