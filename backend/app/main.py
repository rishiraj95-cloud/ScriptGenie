from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import video

app = FastAPI(title="Scribe Test Generator")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Include routers
app.include_router(video.router)

if __name__ == "__main__":
    import uvicorn
    import socket

    def is_port_in_use(port):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            return s.connect_ex(('localhost', port)) == 0

    if is_port_in_use(8000):
        print("Warning: Port 8000 is already in use!")

    uvicorn.run(app, host="0.0.0.0", port=8000) 