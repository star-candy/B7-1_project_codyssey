import time
import os
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core import models, schemas
from core.database import get_db
from auth.security import get_current_user
from ai_chat import service
