from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import video, automation_vedai, scribe_vedai

app = FastAPI(title="Scribe Test Generator")

# Add CORS middleware configuration
origins = [
    "http://localhost:3000",  # React frontend
    "http://127.0.0.1:3000",
    # Allow NGROK URLs
    "https://*.ngrok.io",
    "https://*.ngrok-free.app",
    # Wildcard for dynamic NGROK subdomains
    "https://*.ngrok.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.ngrok(-free)?\.app",  # Allow all NGROK subdomains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],  # Expose all headers
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Include routers
app.include_router(video.router)
app.include_router(automation_vedai.router)
app.include_router(scribe_vedai.router)

if __name__ == "__main__":
    import uvicorn
    import socket

    def is_port_in_use(port):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            return s.connect_ex(('localhost', port)) == 0

    if is_port_in_use(8000):
        print("Warning: Port 8000 is already in use!")

    # Add CORS debug logging
    print("Configured CORS origins:", origins)
    print("CORS regex pattern:", r"https://.*\.ngrok(-free)?\.app")

    uvicorn.run(app, host="localhost", port=8000, reload=True) 