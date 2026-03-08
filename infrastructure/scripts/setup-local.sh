#!/bin/bash
# Local development setup script for AI Squad Command Center

set -e

echo "🚀 Setting up AI Squad Command Center..."

# Check prerequisites
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm is required. Install with: npm install -g pnpm"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required."; exit 1; }

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Check .env.local
if [ ! -f .env.local ]; then
  echo "⚠️  .env.local not found. Copying from .env.example..."
  cp .env.example .env.local
  echo "📝 Please edit .env.local with your actual values before running the app."
  echo "   You need: Supabase URL + keys, Anthropic API key"
  exit 1
fi

echo "✅ Setup complete! Run 'pnpm dev' to start the development server."
