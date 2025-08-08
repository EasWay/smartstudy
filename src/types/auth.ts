// Authentication related types
export interface User {
    id: string;
    email: string;
    username?: string;
    fullName?: string;
    avatarUrl?: string;
    school?: string;
    gradeLevel?: string;
    subjectsOfInterest?: string[];
    createdAt: string;
    updatedAt: string;
}

export interface AuthState {
    user: User | null;
    loading: boolean;
    error: string | null;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials {
    email: string;
    password: string;
    confirmPassword: string;
    username: string;
    fullName: string;
}