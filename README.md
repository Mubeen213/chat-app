# LLM Chat Application

A modern, extensible chat application that works with local Large Language Models (LLMs). This application allows users to interact with local LLMs through a clean, responsive interface.


## ✨ Features

- 💬 Interactive chat interface with streaming responses
- 🔄 Real-time token streaming from LLMs
- 🖼️ Support for image inputs (planned)
- 📄 Document upload and analysis (planned)
- 🔌 Extensible architecture for multiple LLM backends
- 🐳 Dockerized for easy setup and deployment

## 🏗️ Architecture

The application consists of two main components:

- **Frontend**: React with TypeScript, Tailwind CSS
- **Backend**: Python Flask API that communicates with local LLM services

The system is designed to be modular, allowing for easy extension and modification of components.

## 🛠️ Prerequisites

- Node.js (v18+)
- Python (3.9+)
- Docker and Docker Compose (for containerized setup)
- A local LLM service (like llama.cpp, text-generation-webui, or Ollama)

## 🚀 Getting Started

### Local Development Setup

#### Backend Setup

```bash
# Clone the repository
git clone https://github.com/Mubeen213/chat-app.git
cd chat-app

python -m venv venv
source venv/bin/activate

# Install dependencies
cd backend
pip install -r requirements.txt


python app.py
```

#### Frontend setup
```bash
cd frontend

npm install

npm run dev
```

- The frontend will be available at http://localhost:5173 and will connect to the backend at http://localhost:5010.

### Docker setup
```bash

# Make the development script executable
chmod +x dev.sh

# Start the application
./dev.sh start

# View logs
./dev.sh logs

# Stop the application
./dev.sh stop
```

When using Docker, the application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5010

##### Configuration

- Backend: Create a .env file with below content
```bash
LLM_BASE_URL=http://model-runner.docker.internal/engines/llama.cpp/v1
MODEL_NAME=ai/deepseek-r1-distill-llama:8B-Q4_K_M
MAX_TOKENS=1000
TEMPERATURE=0.6
PORT=5010
DEBUG=True
```

- Frontend: Create a .env file with below content
```bash
VITE_API_BASE_URL=http://localhost:5010
```
