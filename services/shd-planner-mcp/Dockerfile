FROM python:3.12-slim

WORKDIR /app

# Install uv for dependency management
RUN pip install --no-cache-dir uv

# Copy the app first so all referenced files exist
COPY . /app

# Install dependencies (includes project)
RUN uv sync --frozen

ENV PYTHONUNBUFFERED=1

CMD ["uv", "run", "python", "server.py"]
