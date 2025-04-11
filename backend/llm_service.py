from typing import Dict, Any, Generator
import config
import requests
import json
from handler import HandleToolCalls

class LLMService:
  """Service to handle LLM requests."""

  @staticmethod
  def create_prompt(prompt: str, tools: list= None) -> Dict[str, Any]:
        """
        Create prompt for LLM request using chat completions format
        """
        system_prompt = """
        You are a friendly and knowledgeable travel assistant that helps users book flights and plan their trips.
        Do not ask for retyrn dates
        Your goal is to engage in a helpful and conversational way.
        If year is not given consider the year as 2025
        Say something nice or interesting about the destinations users mention — help them get excited about their trip. Offer useful travel suggestions and help them plan with ease. If the user seems unsure about timing, share when the weather is most pleasant in that location.
        Date format for 'search_flights' function is 'DD Month, YYYY' (e.g., '01 Jun, 2025').
        Always convert locations into standard airport codes before proceeding. Use the provided tools to search for flights.
        If the user asks for a specific flight, provide the details in a clear and concise manner.
        IMPORTANT: You should only talk about topics related to travel and flight booking.
        """

        messages = [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": prompt
            }
        ]

        request_body = {
                "model": config.MODEL_NAME,
                "messages": messages,
                "temperature": config.TEMPERATURE
            }

        if tools:
            request_body["tools"] = tools

        return request_body

  @staticmethod
  def format_sse(data: Dict[str, Any]) -> str:
      """Format data as Server-Sent Event"""
      return f"data: {json.dumps(data)}\n\n"

  @staticmethod
  def process_streaming_response(response: requests.Response) -> Generator[str, None, None]:
        """
        Process streaming response from LLM
        """
        for line in response.iter_lines():
            if not line:
                continue
            line_text = line.decode("utf-8")
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
        llm_data = LLMService.create_prompt(prompt)

        try:
            response = requests.post(
                f"{config.LLM_BASE_URL}/chat/completions",
                json=llm_data,
                headers={"Content-Type": "application/json"},                            
            )
            if response.status_code != 200:
                yield LLMService.format_sse({
                    'error': f"LLM request failed with status code {response.status_code}"
                })                                                                                                              
                return                                              
                                                                 
            for token_event in LLMService.process_streaming_response(response):
                yield token_event              

            yield LLMService.format_sse({'status': 'complete'})

        except requests.RequestException as e:
            print("RequestException:", e)
            yield LLMService.format_sse({'error': str(e)})
        except Exception as e:
            yield LLMService.format_sse({'error': f"Unexpected error: {str(e)}"})


  @staticmethod
  def get_completion(prompt: str) -> Dict[str, Any]:
        """
        Get complete response from LLM (non-streaming)
        """
        llm_data = LLMService.create_prompt(prompt)

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

  @staticmethod
  def get_completion_tools(prompt: str, tools: list = None) -> Dict[str, Any]:
        """
        Get complete response from LLM (non-streaming), with optional tool support.
        """
        llm_data = LLMService.create_prompt(prompt, tools=tools)

        try:
            # Step 1: Initial LLM request
            response = LLMService._send_llm_request(llm_data)
            if "error" in response:
                return response
            print(f"LLM response: {response.json()}")
            result = response.json()
            choice = result.get("choices", [{}])[0]

            # Step 2: Handle tool calls if present
            if "message" in choice and "tool_calls" in choice["message"]:
                return LLMService._handle_tool_calls(prompt, choice, llm_data)

            # Step 3: Handle normal assistant reply
            if "message" in choice and "content" in choice["message"]:
                return {"content": choice["message"]["content"]}

            return {"error": "No valid message or tool call in response"}

        except Exception as e:
            return {"error": str(e)}, 500

  @staticmethod
  def _send_llm_request(llm_data: Dict[str, Any]) -> requests.Response:
        """
        Send a request to the LLM and return the response.
        """
        try:
            response = requests.post(
                f"{config.LLM_BASE_URL}/chat/completions",
                json=llm_data,
                headers={"Content-Type": "application/json"},
            )
            if response.status_code != 200:
                return {"error": f"LLM request failed with status code {response.status_code}"}
            return response
        except requests.RequestException as e:
            return {"error": f"Request error: {str(e)}"}, 500
        
  @staticmethod
  def _summarise_flight_search_response(prompt, tool_result):
    """
    Summarise the tool response by the LLM.
    Show the cheapest flight option.
    Show the fastest flight option.
    Provide a brief summary of the flight search results.
    """
    prompt = """
    You are a helpful travel assistant."""

    try:
        summary_prompt = """
            Summarise the following tool response for which User's query was :{prompt} \n\n
            and flight search response was  : {tool_result} \n\n
            Do not provide any message in response like based on JSON data provided etc.
            Do not provide any imformation which is not present in response like mismatched
            dates from User query etc.
            Provide a very breif summary from the flight search results.
            Show the cheapest flight option.
            Show the fastest flight option.
              """
        llm_data = LLMService.create_prompt(
            summary_prompt
        )
        # Send follow-up request to LLM
        print(f"Summarising flight search response with {len(tool_result)} items...")
        follow_up_response = LLMService._send_llm_request(llm_data)

        # Extract and return only the content from the response
        follow_up_result = follow_up_response.json()
        if 'choices' in follow_up_result and len(follow_up_result['choices']) > 0:
            message = follow_up_result['choices'][0].get('message', {})
            content = message.get('content', '')
            return content

        return {"error": "No valid content in follow-up response"}, 500

    except Exception as e:
        print(f"Error creating prompt: {str(e)}")
        return {"error": f"Error creating prompt: {str(e)}"}, 500

  @staticmethod
  def _handle_tool_calls(prompt:str, choice: Dict[str, Any], llm_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process tool calls and handle follow-up requests.
        """
        try:
            tool_call = choice["message"]["tool_calls"][0]
            tool_result = HandleToolCalls.handle_tool_call(tool_call)
            return tool_result
        except Exception as e:
            return {"error": f"Tool call handling error: {str(e)}"}, 500

  @staticmethod
  def _update_conversation_with_tool_result(llm_data: Dict[str, Any], tool_call: Dict[str, Any], tool_result: Any):
        """
        Update the conversation data with the tool call result.
        """
        llm_data["messages"].append({
            "role": "assistant",
            "content": None,
            "tool_calls": [
                {
                    "id": tool_call["id"],
                    "type": tool_call["type"],
                    "function": {
                        "name": tool_call["function"]["name"],
                        "arguments": tool_call["function"]["arguments"]
                    }
                }
            ]
        })

        llm_data["messages"].append({
            "role": "tool",
            "tool_call_id": tool_call["id"],
            "content": json.dumps(tool_result)
        })