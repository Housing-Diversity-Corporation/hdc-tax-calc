import apiClient from './api';

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
  createdAt: string;
}

export type UserRole = 'TEAM' | 'INVESTOR';

class UserService {
  private currentUser: User | null = null;

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get<User>('/account/me');
      this.currentUser = response.data;
      return response.data;
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      return null;
    }
  }

  getUserRole(): UserRole {
    if (!this.currentUser) {
      return 'INVESTOR'; // Default to investor if no user
    }

    // Check if user role indicates team member
    const role = this.currentUser.role?.toUpperCase();
    if (role === 'TEAM' || role === 'ADMIN' || role === 'INTERNAL') {
      return 'TEAM';
    }

    return 'INVESTOR';
  }

  isTeamMember(): boolean {
    return this.getUserRole() === 'TEAM';
  }

  isInvestor(): boolean {
    return this.getUserRole() === 'INVESTOR';
  }

  getCachedUser(): User | null {
    return this.currentUser;
  }
}

export const userService = new UserService();