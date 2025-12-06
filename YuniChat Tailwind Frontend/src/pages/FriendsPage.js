import React from 'react';
import FriendList from '../components/FriendList';

const FriendsPage = () => {
  return (
    <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-2xl h-full md:h-[600px] md:rounded-xl md:shadow-xl overflow-hidden">
        <FriendList />
      </div>
    </div>
  );
};

export default FriendsPage;
