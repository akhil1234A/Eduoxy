import React from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface User {
  _id: string;
  name: string;
  email: string;
  isBlocked: boolean;
  isVerified: boolean;
}

interface UserManagementTableProps {
  users: User[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onBlock: (userId: string) => void;
  onUnblock: (userId: string) => void;
  isLoading: boolean;
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  noResultsMessage: string;
}

const UserManagementTable: React.FC<UserManagementTableProps> = ({
  users,
  searchTerm,
  onSearchChange,
  onBlock,
  onUnblock,
  isLoading,
  title,
  subtitle,
  searchPlaceholder,
  noResultsMessage,
}) => {
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-full"
    >
      <div className="mt-6">
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full p-2 mb-4 border-none bg-customgreys-darkGrey text-white-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-700"
        />
        <div className="overflow-x-auto">
          <table className="min-w-full bg-customgreys-primarybg rounded-lg">
            <thead>
              <tr className="bg-customgreys-darkerGrey text-white-100">
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Verified</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="border-b border-customgreys-darkGrey">
                    <td className="p-3 text-white-100">{user.name}</td>
                    <td className="p-3 text-customgreys-dirtyGrey">{user.email}</td>
                    <td className="p-3 text-customgreys-dirtyGrey">
                      {user.isBlocked ? "Blocked" : "Active"}
                    </td>
                    <td className="p-3 text-customgreys-dirtyGrey">
                      {user.isVerified ? "Yes" : "No"}
                    </td>
                    <td className="p-3">
                      {user.isBlocked ? (
                        <Button
                          onClick={() => onUnblock(user._id)}
                          variant="outline"
                          size="sm"
                          className="bg-customgreys-primarybg text-customgreys-dirtyGrey hover:bg-customgreys-darkerGrey hover:text-white-50"
                        >
                          Unblock
                        </Button>
                      ) : (
                        <Button
                          onClick={() => onBlock(user._id)}
                          variant="outline"
                          size="sm"
                          className="bg-customgreys-primarybg text-customgreys-dirtyGrey hover:bg-customgreys-darkerGrey hover:text-white-50"
                        >
                          Block
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-3 text-center text-customgreys-dirtyGrey">
                    {noResultsMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default UserManagementTable; 