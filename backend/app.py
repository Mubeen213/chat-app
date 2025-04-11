import os
import json
import requests
from dotenv import load_dotenv
from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
import config
import tools.flight as flight
from llm_service import LLMService
load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple health check endpoint to verify server is running."""
    return jsonify({"status": "ok"})


@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Chat endpoint that streams responses from the LLM.
    """
    try:
        data = request.json
        prompt = data.get('prompt', '')

        if not prompt:
            return jsonify({"error": "Prompt is required"}), 400

        return Response(
            stream_with_context(LLMService.stream_response(prompt)),
            mimetype='text/event-stream'
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat/tools', methods=['POST'])
def chat_tools():
    """
    Chat endpoint that streams responses from the LLM.
    """
    try:
        data = request.json
        prompt = data.get('prompt', '')

        if not prompt:
            return jsonify({"error": "Prompt is required"}), 400

        result = LLMService.get_completion_tools(prompt=prompt, tools=flight.available_tools)
        return result
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=config.PORT, debug=config.DEBUG)




