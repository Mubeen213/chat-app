import axios from 'axios';
import { API_CONFIG } from '../types/constants';
import { ChatRequest, StreamResponse } from '../types/api';

/**
 * Service for handling chat API communications
 */
const chatService = {
  /**
   * Stream message responses from the backend using Server-Sent Events
   * @param prompt - User's message content
   * @param onToken - Callback for each received token
   * @param onError - Callback for error handling
   * @param onComplete - Callback when streaming is complete
   * @returns Cleanup function to close the connection
   */
  streamMessage(
    prompt: string,
    onToken: (token: string) => void,
    onError: (error: string) => void,
    onComplete: () => void
  ): () => void {
    const requestData: ChatRequest = { prompt };
    const controller = new AbortController();

    this.makeStreamRequest(requestData, controller.signal, onToken, onError, onComplete);

    // Return function to abort the fetch request
    return () => {
      controller.abort();
    };
  },

  /**
   * Makes the stream request to the API
   * @param requestData - The chat request data
   * @param signal - AbortController signal
   * @param onToken - Callback for each received token
   * @param onError - Callback for error handling
   * @param onComplete - Callback when streaming is complete
   */
  makeStreamRequest(
    requestData: ChatRequest,
    signal: AbortSignal,
    onToken: (token: string) => void,
    onError: (error: string) => void,
    onComplete: () => void
  ): void {
    fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CHAT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
      signal,
    })
      .then((response) => this.handleStreamResponse(response, onToken, onError, onComplete))
      .catch((error) => this.handleStreamError(error, onError));
  },

  /**
   * Handles the stream response
   * @param response - Fetch API response
   * @param onToken - Callback for each received token
   * @param onError - Callback for error handling
   * @param onComplete - Callback when streaming is complete
   */
  handleStreamResponse(
    response: Response,
    onToken: (token: string) => void,
    onError: (error: string) => void,
    onComplete: () => void
  ): void {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Get the response as a readable stream
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get stream reader');
    }

    // Process the stream
    this.processStream(reader, onToken, onError, onComplete).catch((error) => {
      onError(`Stream processing error: ${error.message}`);
    });
  },

  /**
   * Process the stream data
   * @param reader - ReadableStreamDefaultReader
   * @param onToken - Callback for each received token
   * @param onError - Callback for error handling
   * @param onComplete - Callback when streaming is complete
   */
  async processStream(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    onToken: (token: string) => void,
    onError: (error: string) => void,
    onComplete: () => void
  ): Promise<void> {
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        onComplete();
        break;
      }

      // Convert the chunk to text
      const chunk = new TextDecoder().decode(value);
      buffer += chunk;

      // Process all complete SSE messages in the buffer
      const messages = buffer.split('\n\n');
      buffer = messages.pop() || ''; // The last part might be incomplete

      for (const message of messages) {
        this.processSSEMessage(message, onToken, onError, onComplete);
      }
    }
  },

  /**
   * Process an individual SSE message
   * @param message - SSE message string
   * @param onToken - Callback for each received token
   * @param onError - Callback for error handling
   * @param onComplete - Callback when streaming is complete
   * @returns true if processing should continue, false if it should stop
   */
  processSSEMessage(
    message: string,
    onToken: (token: string) => void,
    onError: (error: string) => void,
    onComplete: () => void
  ): boolean {
    if (!message.trim() || !message.startsWith('data:')) return true;

    try {
      // Extract JSON from the SSE format
      const jsonStr = message.replace(/^data: /, '').trim();
      const data = JSON.parse(jsonStr) as StreamResponse;

      if (data.token) {
        onToken(data.token);
      }

      if (data.error) {
        onError(data.error);
        return false;
      }

      if (data.status === 'complete') {
        onComplete();
        return false;
      }
    } catch (error) {
      console.error('Error parsing SSE message:', error);
    }

    return true;
  },

  /**
   * Handle stream errors
   * @param error - Error object
   * @param onError - Error callback
   */
  handleStreamError(error: Error, onError: (error: string) => void): void {
    if (error.name === 'AbortError') {
      // Request was aborted, which is expected when cleanup is called
      return;
    }
    onError(`Network error: ${error.message}`);
  },

  /**
   * Non-streaming API call for getting chat completions
   * This is provided for completeness but we'll primarily use streaming
   * @param prompt - User's message
   * @returns Promise with the response
   */
  async getCompletion(prompt: string): Promise<string> {
    try {
      return await this.makeCompletionRequest(prompt);
    } catch (error) {
      return this.handleCompletionError(error);
    }
  },

  /**
   * Make the completion request
   * @param prompt - User's message
   * @returns Promise with the response
   */
  async makeCompletionRequest(prompt: string): Promise<string> {
    const response = await axios.post(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CHAT}`,
      { prompt } as ChatRequest,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: API_CONFIG.TIMEOUT,
      }
    );

    return response.data.content || '';
  },

  /**
   * Handle completion request errors
   * @param error - Error object
   * @throws Error with appropriate message
   */
  handleCompletionError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || error.message);
    }
    throw new Error('An unknown error occurred');
  },
};

export default chatService;
