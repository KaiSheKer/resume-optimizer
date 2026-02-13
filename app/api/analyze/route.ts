import { NextRequest, NextResponse } from "next/server";
import { resumeAnalysisPrompt } from "@/lib/prompt";

export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求体
    const body = await request.json();
    const { jd, resume } = body;

    // 2. 参数验证
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

    // 3. 检查环境变量
    const apiKey = process.env.KIMI_API_KEY;
    if (!apiKey) {
      console.error("KIMI_API_KEY 环境变量未设置");
      return NextResponse.json(
        { error: "服务器配置错误：API Key 未设置" },
        { status: 500 }
      );
    }

    // 4. 调用 Kimi API
    const prompt = resumeAnalysisPrompt(jd, resume);
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
            content: prompt,
          },
        ],
        temperature: 1,
        stream: false,
      }),
    });

    // 5. 处理 API 错误
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

    // 6. 返回成功结果
    const data = await response.json();
    const content = data.choices[0]?.message?.content || "";

    return NextResponse.json({ content });
  } catch (error) {
    // 7. 捕获未知错误
    console.error("API 路由错误:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "服务器内部错误",
      },
      { status: 500 }
    );
  }
}
