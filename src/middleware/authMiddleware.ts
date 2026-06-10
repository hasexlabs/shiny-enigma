/**
 * Authentication Middleware for Express Server
 * 
 * This middleware validates Supabase JWT tokens on protected routes.
 * Use it to protect API endpoints that require authentication.
 */

import { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client for server-side validation
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("HASEX_OS [CONFIG ERROR] // Missing Supabase environment variables for server-side auth");
}

const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Middleware to verify Supabase JWT token
 * 
 * Usage:
 * app.get('/api/protected', authenticateToken, (req, res) => {
 *   // req.user contains the decoded token
 *   res.json({ message: 'Protected data', user: req.user });
 * });
 */
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        error: "Unauthorized",
        message: "No token provided" 
      });
    }

    const token = authHeader.split(" ")[1];
    
    if (!supabaseAdmin) {
      return res.status(500).json({ 
        error: "Internal Server Error",
        message: "Supabase admin client not initialized" 
      });
    }

    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (error || !user) {
        console.error("HASEX_OS [AUTH ERROR] // Token verification failed:", error);
        return res.status(403).json({ 
          error: "Forbidden",
          message: "Invalid or expired token" 
        });
      }
      
      // Attach user info to request
      req.user = {
        uid: user.id,
        email: user.email,
        emailVerified: user.email_confirmed_at ? true : false,
        displayName: user.user_metadata?.display_name,
        photoURL: user.user_metadata?.avatar_url,
      };
      
      next();
    } catch (error) {
      console.error("HASEX_OS [AUTH ERROR] // Token verification failed:", error);
      return res.status(403).json({ 
        error: "Forbidden",
        message: "Invalid or expired token" 
      });
    }
  } catch (error) {
    console.error("HASEX_OS [AUTH ERROR] // Authentication middleware error:", error);
    return res.status(500).json({ 
      error: "Internal Server Error",
      message: "Authentication failed" 
    });
  }
}

/**
 * Middleware to check if user has admin role
 * Requires authenticateToken to be used first
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: "Unauthorized",
        message: "Authentication required" 
      });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ 
        error: "Internal Server Error",
        message: "Supabase admin client not initialized" 
      });
    }

    // Check admin role from database
    const { data: userRoles, error } = await supabaseAdmin
      .from('user_roles')
      .select('role_id')
      .eq('user_id', req.user.uid)
      .eq('role_id', (await supabaseAdmin.from('roles').select('id').eq('name', 'admin').single()).data?.id)
      .single();

    if (error || !userRoles) {
      return res.status(403).json({ 
        error: "Forbidden",
        message: "Admin access required" 
      });
    }
    
    next();
  } catch (error) {
    console.error("HASEX_OS [AUTH ERROR] // Admin check failed:", error);
    return res.status(500).json({ 
      error: "Internal Server Error",
      message: "Admin verification failed" 
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user info if token is valid, but doesn't block if not
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith("Bearer ") && supabaseAdmin) {
      const token = authHeader.split(" ")[1];
      
      try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        
        if (!error && user) {
          req.user = {
            uid: user.id,
            email: user.email,
            emailVerified: user.email_confirmed_at ? true : false,
            displayName: user.user_metadata?.display_name,
            photoURL: user.user_metadata?.avatar_url,
          };
        }
      } catch (error) {
        // Token invalid, but we don't block the request
        console.warn("HASEX_OS [AUTH WARN] // Optional auth token invalid:", error);
      }
    }
    
    next();
  } catch (error) {
    // Continue without auth on error
    next();
  }
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        emailVerified?: boolean;
        displayName?: string;
        photoURL?: string;
      };
    }
  }
}
