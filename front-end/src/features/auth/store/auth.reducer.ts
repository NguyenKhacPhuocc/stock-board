import { type AuthState, type AuthAction, authActionTypes } from './auth.type';

const initialState: AuthState = {
  isLoggedIn: false,
  user: null,
  loading: false,
  error: null,
};

export const authReducer = (
  state: AuthState = initialState,
  action: AuthAction
): AuthState => {
  switch (action.type) {
    case authActionTypes.LOGIN_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case authActionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        isLoggedIn: true,
        user: action.payload,
        loading: false,
        error: null,
      };

    case authActionTypes.LOGIN_FAILURE:
      return {
        ...state,
        isLoggedIn: false,
        user: null,
        loading: false,
        error: action.payload,
      };

    case authActionTypes.LOGOUT:
      return {
        ...state,
        isLoggedIn: false,
        user: null,
        loading: false,
        error: null,
      };

    default:
      return state;
  }
};
