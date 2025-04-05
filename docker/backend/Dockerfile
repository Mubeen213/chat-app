FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# For local development, we'll mount the backend directory as a volume
# So we only copy the files for the initial build
COPY backend/ .

EXPOSE 5010

CMD ["python", "app.py"]
