
export interface ChatRequest {
  prompt: string
}

export interface ChatResponse {
  content?: string
  error?: string
}

export interface StreamResponse {
  token?: string
  error?: string
  status?: string
}
