import { type LoginRequestAction, type LoginSuccessAction, type LoginFailureAction, type LogoutAction, type User, authActionTypes } from './auth.type';

export const loginRequest = (username: string, password: string): LoginRequestAction => ({
  type: authActionTypes.LOGIN_REQUEST,
  payload: {
    username,
    password,
  },
});

export const loginSuccess = (user: User): LoginSuccessAction => ({
  type: authActionTypes.LOGIN_SUCCESS,
  payload: user,
});

export const loginFailure = (error: string): LoginFailureAction => ({
  type: authActionTypes.LOGIN_FAILURE,
  payload: error,
});

export const logout = (): LogoutAction => ({
  type: authActionTypes.LOGOUT,
});

