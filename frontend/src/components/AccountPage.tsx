import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { User } from '../services/api';

const AccountPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('Please sign in to view account information.');
          setLoading(false);
          return;
        }

        const response = await api.get<User>('/account/me');
        setUser(response.data);
      } catch (err) {
        console.error('Error fetching user info:', err);
        setError('Failed to fetch user information.');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!user) {
    return <div>No user information found.</div>;
  }

  return (
    <div>
      <h1>Account Information</h1>
      <p><strong>Username:</strong> {user.username}</p>
      <p><strong>Full Name:</strong> {user.fullName}</p>
    </div>
  );
};

export default AccountPage;