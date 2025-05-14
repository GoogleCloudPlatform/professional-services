FROM python:3.12-slim

EXPOSE 8080
WORKDIR /app

# First, copy only the requirements file and install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Then, copy the rest of the application code
COPY . .

ENTRYPOINT ["streamlit", "run", "Overview.py", "--server.port=8080", "--server.address=0.0.0.0"]