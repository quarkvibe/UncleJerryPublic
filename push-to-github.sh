#!/bin/bash
# Script to push Uncle Jerry Blueprint Analyzer to a GitHub repository

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="" # Will be set by user input

echo -e "${YELLOW}Uncle Jerry Blueprint Analyzer - GitHub Push Script${NC}"
echo

# Check if git is installed
if ! command -v git &> /dev/null; then
  echo -e "${RED}Git is not installed. Please install git first.${NC}"
  exit 1
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
  echo -e "${RED}Not a git repository. Please run this script from the root of the project.${NC}"
  exit 1
fi

# Prompt for GitHub repository URL
read -p "Enter your GitHub repository URL (e.g., https://github.com/username/repo.git): " REPO_URL

if [ -z "$REPO_URL" ]; then
  echo -e "${RED}Repository URL cannot be empty. Exiting.${NC}"
  exit 1
fi

# Check if remote origin exists
if git remote | grep -q "^origin$"; then
  echo "Remote 'origin' already exists."
  read -p "Do you want to update it to $REPO_URL? (y/n): " UPDATE_REMOTE
  if [ "$UPDATE_REMOTE" == "y" ] || [ "$UPDATE_REMOTE" == "Y" ]; then
    git remote set-url origin "$REPO_URL"
    echo -e "${GREEN}Remote 'origin' updated to $REPO_URL${NC}"
  fi
else
  # Add remote
  git remote add origin "$REPO_URL"
  echo -e "${GREEN}Added remote 'origin' as $REPO_URL${NC}"
fi

# Make sure we're in the correct branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "master" ] && [ "$CURRENT_BRANCH" != "main" ]; then
  echo -e "${YELLOW}You are currently on branch '$CURRENT_BRANCH', not 'master' or 'main'.${NC}"
  read -p "Do you want to continue pushing from this branch? (y/n): " CONTINUE_BRANCH
  if [ "$CONTINUE_BRANCH" != "y" ] && [ "$CONTINUE_BRANCH" != "Y" ]; then
    echo -e "${YELLOW}Switching to master branch...${NC}"
    git checkout master 2>/dev/null || git checkout -b master
  fi
fi

# Push to GitHub
echo -e "${YELLOW}Pushing to GitHub repository...${NC}"
git push -u origin $(git rev-parse --abbrev-ref HEAD)

# Check if push was successful
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Successfully pushed to GitHub!${NC}"
  echo -e "Your code is now available at: $REPO_URL"
else
  echo -e "${RED}Failed to push to GitHub.${NC}"
  echo "Please check your repository URL and make sure you have the correct permissions."
  echo "You might need to authenticate with GitHub first."
  
  # Suggest setting up SSH key
  echo -e "\n${YELLOW}If you're using SSH for GitHub, make sure you have set up your SSH key:${NC}"
  echo "1. Generate an SSH key if you don't have one:"
  echo "   ssh-keygen -t ed25519 -C \"your_email@example.com\""
  echo "2. Add your SSH key to the ssh-agent:"
  echo "   eval \"\$(ssh-agent -s)\""
  echo "   ssh-add ~/.ssh/id_ed25519"
  echo "3. Add your SSH key to your GitHub account"
  echo "   (copy the content of ~/.ssh/id_ed25519.pub to GitHub)"
  
  # Suggest using HTTPS with credential caching
  echo -e "\n${YELLOW}If you're using HTTPS for GitHub:${NC}"
  echo "1. Configure git to cache your credentials:"
  echo "   git config --global credential.helper cache"
  echo "2. You might be prompted for your GitHub username and password/token"
  echo "   (GitHub no longer accepts passwords, use a personal access token instead)"
fi

exit 0