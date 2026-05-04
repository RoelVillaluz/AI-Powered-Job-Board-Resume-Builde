from pydantic import BaseModel

class ComputeRequest(BaseModel):
   model_config = {"extra": "allow"}  # accept any JSON fields