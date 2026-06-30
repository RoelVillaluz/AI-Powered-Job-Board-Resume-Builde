"""Database configuration and connection management."""

import os
from pathlib import Path
from typing import Optional
from pymongo import MongoClient
from dotenv import load_dotenv

# Load env FIRST, reliably
BASE_DIR = Path(__file__).resolve().parent.parent  # go up from /config to /ai-service
env_path = BASE_DIR / ".env.dev"

if env_path.exists():
    load_dotenv(env_path)


class DatabaseConfig:
    """Handles database connection and configuration."""

    _instance: Optional["DatabaseConfig"] = None
    _client: Optional[MongoClient] = None
    _db = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        mongo_uri = os.getenv("MONGO_URI")

        if not mongo_uri:
            raise ValueError("MONGO_URI environment variable not set")

        self._client = MongoClient(mongo_uri)
        self._db = self._client["database"]

    @property
    def db(self):
        return self._db

    def close(self):
        if self._client:
            self._client.close()
            self._client = None
            self._db = None


db_config = DatabaseConfig()
db = db_config.db
