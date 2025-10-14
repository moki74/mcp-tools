const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

console.log(`${colors.bright}${colors.cyan}MySQL MCP Deployment Helper${colors.reset}\n`);

// Check if .env file exists
if (!fs.existsSync(path.join(__dirname, '.env'))) {
  console.log(`${colors.yellow}Warning: No .env file found. Creating from .env.example...${colors.reset}`);
  fs.copyFileSync(
    path.join(__dirname, '.env.example'),
    path.join(__dirname, '.env')
  );
  console.log(`${colors.green}Created .env file. Please update it with your actual configuration.${colors.reset}`);
}

// Build TypeScript files
console.log(`\n${colors.bright}Building TypeScript files...${colors.reset}`);
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log(`${colors.green}Build successful!${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Build failed. Please fix TypeScript errors and try again.${colors.reset}`);
  process.exit(1);
}

// Create a production package.json
console.log(`\n${colors.bright}Creating production package.json...${colors.reset}`);
const packageJson = require('./package.json');
const prodPackage = {
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,
  main: 'dist/index.js',
  scripts: {
    start: 'node dist/server.js'
  },
  dependencies: packageJson.dependencies,
  engines: {
    node: '>=14.0.0'
  }
};

fs.writeFileSync(
  path.join(__dirname, 'dist', 'package.json'),
  JSON.stringify(prodPackage, null, 2)
);
console.log(`${colors.green}Created production package.json${colors.reset}`);

// Copy necessary files
console.log(`\n${colors.bright}Copying necessary files to dist folder...${colors.reset}`);
const filesToCopy = ['.env', '.env.example', 'README.md', 'manifest.json'];
filesToCopy.forEach(file => {
  if (fs.existsSync(path.join(__dirname, file))) {
    fs.copyFileSync(
      path.join(__dirname, file),
      path.join(__dirname, 'dist', file)
    );
    console.log(`${colors.green}Copied ${file}${colors.reset}`);
  }
});

// Create deployment instructions
console.log(`\n${colors.bright}${colors.cyan}Deployment Instructions:${colors.reset}`);
console.log(`
1. Your compiled project is in the ${colors.bright}dist${colors.reset} folder
2. Deploy this folder to your preferred hosting provider
3. Make sure to set up environment variables on your hosting platform
4. For database connectivity, ensure your database is accessible from your hosting environment

${colors.bright}Common Deployment Options:${colors.reset}
- ${colors.bright}Heroku:${colors.reset} Use 'heroku create' and 'git push heroku main'
- ${colors.bright}AWS:${colors.reset} Deploy to Elastic Beanstalk or EC2
- ${colors.bright}Digital Ocean:${colors.reset} Deploy to App Platform or Droplet
- ${colors.bright}Azure:${colors.reset} Deploy to App Service
- ${colors.bright}Google Cloud:${colors.reset} Deploy to App Engine or Cloud Run
- ${colors.bright}Docker:${colors.reset} Build image and deploy to any container service

${colors.bright}${colors.yellow}Important:${colors.reset}
- Ensure your MySQL database is accessible from your hosting environment
- Set all required environment variables on your hosting platform
- Consider using a process manager like PM2 for production deployments
`);

console.log(`${colors.bright}${colors.green}Deployment preparation complete!${colors.reset}`);