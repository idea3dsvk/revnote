import React, { useState } from 'react';
import { User } from '../types';
import authService from '../services/authService';

interface UserPanelProps {
  user: User;
  onLogout: () => void;
  onOpenUserManagement?: () => void;
}

const UserPanel: React.FC<UserPanelProps> = ({ user, onLogout, onOpenUserManagement }) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    if (window.confirm('Naozaj sa chcete odhlásiť?')) {
      authService.logout();
      onLogout();
    }
  };

  const getRoleColor = (role: string) => {
    if (role.includes('Administrátor')) return 'bg-purple-100 text-purple-800';
    if (role.includes('technik')) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-3 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
          {user.fullName.charAt(0).toUpperCase()}
        </div>
        <div className="text-left hidden md:block">
          <div className="text-sm font-semibold text-gray-900">{user.fullName}</div>
          <div className="text-xs text-gray-500">{user.role}</div>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
            <div className="p-4 border-b border-gray-200">
              <div className="font-semibold text-gray-900">{user.fullName}</div>
              <div className="text-sm text-gray-500">{user.username}</div>
              {user.email && <div className="text-sm text-gray-500">{user.email}</div>}
              <span className={`mt-2 inline-block px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                {user.role}
              </span>
            </div>

            <div className="py-2">
              {authService.canManageUsers() && onOpenUserManagement && (
                <button
                  onClick={() => {
                    onOpenUserManagement();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Správa používateľov
                </button>
              )}

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-red-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Odhlásiť sa
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserPanel;
