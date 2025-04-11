from typing import Dict, Any, Callable
import logging
import requests
import json
import config
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HandleToolCalls:
    """
    Class to handle tool calls from the LLM response.
    """

    # Class-level registry for tool functions
    TOOL_FUNCTIONS: Dict[str, Callable] = {}

    @staticmethod
    def register_tool(name: str, func: Callable):
        """
        Register a tool function to the registry.
        """
        HandleToolCalls.TOOL_FUNCTIONS[name] = func

    @staticmethod
    def get_country_code(country: str) -> str:
        """
        Get the country code for a given country name.
        """
        try:
            # Construct the API URL
            api_url = f"{config.SERVER_BASE_URL}/autocomplete?term={country}&payment_method_int=1&payment_method=0&country=1"
            response = requests.get(api_url)

            response_data = response.json()
            logger.info(f"Response from country code API: {response_data}")

            # Check if response data is valid
            if not response_data or not isinstance(response_data, list) or len(response_data) == 0:
              logger.error("Invalid or empty response from country code API")
              return {"error": "Invalid response from country code API"}
            
            # Extract only the label value from the first item in the response
            label = response_data[0].get("label", "")
            if not label:
                return {"error": "No labels found in the response"}
            return label

        except requests.RequestException as e:
            logger.error(f"RequestException while getting country code: {str(e)}")
            return {"error": "RequestException"}, 500
        except Exception as e:
            logger.error(f"Unexpected error while getting country code: {str(e)}")
            return {"error": "Unexpected error"}, 500
        

    @staticmethod
    def search_flights(source: str, destination: str, departure_date: str) -> Dict[str, Any]:
        """
        Search for flights using the external API.
        """
        if not source or not isinstance(source, str):
            return {"error": "Invalid source"}
        if not destination or not isinstance(destination, str):
            return {"error": "Invalid destination"}
        if not departure_date or not isinstance(departure_date, str):  # Add date format validation if needed
            return {"error": "Invalid departure date"}

        try:
            print(f"Searching flights from {source} to {destination} on {departure_date}")
            # Validate the source, destination, and departure_date
            src = HandleToolCalls.get_country_code(source)
            dest = HandleToolCalls.get_country_code(destination)

            # Construct the API URL
            api_url = f"{config.SERVER_BASE_URL}/search?date={departure_date}&src={src}&dest={dest}"
            print(f"API URL: {api_url}")
            response = requests.get(api_url)

            if response.status_code != 200:
                return {"error": f"Flight search failed with status code {response.status_code}"}

            # Return the API response as JSON
            return response.json()

        except requests.RequestException as e:
            logger.error(f"RequestException while searching flights: {str(e)}")
            return {"error": f"RequestException: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error while searching flights: {str(e)}")
            return {"error": f"Unexpected error: {str(e)}"}

    @staticmethod
    def handle_tool_call(tool_call: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle tool calls from the LLM response.
        """
        try:
            function_details = tool_call.get("function", {})
            function_name = function_details.get("name")
            arguments = function_details.get("arguments", {})

                   
            # Parse arguments if they are a JSON string
            if isinstance(arguments, str):
                arguments = json.loads(arguments)

            print(f"Function name: {function_name}, Arguments: {arguments}")
            if not function_name:
                return {"error": "Function name is missing in tool call"}

            if function_name == 'search_flights':
                # Call the registered function
                result = HandleToolCalls.search_flights(
                    source=arguments.get("source"),
                    destination=arguments.get("destination"),
                    departure_date=arguments.get("departure_date")
                )
            
            return result

        except Exception as e:
            logger.error(f"Error handling tool call: {str(e)}")
            return {"error": f"Error handling tool call: {str(e)}"}
