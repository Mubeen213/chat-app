# Create a new Vite project with React TypeScript template
npm create vite@latest frontend -- --template react-ts

# Navigate to project directory
cd frontend

# Install core dependencies
npm install

# Install UI dependencies
npm install tailwindcss postcss autoprefixer
npm install react-markdown classnames uuid date-fns

# Install API dependencies
npm install axios

# Install dev dependencies
npm install -D @types/uuid eslint prettier eslint-plugin-react eslint-plugin-react-hooks

# Set up Tailwind CSS
npx tailwindcss init -p
