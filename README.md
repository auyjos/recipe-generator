# RecipeCraft

RecipeCraft is a modern web application that allows users to generate, customize, and save recipes based on their dietary preferences, available ingredients, and calorie goals. Whether you're looking for quick meal ideas or building a personal cookbook, RecipeCraft has you covered.

---

## Motivation

The idea behind RecipeCraft is to simplify meal planning and recipe discovery. By leveraging AI, RecipeCraft generates personalized recipes tailored to your needs. The app also provides nutritional insights, making it easier to maintain a healthy lifestyle. Whether you're a busy professional, a home cook, or someone with specific dietary restrictions, RecipeCraft is designed to make cooking enjoyable and stress-free.

---

## Quick Start

Follow these steps to get started with RecipeCraft:

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [pnpm](https://pnpm.io/) (preferred package manager)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/auyjos/recipe-generator.git
   cd recipe-generator
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   - Create a `.env.local` file in the root directory.
   - Add the required environment variables (e.g., API keys for Anthropic, Supabase credentials).

4. Run the development server:
   ```bash
   pnpm dev
   ```

5. Open the app in your browser:
   ```
   http://localhost:3000
   ```

---

## Usage

### Features
1. **Generate Recipes**:
   - Enter ingredients, dietary preferences, and calorie goals.
   - AI generates a recipe with detailed instructions and nutritional information.

2. **Save Recipes**:
   - Create an account to save your favorite recipes for future reference.

3. **Nutritional Insights**:
   - View macronutrient and micronutrient breakdowns for each recipe.

4. **Customizable Meal Types**:
   - Choose from meal types like breakfast, lunch, dinner, or snacks.

5. **Dietary Exclusions**:
   - Exclude specific ingredients (e.g., nuts, dairy) from recipes.

### Navigation
- **Home**: Overview of the app and its features.
- **Generate Recipe**: Create a new recipe based on your preferences.
- **My Recipes**: View and manage your saved recipes.
- **Authentication**: Sign in or register to save recipes.

---

## Contributing

We welcome contributions to RecipeCraft! Here's how you can help:

1. **Fork the Repository**:
   - Click the "Fork" button on GitHub.

2. **Clone Your Fork**:
   ```bash
   git clone https://github.com/auyjos/recipe-generator.git
   cd recipe-generator
   ```

3. **Create a Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make Changes**:
   - Add your feature or fix a bug.
   - Ensure your code follows the project's coding standards.

5. **Run Tests**:
   - Use the following command to run tests:
     ```bash
     pnpm test
     ```

6. **Commit and Push**:
   ```bash
   git add .
   git commit -m "Add your commit message"
   git push origin feature/your-feature-name
   ```

7. **Submit a Pull Request**:
   - Open a pull request on the main repository.

---

## Acknowledgments

- [Anthropic](https://www.anthropic.com/) for AI recipe generation.
- [Supabase](https://supabase.com/) for authentication and database services.
- [Next.js](https://nextjs.org/) for the framework powering this app.