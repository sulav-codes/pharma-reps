export type InteractionPayload = {
  hcp_name: string;
  product?: string;
  summary?: string;
  follow_up?: string;
  sentiment?: string;
  interaction_type?: string;
  occurred_at?: string;
  raw_text?: string;
};

export type InteractionRecord = InteractionPayload & {
  id?: number;
  created_at?: string;
};

export type ChatResponse = {
  status?: string;
  data?: InteractionRecord;
  message?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function sendChat(message: string): Promise<ChatResponse> {
  return request<ChatResponse>("/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
}

export async function createInteraction(payload: InteractionPayload) {
  if (!payload.hcp_name) {
    throw new Error("HCP name is required.");
  }

  const body = {
    ...payload,
    occurred_at: payload.occurred_at
      ? new Date(payload.occurred_at).toISOString()
      : null,
  };

  return request<InteractionRecord>("/interactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, options);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.detail || "Request failed";
    throw new Error(message);
  }

  return data as T;
}
