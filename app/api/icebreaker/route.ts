import { NextRequest, NextResponse } from "next/server";
import { icebreakerPrompt } from "@/lib/prompt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jd, resume, analysis } = body;

    if (!jd || typeof jd !== "string") {
      return NextResponse.json(
        { error: "缺少或无效的 JD 参数" },
        { status: 400 }
      );
    }

    if (!resume || typeof resume !== "string") {
      return NextResponse.json(
        { error: "缺少或无效的简历参数" },
        { status: 400 }
      );
    }

    if (!analysis || typeof analysis !== "string") {
      return NextResponse.json(
        { error: "缺少或无效的分析结果参数" },
        { status: 400 }
      );
    }

    const apiKey = process.env.KIMI_API_KEY;
    if (!apiKey) {
      console.error("KIMI_API_KEY 环境变量未设置");
      return NextResponse.json(
        { error: "服务器配置错误：API Key 未设置" },
        { status: 500 }
      );
    }

    const prompt = icebreakerPrompt(jd, resume, analysis);
    const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "kimi-k2.5",
        messages: [
          {
            role: "system",
            content: "你是一位专业的简历顾问,擅长撰写吸引 HR 注意力的破冰文案。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 1,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Kimi API 错误:", errorData);
      return NextResponse.json(
        {
          error: errorData.error?.message || `API 请求失败: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const rawContent = data.choices[0]?.message?.content || "";
    const content = String(rawContent).replace(/^["']|["']$/g, "").trim();

    return NextResponse.json({ content });
  } catch (error) {
    console.error("API 路由错误:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "服务器内部错误",
      },
      { status: 500 }
    );
  }
}
