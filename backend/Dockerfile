# Use the official Python 3.9 image
FROM python:3.9-slim

# Set the working directory to /app
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt /app/requirements.txt

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

# Copy the current directory contents into the container at /app/backend
# This creates a package structure: /app/backend/main.py, etc.
COPY . /app/backend

# Create a non-root user for security (recommended for HF Spaces)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
	PATH=/home/user/.local/bin:$PATH

# Switch to root to fix permissions if needed, but COPY via root owns it by default.
# We need the user to be able to read/write if the app writes. 
# For read-only app code, default is fine, but let's be safe.
USER root
RUN chown -R user:user /app
USER user

# Set PYTHONPATH so python can find the 'backend' package in /app
ENV PYTHONPATH=/app

# Expose port 7860 for Hugging Face Spaces
EXPOSE 7860

# Define environment variable
ENV PORT=7860

# Run app using module syntax to support relative imports
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]
