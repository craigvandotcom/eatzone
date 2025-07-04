"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, User, Utensils, Droplets, Activity, Atom, Plus, Leaf } from "lucide-react"
import { AddMealDialog } from "@/components/add-meal-dialog"
import { AddLiquidDialog } from "@/components/add-liquid-dialog"
import { AddSymptomDialog } from "@/components/add-symptom-dialog"
import { AddStoolDialog } from "@/components/add-stool-dialog"
import { CameraCapture } from "@/components/camera-capture"
import { SplitCircularProgress } from "@/components/split-circular-progress"
import { FoodCategoryProgress } from "@/components/food-category-progress"
import { format } from "date-fns"
import { MealCompositionBar } from "@/components/meal-composition-bar"
import { OrganicCompositionBar } from "@/components/organic-composition-bar"
import { VerticalProgressBar } from "@/components/vertical-progress-bar"

interface Meal {
  id: string
  name: string
  time: string
  date: string
  category: string
  calories?: number
  description?: string
  notes?: string
  image?: string
  healthCategory?: "green" | "yellow" | "red" | "analyzing" // Added 'analyzing' status
  ingredients?: Ingredient[]
}

interface Ingredient {
  name: string
  isOrganic: boolean
  cookingMethod?: string
  healthCategory?: "green" | "yellow" | "red"
}

interface Liquid {
  id: string
  name: string
  time: string
  date: string
  amount: number // in ml
  type: string
  notes?: string
  image?: string
}

interface Symptom {
  id: string
  name: string
  severity: number
  time: string
  date: string
  notes?: string
}

interface Stool {
  id: string
  time: string
  date: string
  type: number // Bristol stool scale 1-7
  color: string
  consistency: string
  notes?: string
  image?: string
}

type ViewType = "liquids" | "food" | "stool" | "symptoms"

