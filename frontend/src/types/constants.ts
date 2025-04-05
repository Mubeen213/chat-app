

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5010',
  ENDPOINTS: {
    CHAT: '/api/chat'
  },
  TIMEOUT: 30000
}


export const UI_CONFIG = {
  MAX_INPUT_HEIGHT: 200,
  MAX_SCROLL_THRESHOLD: 100,
  TYPING_INDICATOR_DELAY: 300
}
export const SYSTEM_MESSAGES = {
  WELCOME: "Hello! I'm an AI assistant powered by a local language model. How can I help you today?",
  ERROR: "Sorry, an error occurred while processing your request. Please try again.",
  NETWORK_ERROR: "Unable to connect to the server. Please check your connection and try again.",
  EMPTY_RESPONSE: "I don't have a response for that. Please try a different question.",
};
