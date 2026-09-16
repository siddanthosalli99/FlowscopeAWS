FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY flowscope_api.py .

EXPOSE 8002

CMD ["uvicorn", "flowscope_api:app", "--host", "0.0.0.0", "--port", "8002"]