export default function Dashboard() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [liquids, setLiquids] = useState<Liquid[]>([])
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [stools, setStools] = useState<Stool[]>([])
  const [showAddMeal, setShowAddMeal] = useState(false)
  const [showAddLiquid, setShowAddLiquid] = useState(false)
  const [showAddSymptom, setShowAddSymptom] = useState(false)
  const [showAddStool, setShowAddStool] = useState(false)
  const [showCameraCapture, setShowCameraCapture] = useState(false)
  const [cameraType, setCameraType] = useState<"drink" | "eat" | "move" | null>(null)
  const [currentView, setCurrentView] = useState<ViewType>("liquids")

  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  const [editingLiquid, setEditingLiquid] = useState<Liquid | null>(null)
  const [editingSymptom, setEditingSymptom] = useState<Symptom | null>(null)
  const [editingStool, setEditingStool] = useState<Stool | null>(null)

  useEffect(() => {
    const savedMeals = localStorage.getItem("meals")
    const savedLiquids = localStorage.getItem("liquids")
    const savedSymptoms = localStorage.getItem("symptoms")
    const savedStools = localStorage.getItem("stools")

    if (savedMeals) setMeals(JSON.parse(savedMeals))
    if (savedLiquids) setLiquids(JSON.parse(savedLiquids))
    if (savedSymptoms) setSymptoms(JSON.parse(savedSymptoms))
    if (savedStools) setStools(JSON.parse(savedStools))
  }, [])

  const addMeal = (meal: Omit<Meal, "id">) => {
    if (editingMeal) {
      // Update existing meal
      const updatedMeal = { ...meal, id: editingMeal.id }
      const updatedMeals = meals.map((m) => (m.id === editingMeal.id ? updatedMeal : m))
      setMeals(updatedMeals)
      localStorage.setItem("meals", JSON.stringify(updatedMeals))
      setEditingMeal(null)
    } else {
      // Add new meal
      const newMeal = { ...meal, id: Date.now().toString() }
      const updatedMeals = [...meals, newMeal]
      setMeals(updatedMeals)
      localStorage.setItem("meals", JSON.stringify(updatedMeals))
    }
  }

  const addLiquid = (liquid: Omit<Liquid, "id">) => {
    if (editingLiquid) {
      // Update existing liquid
      const updatedLiquid = { ...liquid, id: editingLiquid.id }
      const updatedLiquids = liquids.map((l) => (l.id === editingLiquid.id ? updatedLiquid : l))
      setLiquids(updatedLiquids)
      localStorage.setItem("liquids", JSON.stringify(updatedLiquids))
      setEditingLiquid(null)
    } else {
      // Add new liquid
      const newLiquid = { ...liquid, id: Date.now().toString() }
      const updatedLiquids = [...liquids, newLiquid]
      setLiquids(updatedLiquids)
      localStorage.setItem("liquids", JSON.stringify(updatedLiquids))
    }
  }

  const addSymptom = (symptom: Omit<Symptom, "id">) => {
    if (editingSymptom) {
      // Update existing symptom
      const updatedSymptom = { ...symptom, id: editingSymptom.id }
      const updatedSymptoms = symptoms.map((s) => (s.id === editingSymptom.id ? updatedSymptom : s))
      setSymptoms(updatedSymptoms)
      localStorage.setItem("symptoms", JSON.stringify(updatedSymptoms))
      setEditingSymptom(null)
    } else {
      // Add new symptom
      const newSymptom = { ...symptom, id: Date.now().toString() }
      const updatedSymptoms = [...symptoms, newSymptom]
      setSymptoms(updatedSymptoms)
      localStorage.setItem("symptoms", JSON.stringify(updatedSymptoms))
    }
  }

  const addStool = (stool: Omit<Stool, "id">) => {
    if (editingStool) {
      // Update existing stool
      const updatedStool = { ...stool, id: editingStool.id }
      const updatedStools = stools.map((s) => (s.id === editingStool.id ? updatedStool : s))
      setStools(updatedStools)
      localStorage.setItem("stools", JSON.stringify(updatedStools))
      setEditingStool(null)
    } else {
      // Add new stool
      const newStool = { ...stool, id: Date.now().toString() }
      const updatedStools = [...stools, newStool]
      setStools(updatedStools)
      localStorage.setItem("stools", JSON.stringify(updatedStools))
    }
  }

  const handleCameraCapture = (imageData: string) => {
    const now = new Date()
    const time = format(now, "HH:mm")
    const date = format(now, "yyyy-MM-dd")

    if (cameraType === "drink") {
      const newLiquid: Liquid = {
        id: Date.now().toString(),
        name: "Photo captured",
        time,
        date,
        amount: 0, // Will be updated by AI analysis
        type: "unknown", // Will be updated by AI analysis
        image: imageData,
        notes: "Analyzing image...",
      }
      const updatedLiquids = [...liquids, newLiquid]
      setLiquids(updatedLiquids)
      localStorage.setItem("liquids", JSON.stringify(updatedLiquids))

      // TODO: Send to AI for analysis
      console.log("Analyzing drink image...")
    } else if (cameraType === "eat") {
      const newMeal: Meal = {
        id: Date.now().toString(),
        name: "Photo captured",
        time,
        date,
        category: "unknown", // Will be updated by AI analysis
        healthCategory: "analyzing", // Set to analyzing status
        image: imageData,
        notes: "Analyzing image...",
      }
      const updatedMeals = [...meals, newMeal]
      setMeals(updatedMeals)
      localStorage.setItem("meals", JSON.stringify(updatedMeals))

      // TODO: Send to AI for analysis
      console.log("Analyzing food image...")

      // Simulate AI analysis delay (remove this in production)
      setTimeout(() => {
        // Simulate AI analysis result
        const analyzedMeal = { ...newMeal }

        // 1. Assign health categories to each ingredient
        if (analyzedMeal.ingredients) {
          analyzedMeal.ingredients = analyzedMeal.ingredients.map((ing) => {
            const categories: ("green" | "yellow" | "red")[] = ["green", "yellow", "red"]
            const randomCategory = categories[Math.floor(Math.random() * categories.length)]
            return { ...ing, healthCategory: randomCategory }
          })
        }

        // 2. Generate a summary name
        const ingredientNames = analyzedMeal.ingredients?.map((ing) => ing.name) || []
        analyzedMeal.name =
          ingredientNames.length > 2 ? `${ingredientNames.slice(0, 2).join(", ")} & more` : ingredientNames.join(", ")

        // 3. Set meal healthCategory to 'green' to signify analysis is complete (for badge logic)
        analyzedMeal.healthCategory = "green"
        analyzedMeal.notes = "AI analysis complete."

        const updatedMealsWithAnalysis = meals.map((meal) => (meal.id === newMeal.id ? analyzedMeal : meal))
        setMeals(updatedMealsWithAnalysis)
        localStorage.setItem("meals", JSON.stringify(updatedMealsWithAnalysis))
        console.log("AI analysis complete!")
      }, 3000) // 3 second delay
    } else if (cameraType === "move") {
      const newStool: Stool = {
        id: Date.now().toString(),
        time,
        date,
        type: 4, // Will be updated by AI analysis
        color: "unknown", // Will be updated by AI analysis
        consistency: "unknown", // Will be updated by AI analysis
        image: imageData,
        notes: "Analyzing image...",
      }
      const updatedStools = [...stools, newStool]
      setStools(updatedStools)
      localStorage.setItem("stools", JSON.stringify(updatedStools))

      // TODO: Send to AI for analysis
      console.log("Analyzing stool image...")
    }
  }

  const handleManualEntry = () => {
    if (cameraType === "drink") {
      setShowAddLiquid(true)
    } else if (cameraType === "eat") {
      setShowAddMeal(true)
    } else if (cameraType === "move") {
      setShowAddStool(true)
    }
  }

  const handleQuickCapture = (type: "drink" | "eat" | "move") => {
    setCameraType(type)
    setShowCameraCapture(true)
  }

  const getCameraTitle = () => {
    switch (cameraType) {
      case "drink":
        return "Capture Drink"
      case "eat":
        return "Capture Food"
      case "move":
        return "Capture Movement"
      default:
        return "Capture"
    }
  }

  // Get the active tab styling based on current view
  const getActiveTabStyle = (view: ViewType) => {
    if (currentView !== view) return "text-gray-600"

    switch (view) {
      case "liquids":
        return "bg-gradient-to-r from-blue-400 to-cyan-500 text-white shadow-lg"
      case "food":
        return "bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg"
      case "stool":
        return "bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-lg"
      case "symptoms":
        return "bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-lg"
      default:
        return "bg-white text-gray-900 shadow-sm"
    }
  }

  const today = format(new Date(), "yyyy-MM-dd")
  const todaysMeals = meals.filter((meal) => meal.date === today)
  const todaysLiquids = liquids.filter((liquid) => liquid.date === today)
  const todaysSymptoms = symptoms.filter((symptom) => symptom.date === today)
  const todaysStools = stools.filter((stool) => stool.date === today)

  // Calculate water vs other liquids
  const waterGoal = 2000 // 2L in ml
  const waterTypes = ["water"]
  const waterAmount = todaysLiquids
    .filter((liquid) => waterTypes.includes(liquid.type.toLowerCase()))
    .reduce((sum, liquid) => sum + liquid.amount, 0)
  const otherAmount = todaysLiquids
    .filter((liquid) => !waterTypes.includes(liquid.type.toLowerCase()))
    .reduce((sum, liquid) => sum + liquid.amount, 0)

  const waterPercentage = Math.min((waterAmount / waterGoal) * 100, 100)
  const otherPercentage = waterAmount > 0 ? Math.min((otherAmount / waterAmount) * 100, 100) : 0

  // Calculate food categories based on ingredients from all of today's meals
  const todaysIngredients = todaysMeals.flatMap((meal) => meal.ingredients || [])
  const greenIngredients = todaysIngredients.filter((ing) => ing.healthCategory === "green").length
  const yellowIngredients = todaysIngredients.filter((ing) => ing.healthCategory === "yellow").length
  const redIngredients = todaysIngredients.filter((ing) => ing.healthCategory === "red").length

  // Calculate total organic percentage for the day
  const organicIngredientsCount = todaysIngredients.filter((ing) => ing.isOrganic).length
  const totalDailyOrganicPercentage =
    todaysIngredients.length > 0 ? (organicIngredientsCount / todaysIngredients.length) * 100 : 0

  const getStoolTypeDescription = (type: number) => {
    const descriptions = {
      1: "Hard lumps",
      2: "Lumpy sausage",
      3: "Cracked sausage",
      4: "Smooth sausage",
      5: "Soft blobs",
      6: "Mushy consistency",
      7: "Liquid consistency",
    }
    return descriptions[type as keyof typeof descriptions] || "Unknown"
  }

  const handleEditLiquid = (liquid: Liquid) => {
    setEditingLiquid(liquid)
    setShowAddLiquid(true)
  }

  const handleEditMeal = (meal: Meal) => {
    setEditingMeal(meal)
    setShowAddMeal(true)
  }

  const handleEditSymptom = (symptom: Symptom) => {
    setEditingSymptom(symptom)
    setShowAddSymptom(true)
  }

  const handleEditStool = (stool: Stool) => {
    setEditingStool(stool)
    setShowAddStool(true)
  }

  const handleCloseMealDialog = () => {
    setShowAddMeal(false)
    setEditingMeal(null)
  }

  const handleCloseLiquidDialog = () => {
    setShowAddLiquid(false)
    setEditingLiquid(null)
  }

  const handleCloseSymptomDialog = () => {
    setShowAddSymptom(false)
    setEditingSymptom(null)
  }

  const handleCloseStoolDialog = () => {
    setShowAddStool(false)
    setEditingStool(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-100">
        <ChevronLeft className="h-6 w-6 text-gray-600" />
        <h1 className="text-xl font-semibold text-gray-900">Your Body Compass</h1>
        <div className="relative">
          <User className="h-6 w-6 text-gray-600" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {currentView === "liquids" && (
          <>
            {/* Split Liquids Progress */}
            <div className="flex flex-col items-center space-y-4 h-64">
              <SplitCircularProgress
                waterPercentage={waterPercentage}
                otherPercentage={otherPercentage}
                size={200}
                strokeWidth={12}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Entries</h2>
                <button className="text-gray-500 text-sm">View more</button>
              </div>
              <div className="space-y-3">
                {liquids.slice(-5).reverse().length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Droplets className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg font-medium">No liquids logged yet</p>
                    <p className="text-gray-400 text-sm mt-1">Tap the drink icon below to get started</p>
                  </div>
                ) : (
                  liquids
                    .slice(-5)
                    .reverse()
                    .map((liquid) => (
                      <button
                        key={liquid.id}
                        onClick={() => handleEditLiquid(liquid)}
                        className="w-full flex items-center justify-between py-3 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          {liquid.image ? (
                            <div className="w-12 h-12 rounded-full overflow-hidden">
                              <img
                                src={liquid.image || "/placeholder.svg"}
                                alt={liquid.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-lg">💧</span>
                            </div>
                          )}
                          <div className="text-left">
                            <p className="font-medium text-gray-900 capitalize">{liquid.type}</p>
                            <p className="text-sm text-gray-500">{liquid.amount}ml</p>
                          </div>
                        </div>
                        <span className="font-semibold text-gray-900">{liquid.amount}ml</span>
                      </button>
                    ))
                )}
              </div>
            </div>
          </>
        )}

        {currentView === "food" && (
          <>
            {/* Food Category Progress */}
            <div className="relative flex flex-col items-center h-64">
              <FoodCategoryProgress
                greenCount={greenIngredients}
                yellowCount={yellowIngredients}
                redCount={redIngredients}
                size={200}
                strokeWidth={12}
              />
              <div className="absolute right-0 top-0 flex flex-col items-center space-y-2">
                <VerticalProgressBar percentage={totalDailyOrganicPercentage} height={200} />
                <Leaf className="h-5 w-5 text-green-600" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Entries</h2>
                <button className="text-gray-500 text-sm">View more</button>
              </div>
              <div className="space-y-3">
                {meals.slice(-5).reverse().length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Utensils className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg font-medium">No foods logged yet</p>
                    <p className="text-gray-400 text-sm mt-1">Tap the eat icon below to get started</p>
                  </div>
                ) : (
                  meals
                    .slice(-5)
                    .reverse()
                    .map((meal) => (
                      <button
                        key={meal.id}
                        onClick={() => handleEditMeal(meal)}
                        className="w-full flex items-center justify-between py-3 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          {meal.image ? (
                            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                              <img
                                src={meal.image || "/placeholder.svg"}
                                alt={meal.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-lg">🍽️</span>
                            </div>
                          )}
                          <div className="text-left flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {meal.healthCategory === "analyzing" ? "New Meal" : meal.name}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {meal.ingredients?.map((ing) => ing.name).join(", ") || meal.category}
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0 w-24 ml-2 space-y-1.5">
                          <MealCompositionBar ingredients={meal.ingredients || []} />
                          <OrganicCompositionBar ingredients={meal.ingredients || []} />
                        </div>
                      </button>
                    ))
                )}
              </div>
            </div>
          </>
        )}

        {currentView === "stool" && (
          <>
            <div className="flex flex-col items-center space-y-4 h-64">
              <div className="w-48 h-48 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{todaysStools.length}</p>
                  <p className="text-sm text-gray-600">Movements Today</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Entries</h2>
                <button className="text-gray-500 text-sm">View more</button>
              </div>
              <div className="space-y-3">
                {stools.slice(-5).reverse().length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Atom className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg font-medium">No movements logged yet</p>
                    <p className="text-gray-400 text-sm mt-1">Tap the move icon below to get started</p>
                  </div>
                ) : (
                  stools
                    .slice(-5)
                    .reverse()
                    .map((stool) => (
                      <button
                        key={stool.id}
                        onClick={() => handleEditStool(stool)}
                        className="w-full flex items-center justify-between py-3 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          {stool.image ? (
                            <div className="w-12 h-12 rounded-full overflow-hidden">
                              <img
                                src={stool.image || "/placeholder.svg"}
                                alt="Movement record"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-lg">💩</span>
                            </div>
                          )}
                          <div className="text-left">
                            <p className="font-medium text-gray-900">Type {stool.type} Movement</p>
                            <p className="text-sm text-gray-500 capitalize">
                              {stool.color}, {stool.consistency}
                            </p>
                          </div>
                        </div>
                        <span className="font-semibold text-gray-900">{stool.time}</span>
                      </button>
                    ))
                )}
              </div>
            </div>
          </>
        )}

        {currentView === "symptoms" && (
          <>
            <div className="flex flex-col items-center space-y-4 h-64">
              <div className="w-48 h-48 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{todaysSymptoms.length}</p>
                  <p className="text-sm text-gray-600">Symptoms Today</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Entries</h2>
                <button className="text-gray-500 text-sm">View more</button>
              </div>
              <div className="space-y-3">
                {symptoms.slice(-5).reverse().length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Activity className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg font-medium">No symptoms logged yet</p>
                    <p className="text-gray-400 text-sm mt-1">Tap the feel icon below to get started</p>
                  </div>
                ) : (
                  symptoms
                    .slice(-5)
                    .reverse()
                    .map((symptom) => (
                      <button
                        key={symptom.id}
                        onClick={() => handleEditSymptom(symptom)}
                        className="w-full flex items-center justify-between py-3 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-lg">⚡</span>
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-gray-900">{symptom.name}</p>
                            <p className="text-sm text-gray-500">{symptom.time}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            className={`${
                              symptom.severity <= 2
                                ? "bg-green-100 text-green-800"
                                : symptom.severity <= 4
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {symptom.severity}/5
                          </Badge>
                        </div>
                      </button>
                    ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Camera Capture Dialog */}
      <CameraCapture
        open={showCameraCapture}
        onOpenChange={setShowCameraCapture}
        onCapture={handleCameraCapture}
        onManualEntry={handleManualEntry}
        title={getCameraTitle()}
      />

      {/* Manual Entry Dialogs */}
      <AddMealDialog
        open={showAddMeal}
        onOpenChange={handleCloseMealDialog}
        onAddMeal={addMeal}
        editingMeal={editingMeal}
      />
      <AddLiquidDialog
        open={showAddLiquid}
        onOpenChange={handleCloseLiquidDialog}
        onAddLiquid={addLiquid}
        editingLiquid={editingLiquid}
      />
      <AddSymptomDialog
        open={showAddSymptom}
        onOpenChange={handleCloseSymptomDialog}
        onAddSymptom={addSymptom}
        editingSymptom={editingSymptom}
      />
      <AddStoolDialog
        open={showAddStool}
        onOpenChange={handleCloseStoolDialog}
        onAddStool={addStool}
        editingStool={editingStool}
      />

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-2 safe-area-pb">
        {/* View Toggle */}
        <div className="mb-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(["liquids", "food", "stool", "symptoms"] as ViewType[]).map((view) => {
              const getLabel = () => {
                switch (view) {
                  case "liquids":
                    return "Liquids"
                  case "food":
                    return "Foods"
                  case "stool":
                    return "Stools"
                  case "symptoms":
                    return "Symptoms"
                }
              }

              return (
                <button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-all duration-300 flex items-center justify-center ${getActiveTabStyle(view)}`}
                >
                  {getLabel()}
                </button>
              )
            })}
          </div>
        </div>

        {/* Navigation Icons */}
        <div className="flex justify-around items-center max-w-md mx-auto h-12">
          <button
            onClick={() => handleQuickCapture("drink")}
            className="flex flex-col items-center p-2 rounded-xl hover:bg-gray-50 transition-all duration-200 active:scale-95"
          >
            <div className="relative w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
              <Droplets className="h-6 w-6 text-white" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                <Plus className="h-3 w-3 text-blue-500" />
              </div>
            </div>
          </button>

          <button
            onClick={() => handleQuickCapture("eat")}
            className="flex flex-col items-center p-2 rounded-xl hover:bg-gray-50 transition-all duration-200 active:scale-95"
          >
            <div className="relative w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
              <Utensils className="h-6 w-6 text-white" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                <Plus className="h-3 w-3 text-green-500" />
              </div>
            </div>
          </button>

          <button
            onClick={() => handleQuickCapture("move")}
            className="flex flex-col items-center p-2 rounded-xl hover:bg-gray-50 transition-all duration-200 active:scale-95"
          >
            <div className="relative w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
              <Atom className="h-6 w-6 text-white" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                <Plus className="h-3 w-3 text-amber-600" />
              </div>
            </div>
          </button>

          <button
            onClick={() => setShowAddSymptom(true)}
            className="flex flex-col items-center p-2 rounded-xl hover:bg-gray-50 transition-all duration-200 active:scale-95"
          >
            <div className="relative w-12 h-12 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
              <Activity className="h-6 w-6 text-white" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                <Plus className="h-3 w-3 text-red-500" />
              </div>
            </div>
          </button>
        </div>

        {/* Bottom Spacer */}
        <div className="h-4"></div>
      </div>
    </div>
  )
}
