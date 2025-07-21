import { NextResponse } from "next/server"
import logger from "@/utils/logger"

// System prompt specifically for macro-based recipe generation
const MACRO_SYSTEM_PROMPT = `
You are a professional chef assistant with access to comprehensive nutritional databases (USDA, FoodData Central, etc.).
You create recipes based on specific macro targets with scientifically accurate nutritional information.

Please generate a **single-serving** recipe that meets exact macro targets.

CRITICAL MACRO MATCHING REQUIREMENTS:
- Use your knowledge of USDA FoodData Central to select ingredients that precisely meet the macro targets
- Calculate nutrition by: (ingredient_quantity_in_grams / 100) x nutrition_per_100g_from_database
- The recipe MUST hit the **exact** macro targets:
   - Protein within +/-2g
   - Carbs within +/-3g
   - Fat within +/-2g
- After you build your ingredient table, **automatically verify**:
   \`\`\`
   total_protein * 4 + total_carbs * 4 + total_fat * 9 == total_calories +/-2
   \`\`\`
   **If it fails, do not output a recipe**—instead revise quantities until it passes.
- Total calories MUST equal (protein x 4 + carbs x 4 + fat x 9) within 1-2 calories
- Prioritize whole, unprocessed foods when possible
- Ensure the recipe is practical, delicious, and achievable

Always format your response in markdown with the following structure:
# [Recipe Title]

## Ingredients
- [Ingredient 1 with EXACT quantity in grams] (e.g., 120g chicken breast)
- [Ingredient 2 with EXACT quantity in grams]
...

## Instructions
1. [Step 1]
2. [Step 2]
...

## Nutrition (Validated from USDA/FoodData Central)
- Calories: [calories] kcal
- Protein: [protein]g
- Carbs: [carbs]g
- Fat: [fat]g

## Cooking Time
[cooking time] minutes

## Ingredient Macro Table
| Ingredient               | Qty (g/ml) | Protein (g) | Carbs (g) | Fat (g) | Calories |
|--------------------------|:----------:|:-----------:|:---------:|:-------:|:--------:|
| Chicken breast           |    150     |     46.5    |     0     |   5.4   |   247.5  |
| …                        |            |             |           |         |          |
| **Totals**               |            | **[P]**     | **[C]**   | **[F]** | **[K]**  |

## Macro Verification
- Protein × 4 = [P×4] kcal  
- Carbs × 4   = [C×4] kcal  
- Fat × 9     = [F×9] kcal  
- **Sum = [K] kcal**  (must match Calories above within ±2 kcal)

IMPORTANT GUIDELINES:
1. ALWAYS specify ingredient quantities in grams for ALL ingredients when possible
2. Use your knowledge of USDA FoodData Central to get accurate macro values per 100g
3. Select ingredients strategically to hit exact macro targets
4. Verify that (protein×4 + carbs×4 + fat×9) equals the stated calories within 2 kcal tolerance
5. Be creative but practical, focusing on recipes that are delicious and achievable
6. For liquids, use milliliters (ml) instead of grams when appropriate
7. Respect any stated preferences or dietary restrictions
8. When in doubt about nutritional values, state your source (e.g., "USDA FDC ID: 123456") in the response
`

