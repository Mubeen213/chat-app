from typing import Dict, Any, Generator
import config
import requests
import json


class LLMService:
  """Service to handle LLM requests."""

  @staticmethod
  def create_prompt(prompt: str, stream=False) -> Dict[str, Any]:
        """
        Create prompt for LLM request using chat completions format
        """
        messages = [
            {
                "role": "system",
                "content": "You are a helpful assistant."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]

        return {
            "model": config.MODEL_NAME,
            "messages": messages,
            "temperature": config.TEMPERATURE,
            "stream": stream
        }

  @staticmethod
  def format_sse(data: Dict[str, Any]) -> str:
      """Format data as Server-Sent Event"""
      return f"data: {json.dumps(data)}\n\n"


  @staticmethod
  def process_streaming_response(response: requests.Response) -> Generator[str, None, None]:
        """
        Process streaming response from LLM
        """
        print("Processing streaming response...")

        for line in response.iter_lines():
            if not line:
                continue
            line_text = line.decode("utf-8")
            print("Decoded line:", line_text)
            if line_text.startswith('data:'):
                json_str = line_text[5:].strip()

                if json_str.strip() == '[DONE]':
                    break

                try:
                    json_data = json.loads(json_str)

                    if 'choices' in json_data and len(json_data['choices']) > 0:
                        choice = json_data['choices'][0]

                        if 'delta' in choice and 'content' in choice['delta']:
                            token = choice['delta']['content']
                            yield LLMService.format_sse({'token': token})

                        if choice.get('finish_reason') is not None:
                            break

                except json.JSONDecodeError:
                    continue
                except Exception as e:
                    yield LLMService.format_sse({'error': str(e)})


  @staticmethod
  def stream_response(prompt: str) -> Generator[str, None, None]:
        """
        Stream response from LLM
        """
        llm_data = LLMService.create_prompt(prompt, stream=True)

        try:
            response = requests.post(
                f"{config.LLM_BASE_URL}/chat/completions",
                json=llm_data,
                headers={"Content-Type": "application/json"},
                stream=True,
            )
            print("LLM response", response)
            if response.status_code != 200:
                yield LLMService.format_sse({
                    'error': f"LLM request failed with status code {response.status_code}"
                })
                return

            for token_event in LLMService.process_streaming_response(response):
                yield token_event

            yield LLMService.format_sse({'status': 'complete'})

        except requests.RequestException as e:
            yield LLMService.format_sse({'error': str(e)})
        except Exception as e:
            yield LLMService.format_sse({'error': f"Unexpected error: {str(e)}"})


  @staticmethod
  def get_completion(prompt: str) -> Dict[str, Any]:
        """
        Get complete response from LLM (non-streaming)
        """
        llm_data = LLMService.create_prompt(prompt, stream=False)

        try:
            response = requests.post(
                f"{config.LLM_BASE_URL}/chat/completions",
                json=llm_data,
                headers={"Content-Type": "application/json"},
            )

            if response.status_code != 200:
                return {"error": f"LLM request failed with status code {response.status_code}"}

            result = response.json()

            # Extract the assistant's message content
            if 'choices' in result and len(result['choices']) > 0:
                message = result['choices'][0].get('message', {})
                content = message.get('content', '')
                return {"content": content}

            return {"error": "No valid response from LLM"}

        except Exception as e:
            return {"error": str(e)}
