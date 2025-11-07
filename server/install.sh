#!/bin/bash

echo "🚀 Installing INSSats Server dependencies..."
echo

cd "$(dirname "$0")"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first."
    exit 1
fi

# Install dependencies
echo "📦 Installing npm packages..."
npm install

echo
echo "✅ Installation complete!"
echo
echo "Next steps:"
echo "  1. Copy .env.example to .env and configure:"
echo "     cp .env.example .env"
echo
echo "  2. Start the development server:"
echo "     npm run dev"
echo
echo "  3. Or build and run production:"
echo "     npm run build"
echo "     npm start"
echo
echo "Server will be available at http://localhost:3001"
