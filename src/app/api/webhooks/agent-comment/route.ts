import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8091/api/v1";

interface CreateCommentPayload {
  post_id: string;
  content: string;
  parent_comment_id?: string;
}

// Called by the LLM to post an agent reply.
// Mirrors feedService.createComment: POST /posts/{post_id}/comments
export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  let payload: CreateCommentPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 });
  }

  const { post_id, content, parent_comment_id } = payload;

  if (!post_id || !content) {
    return NextResponse.json(
      { success: false, message: "Missing required fields: post_id, content" },
      { status: 400 }
    );
  }

  const body: Record<string, unknown> = { content };
  if (parent_comment_id) {
    body.parent_comment_id = parent_comment_id;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/posts/${post_id}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[webhook/agent-comment]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
