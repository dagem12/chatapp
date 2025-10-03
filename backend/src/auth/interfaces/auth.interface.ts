/**
 * Interface for authentication response
 * This defines the structure of data returned after successful login/register
 */
export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      username: string;
      avatar: string | null;
      isOnline: boolean;
      lastSeen: Date;
      createdAt: Date;
      updatedAt: Date;
    };
    token: string;
  };
}

/**
 * Interface for user payload in JWT token
 * This is what gets encoded in the JWT token
 */
export interface JwtPayload {
  sub: string; // User ID (subject)
  email: string;
  username: string;
  iat?: number; // Issued at
  exp?: number; // Expires at
}

/**
 * Interface for authenticated user (extends JWT payload)
 * This is what gets attached to the request object after JWT validation
 */
export interface AuthenticatedUser extends JwtPayload {
  id: string; // Same as sub, but more explicit
}

/**
 * Interface for user profile response
 */
export interface UserProfileResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    email: string;
    username: string;
    avatar: string | null;
    isOnline: boolean;
    lastSeen: Date;
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * Interface for error response
 */
export interface AuthErrorResponse {
  success: false;
  message: string;
  error?: string;
  statusCode?: number;
}
