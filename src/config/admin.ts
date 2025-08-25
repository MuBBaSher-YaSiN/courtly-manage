// Admin Configuration
// This file contains hardcoded admin credentials for the Court Management System
// These credentials can be manually edited as needed

export const ADMIN_CONFIG = {
  email: 'admin@court.gov',
  password: 'CourtyAdmin2024!', // Change this password for production
  username: 'admin_court',
  role: 'ADMIN' as const
};

// Helper function to check if user is admin
export const isAdmin = (email: string): boolean => {
  return email === ADMIN_CONFIG.email;
};