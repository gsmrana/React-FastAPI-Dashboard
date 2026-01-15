# Use a python image with uv pre-installed
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

# Set working directory
WORKDIR /src

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1

# Copy dependency files first
COPY pyproject.toml uv.lock ./

# Install dependencies
# --frozen: strictly use lockfile (fails if lockfile is out of sync)
# --no-dev: exclude dev dependencies
# --no-install-project: only install dependencies (caches this layer)
RUN uv sync --frozen --no-dev --no-install-project

# Copy the rest of the application
COPY . .

# Install the project itself
RUN uv sync --frozen --no-dev

# Place executables in the environment at the front of the path
ENV PATH="/src/.venv/bin:$PATH"

# Expose the port
EXPOSE 8000

# Run the app
CMD ["uvicorn", "app.app:app", "--host", "0.0.0.0", "--port", "8000"]
