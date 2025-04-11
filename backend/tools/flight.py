available_tools = [
    {
        "type": "function",
        "function": {
            "name": "search_flights",
            "description": "Search flights ",
            "parameters": {
                "type": "object",
                "properties": {
                    "source": {"type": "string", "description": "Source "},
                    "destination": {"type": "string", "description": "Destination"},
                    "departure_date": {"type": "string", "description": "Departure date formatted in DD MM, YYYY eg: 01 June, 2025"},
                },
                "required": ["source", "destination", "departure_date"],
            }
        }
    }
]
