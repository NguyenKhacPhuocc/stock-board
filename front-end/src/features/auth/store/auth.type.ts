
export const authActionTypes = Object.freeze({
    LOGIN_REQUEST : 'LOGIN_REQUEST',
    LOGIN_SUCCESS : 'LOGIN_SUCCESS',
    LOGIN_FAILURE : 'LOGIN_FAILURE',
    LOGOUT : 'LOGOUT',
});

export interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface User {
  id: string;
  username: string;
  email: string;
  token: string;
}

export interface LoginRequestAction {
  type: typeof authActionTypes.LOGIN_REQUEST;
  payload: {
    username: string;
    password: string;
  };
}

export interface LoginSuccessAction {
  type: typeof authActionTypes.LOGIN_SUCCESS;
  payload: User;
}

export interface LoginFailureAction {
  type: typeof authActionTypes.LOGIN_FAILURE;
  payload: string;
}

export interface LogoutAction {
  type: typeof authActionTypes.LOGOUT;
}

export type AuthAction =
  | LoginRequestAction
  | LoginSuccessAction
  | LoginFailureAction
  | LogoutAction;

