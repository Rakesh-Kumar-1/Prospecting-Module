from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker,declarative_base
import os

DATABASE_URL="mysql+pymysql://root:root@localhost/crm"

engine=create_engine(DATABASE_URL)

SessionLocal=sessionmaker(
autocommit=False,
autoflush=False,
bind=engine
)

Base=declarative_base()