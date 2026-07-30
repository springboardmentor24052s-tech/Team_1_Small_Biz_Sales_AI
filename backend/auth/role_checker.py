from fastapi import Depends, HTTPException

from backend.auth.dependencies import get_current_user


def require_roles(*allowed_roles):

    def role_checker(current_user=Depends(get_current_user)):

        if current_user["role_id"] not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="Permission Denied"
            )

        return current_user

    return role_checker