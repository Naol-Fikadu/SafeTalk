'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ProfileContextType {
  user: any;
  updateUser: (newData: any) => void;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children, initialUser }: { children: ReactNode; initialUser: any }) {
  const [user, setUser] = useState(initialUser);
  const [isEditing, setIsEditing] = useState(false);

  const updateUser = (newData: any) => {
    setUser((prev: any) => ({ ...prev, ...newData }));
  };

  return (
    <ProfileContext.Provider value={{ user, updateUser, isEditing, setIsEditing }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