export async function POST(request: Request) {
    try {
        // Parse the request body
        const body = await request.json()
        const { protein, carbs, fat, preferences, mealType } = body

        // Calculate target calories
        const targetCalories = protein * 4 + carbs * 4 + fat * 9

        // Enhanced debug logging
        logger.api.start("GENERATE MACRO-BASED RECIPE", {
            protein,
            carbs,
            fat,
            targetCalories,
            preferences,
            mealType
        })

        if (!protein || !carbs || !fat) {
            return NextResponse.json({ success: false, error: "Protein, carbs, and fat targets are required" }, { status: 400 })
        }

        if (protein < 5 || carbs < 5 || fat < 5) {
            return NextResponse.json({ success: false, error: "Minimum 5g required for each macro" }, { status: 400 })
        }

        if (targetCalories < 100 || targetCalories > 2000) {
            return NextResponse.json({ success: false, error: "Total calories must be between 100-2000" }, { status: 400 })
        }

        // Create a user message for macro-based generation
        const userMessage = `
    I need a ${mealType} recipe that hits these EXACT macro targets:
    - Protein: ${protein}g
    - Carbs: ${carbs}g  
    - Fat: ${fat}g
    - Total Calories: ${targetCalories} kcal
    
    Additional preferences: ${preferences || "None"}
    
    CRITICAL: Please use your knowledge of USDA FoodData Central to select ingredients that will precisely meet these macro targets. The recipe must hit these macros exactly (±2g for protein/fat, ±3g for carbs).
    
    Create a practical, delicious recipe that meets these exact nutritional requirements.
    `

        try {
            // Make a fetch request to Anthropic API
            const response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": process.env.ANTHROPIC_API_KEY || "",
                    "anthropic-version": "2023-06-01",
                },
                body: JSON.stringify({
                    model: "claude-sonnet-4-20250514",
                    max_tokens: 1024,
                    system: MACRO_SYSTEM_PROMPT,
                    messages: [{ role: "user", content: userMessage }],
                }),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: response.statusText }))
                logger.error("❌ Anthropic API Error Response:", {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData
                })
                throw new Error(`Anthropic API error: ${errorData.error || response.statusText}`)
            }

            const data = await response.json()
            logger.api.success("Anthropic API Success Response:", {
                status: response.status,
                contentLength: data.content?.[0]?.text?.length || 0,
                contentPreview: data.content?.[0]?.text?.substring(0, 200) + "..."
            })
            const markdownResponse = data.content[0].text

            if (logger.isDev()) {
                logger.log("📄 Full Markdown Response:")
                logger.log("=".repeat(50))
                logger.log(markdownResponse)
                logger.log("=".repeat(50))
            }

            // Parse the markdown to extract structured data
            const recipe = parseRecipeMarkdown(markdownResponse)

            logger.recipe.generation("Parsed Recipe Data:", recipe)

            // Validate the macros match the targets
            const { protein: actualProtein = 0, carbs: actualCarbs = 0, fat: actualFat = 0 } = recipe

            const proteinDiff = Math.abs(actualProtein - protein)
            const carbsDiff = Math.abs(actualCarbs - carbs)
            const fatDiff = Math.abs(actualFat - fat)

            if (proteinDiff > 2 || carbsDiff > 3 || fatDiff > 2) {
                logger.warn(`⚠️ Macro mismatch: P:${actualProtein}g(±${proteinDiff}), C:${actualCarbs}g(±${carbsDiff}), F:${actualFat}g(±${fatDiff})`)

                // Build a correction message for macro accuracy
                const correctionMessage = `
        The recipe you provided has these macros:
        - Protein: ${actualProtein}g (target: ${protein}g, difference: ${proteinDiff > 0 ? '+' : ''}${(actualProtein - protein).toFixed(1)}g)
        - Carbs: ${actualCarbs}g (target: ${carbs}g, difference: ${carbsDiff > 0 ? '+' : ''}${(actualCarbs - carbs).toFixed(1)}g)
        - Fat: ${actualFat}g (target: ${fat}g, difference: ${fatDiff > 0 ? '+' : ''}${(actualFat - fat).toFixed(1)}g)
        
        Please adjust ingredient quantities to hit the EXACT targets: ${protein}g protein, ${carbs}g carbs, ${fat}g fat.
        The tolerance is ±2g for protein/fat and ±3g for carbs.
        Keep the same markdown structure and only send me the corrected recipe.
        `

                try {
                    // Re-call Claude with correction request
                    const correctionResp = await fetch("https://api.anthropic.com/v1/messages", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-api-key": process.env.ANTHROPIC_API_KEY || "",
                            "anthropic-version": "2023-06-01",
                        },
                        body: JSON.stringify({
                            model: "claude-sonnet-4-20250514",
                            max_tokens: 1024,
                            system: MACRO_SYSTEM_PROMPT,
                            messages: [
                                { role: "user", content: userMessage },
                                { role: "assistant", content: markdownResponse },
                                { role: "user", content: correctionMessage },
                            ],
                        }),
                    })

                    if (correctionResp.ok) {
                        const correctionData = await correctionResp.json()
                        const correctedMarkdown = correctionData.content[0].text
                        const correctedRecipe = parseRecipeMarkdown(correctedMarkdown)

                        logger.recipe.generation("Corrected Macro Recipe:", {
                            ...correctedRecipe,
                            targetMacros: { protein, carbs, fat },
                            actualMacros: {
                                protein: correctedRecipe.protein || 0,
                                carbs: correctedRecipe.carbs || 0,
                                fat: correctedRecipe.fat || 0
                            }
                        })

                        const finalRecipe = {
                            ...correctedRecipe,
                            markdown: correctedMarkdown,
                        }

                        logger.recipe.generation("Final Corrected Macro Recipe Response:", finalRecipe)
                        logger.api.end("GENERATE MACRO-BASED RECIPE")

                        return NextResponse.json({
                            success: true,
                            recipe: finalRecipe,
                            corrected: true,
                            targetMacros: { protein, carbs, fat },
                            actualMacros: {
                                protein: correctedRecipe.protein || 0,
                                carbs: correctedRecipe.carbs || 0,
                                fat: correctedRecipe.fat || 0
                            }
                        })
                    } else {
                        logger.warn("Macro correction request failed, using original recipe")
                    }
                } catch (correctionError) {
                    logger.error("Error during macro recipe correction:", correctionError)
                    // Fall through to use original recipe
                }
            }

            // If macros were in tolerance or correction failed, return original
            const finalRecipe = {
                ...recipe,
                markdown: markdownResponse,
            }

            logger.recipe.generation("Final Macro Recipe Response:", finalRecipe)
            logger.api.end("GENERATE MACRO-BASED RECIPE")

            return NextResponse.json({
                success: true,
                recipe: finalRecipe,
                targetMacros: { protein, carbs, fat },
                actualMacros: {
                    protein: actualProtein,
                    carbs: actualCarbs,
                    fat: actualFat
                }
            })
        } catch (apiError: any) {
            logger.error("Anthropic API error:", apiError)

            return NextResponse.json({
                success: false,
                error: "Failed to generate macro-based recipe",
                apiError: apiError.message,
            }, { status: 500 })
        }
    } catch (error: any) {
        logger.error("Error in generate-recipe-macros route:", error)

        return NextResponse.json(
            {
                success: false,
                error: error.message || "Failed to generate macro-based recipe",
                details: error.toString(),
            },
            { status: 500 },
        )
    }
}

