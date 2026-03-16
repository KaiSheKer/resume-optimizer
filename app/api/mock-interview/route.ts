import { NextRequest, NextResponse } from "next/server";
import { getMockInterviewRoleLabel, type MockInterviewRoleId } from "@/lib/markdown-parser";
import { mockInterviewPrompt, mockInterviewRolePrompt } from "@/lib/prompt";

const ROLE_FOCUS_MAPPING: Record<MockInterviewRoleId, string> = {
  manager: "聚焦执行能力、项目细节、跨团队协作、优先级取舍、结果真实性",
  vp: "聚焦业务判断、战略理解、目标拆解、影响力、组织视角",
  hrd: "聚焦动机、稳定性、文化适配、风险点、职业路径一致性",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jd, resume, analysis, roleId } = body;

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

    if (roleId && !(roleId in ROLE_FOCUS_MAPPING)) {
      return NextResponse.json(
        { error: "缺少或无效的角色参数" },
        { status: 400 }
      );
    }

    const normalizedRoleId = roleId as MockInterviewRoleId | undefined;
    const prompt = normalizedRoleId
      ? mockInterviewRolePrompt(
          jd,
          resume,
          analysis,
          getMockInterviewRoleLabel(normalizedRoleId),
          ROLE_FOCUS_MAPPING[normalizedRoleId]
        )
      : mockInterviewPrompt(jd, resume, analysis);
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
            content:
              "你是一位资深面试训练顾问，擅长把 JD、简历和岗位匹配分析转化为高质量的模拟面试辅导面板。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Kimi API 错误:", errorData);
      return NextResponse.json(
        {
          error:
            errorData.error?.message ||
            `API 请求失败: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = String(data.choices[0]?.message?.content || "").trim();

    if (!content) {
      return NextResponse.json(
        { error: "模拟面试内容为空，请重试" },
        { status: 502 }
      );
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Mock interview API 路由错误:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "服务器内部错误",
      },
      { status: 500 }
    );
  }
}
