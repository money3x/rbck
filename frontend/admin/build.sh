#!/bin/bash

# RBCK CMS Admin Build Script
# Builds the optimized admin frontend

echo "🏗️  Building RBCK CMS Admin Frontend..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Development build
if [ "$1" = "dev" ]; then
    echo "🔧 Building development version..."
    npm run build:dev
    echo "✅ Development build complete! Files in ./dist/"
    
# Production build  
elif [ "$1" = "prod" ]; then
    echo "🚀 Building production version..."
    npm run build
    echo "✅ Production build complete! Files in ./dist/"
    
# Development server
elif [ "$1" = "serve" ]; then
    echo "🌐 Starting development server..."
    npm run dev
    
# Clean build directory
elif [ "$1" = "clean" ]; then
    echo "🧹 Cleaning build directory..."
    npm run clean
    echo "✅ Build directory cleaned!"
    
else
    echo "Usage: ./build.sh [dev|prod|serve|clean]"
    echo ""
    echo "Commands:"
    echo "  dev    - Build development version"
    echo "  prod   - Build production version (optimized)"
    echo "  serve  - Start development server with hot reload"
    echo "  clean  - Clean build directory"
fi