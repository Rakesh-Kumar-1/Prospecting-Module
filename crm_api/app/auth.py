from fastapi import Depends,HTTPException

def verify_token():

    # dummy auth
    return True