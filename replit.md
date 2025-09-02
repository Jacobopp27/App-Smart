# TechTest - Operations Management System

## Overview

TechTest is a full-stack monorepo application for managing financial operations with JWT authentication. It's built as a modern web application with a React frontend, Node.js/Express backend, and PostgreSQL database. The system allows users to create, view, and manage financial operations (BUY/SELL transactions) with different currencies, providing a complete dashboard interface with filtering, pagination, and statistics.

The application follows a clean architecture pattern with separation between frontend and backend concerns, using TypeScript throughout for type safety. It implements secure authentication with JWT tokens, form validation with Zod schemas, and a responsive UI built with shadcn/ui components.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: wouter for client-side routing with protected routes
- **State Management**: React Query (@tanstack/react-query) for server state management and caching
- **Authentication**: Context-based auth system with JWT token storage in localStorage
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Form Handling**: React Hook Form with Zod schema validation

The frontend follows a component-based architecture with clear separation of concerns. Authentication is handled through React Context, providing global user state management. The UI is fully responsive with mobile-first design principles.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **Validation**: Zod schemas for request validation
- **Error Handling**: Centralized error handling middleware
- **Storage Pattern**: Repository pattern with interface abstraction for database operations

The backend implements a layered architecture with routes, middleware, storage interfaces, and proper error handling. It uses modern Node.js patterns with ES modules and async/await throughout.

### Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Management**: Type-safe schema definitions with relations
- **Tables**: 
  - Users table with email/password authentication
  - Operations table for financial transactions
  - Proper foreign key relationships between tables
- **Migrations**: Drizzle Kit for database migrations

### Security Implementation
- **Authentication**: JWT tokens with configurable expiration
- **Password Security**: bcrypt hashing with salt rounds
- **Authorization**: Route-level protection with middleware
- **CORS**: Configured for cross-origin requests
- **Input Validation**: Server-side validation with Zod schemas

### Development Workflow
- **Monorepo Structure**: Single repository containing both client and server
- **Hot Reloading**: Vite dev server with HMR for frontend development
- **Type Safety**: Full TypeScript implementation across frontend and backend
- **Code Quality**: Consistent code formatting and error handling patterns

## External Dependencies

### Database
- **PostgreSQL**: Primary database using Neon serverless PostgreSQL
- **Drizzle ORM**: Type-safe ORM for database operations
- **Connection Pooling**: Neon serverless connection pooling

### Authentication & Security
- **bcryptjs**: Password hashing and verification
- **jsonwebtoken**: JWT token generation and validation
- **Zod**: Schema validation for API requests and forms

### Frontend Libraries
- **React Query**: Server state management and caching
- **wouter**: Lightweight client-side routing
- **shadcn/ui**: Pre-built UI component library
- **Radix UI**: Headless UI primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

### Backend Libraries
- **Express.js**: Web framework for Node.js
- **cors**: Cross-origin resource sharing middleware
- **helmet**: Security middleware for Express

### Development Tools
- **Vite**: Frontend build tool and dev server
- **TypeScript**: Type safety across the application
- **ESLint**: Code linting and formatting
- **PostCSS**: CSS processing for Tailwind