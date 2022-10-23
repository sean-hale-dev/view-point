type errorType = 'user' | 'server' | 'auth';

class APIServiceError {
  message: string;

  constructor(message: string) {
    this.message = message;
  }
}

class UserError extends APIServiceError {};
class ServerError extends APIServiceError {};
class AuthError extends APIServiceError {};

const makeError = (code: errorType, message: string = "Something went wrong") => {
  switch (code) {
    case 'user':
      return new UserError(message);
    case 'server':
      return new ServerError(message);
    case 'auth':
      return new AuthError(message);
  }
}

export {
  APIServiceError,
  UserError,
  ServerError,
  AuthError,
  makeError
}
