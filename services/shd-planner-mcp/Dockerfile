FROM python:3.12-slim

WORKDIR /app

# Install uv for dependency management
RUN pip install --no-cache-dir uv

# Ensure expected package paths exist
RUN mkdir -p /app/data

# Install dependencies first (cache layer)
COPY pyproject.toml uv.lock README.md /app/
RUN uv sync --frozen

# Copy the rest of the app
COPY . /app

ENV PYTHONUNBUFFERED=1

CMD ["uv", "run", "python", "server.py"]
