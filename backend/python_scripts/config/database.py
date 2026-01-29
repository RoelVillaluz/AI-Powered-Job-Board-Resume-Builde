"""Database configuration and connection management."""
import os
from typing import Optional
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

class DatabaseConfig:
    """ Handles database connection and configuration. """
    _instance: Optional['DatabaseConfig'] = None
    _client: Optional[MongoClient] = None
    _db = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._client is None:
            mongo_uri = os.getenv('MONGO_URI')
            if not mongo_uri:
                raise ValueError('MONGO_URI environment variable not set')
            self._client = MongoClient(mongo_uri)
            self._db = self._client['database']

    @property
    def db(self):
        """ Get database instance """
        return self._db
    
    def close(self):
        """ Close database connection """
        if self._client:
            self._client.close()
            self._client = None
            self._db = None

# Singleton instance
db_config = DatabaseConfig()
db = db_config.db