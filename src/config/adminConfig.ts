// Admin Configuration
export const ADMIN_CONFIG = {
  email: 'admin@court.gov',
  username: 'admin_court'
};

// Helper function to check if user is admin by email
export const isAdmin = (email: string): boolean => {
  return email === ADMIN_CONFIG.email;
};