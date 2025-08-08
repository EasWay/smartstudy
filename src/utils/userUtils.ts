import { User } from '../types/auth';
import { UserProfile } from '../types/profile';

/**
 * Get the display name for a user, prioritizing username over other options
 * Never shows email address for privacy
 */
export function getUserDisplayName(user: User | null): string {
    if (!user) return 'Guest';

    // Priority order: username > fullName > fallback
    if (user.username && typeof user.username === 'string' && user.username.trim()) {
        return user.username.trim();
    }

    if (user.fullName && typeof user.fullName === 'string' && user.fullName.trim()) {
        return user.fullName.trim();
    }

    // Fallback - never show email
    return 'User';
}

/**
 * Get a personalized greeting for the user
 */
export function getUserGreeting(user: User | null): string {
    const displayName = getUserDisplayName(user);
    return `Welcome, ${displayName}!`;
}

/**
 * Get user initials for avatar display
 */
export function getUserInitials(user: User | null): string {
    if (!user) return 'G';

    // Try to get initials from full name first
    if (user.fullName && typeof user.fullName === 'string' && user.fullName.trim()) {
        const names = user.fullName.trim().split(' ').filter(name => name.length > 0);
        if (names.length >= 2) {
            const firstInitial = names[0][0] || '';
            const lastInitial = names[names.length - 1][0] || '';
            return `${firstInitial}${lastInitial}`.toUpperCase();
        }
        if (names.length === 1 && names[0][0]) {
            return names[0][0].toUpperCase();
        }
    }

    // Fall back to username
    if (user.username && typeof user.username === 'string' && user.username.trim() && user.username[0]) {
        return user.username[0].toUpperCase();
    }

    // Last resort - never use email
    return 'U';
}
/**
 *
 Convert User type (camelCase) to UserProfile type (snake_case)
 * This is needed when components expect UserProfile format but we have User from auth context
 */
export function userToUserProfile(user: User): UserProfile {
    return {
        id: user.id,
        username: user.username || null,
        full_name: user.fullName || null,
        avatar_url: user.avatarUrl || null,
        school: user.school || null,
        grade_level: user.gradeLevel || null,
        subjects_of_interest: user.subjectsOfInterest || null,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
    };
}