/**
 * User Model
 * Handles user data operations with proper validation and error handling
 */

const { z } = require('zod');

// User validation schema
const UserSchema = z.object({
  id: z.string().uuid().optional(),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email().max(255),
  password_hash: z.string().optional(),
  is_admin: z.boolean().default(false),
  full_name: z.string().max(100).optional(),
  avatar_url: z.string().url().optional(),
  last_login: z.date().optional(),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date()),
  is_active: z.boolean().default(true)
});

const CreateUserSchema = UserSchema.omit({ id: true, created_at: true, updated_at: true });
const UpdateUserSchema = UserSchema.partial().omit({ id: true, created_at: true });

class User {
  static tableName = 'users';
  
  static fields = [
    'id', 'username', 'email', 'is_admin', 'full_name', 
    'avatar_url', 'last_login', 'created_at', 'updated_at', 'is_active'
  ];

  constructor(data) {
    this.data = UserSchema.parse(data);
  }

  /**
   * Validate user data for creation
   * @param {Object} userData - User data to validate
   * @returns {Object} - Validation result
   */
  static validateForCreate(userData) {
    try {
      const validated = CreateUserSchema.parse(userData);
      return { success: true, data: validated };
    } catch (error) {
      return { 
        success: false, 
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      };
    }
  }

  /**
   * Validate user data for update
   * @param {Object} userData - User data to validate
   * @returns {Object} - Validation result
   */
  static validateForUpdate(userData) {
    try {
      const validated = UpdateUserSchema.parse(userData);
      return { success: true, data: validated };
    } catch (error) {
      return { 
        success: false, 
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      };
    }
  }

  /**
   * Safe field selection for public responses
   * @param {Object} user - User object
   * @returns {Object} - Public user data
   */
  static toPublic(user) {
    if (!user) return null;
    
    const { password_hash, ...publicData } = user;
    return publicData;
  }

  /**
   * Check if user is admin
   * @param {Object} user - User object
   * @returns {boolean} - Is admin
   */
  static isAdmin(user) {
    return Boolean(user?.is_admin);
  }

  /**
   * Check if user is active
   * @param {Object} user - User object
   * @returns {boolean} - Is active
   */
  static isActive(user) {
    return Boolean(user?.is_active);
  }
}

module.exports = {
  User,
  UserSchema,
  CreateUserSchema,
  UpdateUserSchema
};