// Helper function to parse the markdown response into structured data
function parseRecipeMarkdown(markdown: string) {
    let title = "Generated Recipe"
    let ingredients: string[] = []
    let instructions: string[] = []
    let calories: number | undefined
    let protein: number | undefined
    let carbs: number | undefined
    let fat: number | undefined
    let cooking_time: string | undefined

    try {
        // Extract title
        const titleMatch = /# (.+)/.exec(markdown)
        if (titleMatch?.[1]) {
            title = titleMatch[1].trim()
        }

        // Extract ingredients
        const ingredientsSection = /## Ingredients\s+([\s\S]*?)(?=##|$)/.exec(markdown)
        if (ingredientsSection?.[1]) {
            ingredients = ingredientsSection[1]
                .split("\n")
                .filter((line) => line.trim().startsWith("-"))
                .map((line) => line.replace("-", "").trim())
        }

        // Extract instructions
        const instructionsSection = /## Instructions\s+([\s\S]*?)(?=##|$)/.exec(markdown)
        if (instructionsSection?.[1]) {
            instructions = instructionsSection[1]
                .split("\n")
                .filter((line) => /^\d+\./.test(line.trim()))
                .map((line) => line.replace(/^\d+\.\s*/, "").trim())
        }

        // Extract nutrition values
        const caloriesMatch = /Calories:\s*(\d+)\s*kcal/.exec(markdown)
        if (caloriesMatch?.[1]) {
            calories = Number.parseInt(caloriesMatch[1], 10)
        }

        const proteinMatch = /Protein:\s*(\d+(?:\.\d+)?)\s*g/.exec(markdown)
        if (proteinMatch?.[1]) {
            protein = Number.parseFloat(proteinMatch[1])
        }

        const carbsMatch = /Carbs:\s*(\d+(?:\.\d+)?)\s*g/.exec(markdown)
        if (carbsMatch?.[1]) {
            carbs = Number.parseFloat(carbsMatch[1])
        }

        const fatMatch = /Fat:\s*(\d+(?:\.\d+)?)\s*g/.exec(markdown)
        if (fatMatch?.[1]) {
            fat = Number.parseFloat(fatMatch[1])
        }

        const cookingTimeMatch = /## Cooking Time\s+(\d+)\s*minutes/.exec(markdown)
        if (cookingTimeMatch?.[1]) {
            cooking_time = `${cookingTimeMatch[1]} minutes`
        }
    } catch (error) {
        logger.error("Error parsing markdown:", error)
    }

    return {
        title,
        ingredients,
        instructions,
        calories,
        protein,
        carbs,
        fat,
        cooking_time,
    }
}
