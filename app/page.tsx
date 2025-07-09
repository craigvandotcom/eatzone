"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  User,
  Utensils,
  Droplets,
  Activity,
  Atom,
  Plus,
  Leaf,
} from "lucide-react";
import { AddMealDialog } from "@/components/add-meal-dialog";
import { AddLiquidDialog } from "@/components/add-liquid-dialog";
import { AddSymptomDialog } from "@/components/add-symptom-dialog";
import { AddStoolDialog } from "@/components/add-stool-dialog";
import { CameraCapture } from "@/components/camera-capture";
import { SplitCircularProgress } from "@/components/split-circular-progress";
import { FoodCategoryProgress } from "@/components/food-category-progress";
import { format } from "date-fns";
import { MealCompositionBar } from "@/components/meal-composition-bar";
import { OrganicCompositionBar } from "@/components/organic-composition-bar";
import { VerticalProgressBar } from "@/components/vertical-progress-bar";

// Import types and database functions
import { Meal, Liquid, Symptom, Stool } from "@/lib/types";
import {
  addMeal as dbAddMeal,
  addLiquid as dbAddLiquid,
  addSymptom as dbAddSymptom,
  addStool as dbAddStool,
  updateMeal as dbUpdateMeal,
  updateLiquid as dbUpdateLiquid,
  updateSymptom as dbUpdateSymptom,
  updateStool as dbUpdateStool,
  generateTimestamp,
} from "@/lib/db";

// Import custom hooks
import {
  useTodaysMeals,
  useTodaysLiquids,
  useTodaysSymptoms,
  useTodaysStools,
  useRecentMeals,
  useRecentLiquids,
  useRecentSymptoms,
  useRecentStools,
  useWaterStats,
  useFoodStats,
} from "@/lib/hooks";

type ViewType = "liquids" | "food" | "stool" | "symptoms";

export default function Dashboard() {
  // Use custom hooks for reactive data binding
  const todaysMeals = useTodaysMeals();
  const todaysLiquids = useTodaysLiquids();
  const todaysSymptoms = useTodaysSymptoms();
  const todaysStools = useTodaysStools();
  const recentMeals = useRecentMeals();
  const recentLiquids = useRecentLiquids();
  const recentSymptoms = useRecentSymptoms();
  const recentStools = useRecentStools();
  const waterStats = useWaterStats();
  const foodStats = useFoodStats();

  // Dialog state
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [showAddLiquid, setShowAddLiquid] = useState(false);
  const [showAddSymptom, setShowAddSymptom] = useState(false);
  const [showAddStool, setShowAddStool] = useState(false);
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [cameraType, setCameraType] = useState<"drink" | "eat" | "move" | null>(
    null
  );
  const [currentView, setCurrentView] = useState<ViewType>("liquids");

  // Edit state
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [editingLiquid, setEditingLiquid] = useState<Liquid | null>(null);
  const [editingSymptom, setEditingSymptom] = useState<Symptom | null>(null);
  const [editingStool, setEditingStool] = useState<Stool | null>(null);

  // Database operations
  const addMeal = async (meal: Omit<Meal, "id" | "timestamp">) => {
    if (editingMeal) {
      // Update existing meal
      await dbUpdateMeal(editingMeal.id, meal);
      setEditingMeal(null);
    } else {
      // Add new meal
      await dbAddMeal(meal);
    }
  };

  const addLiquid = async (liquid: Omit<Liquid, "id" | "timestamp">) => {
    if (editingLiquid) {
      // Update existing liquid
      await dbUpdateLiquid(editingLiquid.id, liquid);
      setEditingLiquid(null);
    } else {
      // Add new liquid
      await dbAddLiquid(liquid);
    }
  };

  const addSymptom = async (symptom: Omit<Symptom, "id" | "timestamp">) => {
    if (editingSymptom) {
      // Update existing symptom
      await dbUpdateSymptom(editingSymptom.id, symptom);
      setEditingSymptom(null);
    } else {
      // Add new symptom
      await dbAddSymptom(symptom);
    }
  };

  const addStool = async (stool: Omit<Stool, "id" | "timestamp">) => {
    if (editingStool) {
      // Update existing stool
      await dbUpdateStool(editingStool.id, stool);
      setEditingStool(null);
    } else {
      // Add new stool
      await dbAddStool(stool);
    }
  };

  const handleCameraCapture = async (imageData: string) => {
    if (cameraType === "drink") {
      const newLiquid: Omit<Liquid, "id" | "timestamp"> = {
        name: "Photo captured",
        amount: 0, // Will be updated by AI analysis
        type: "other", // Will be updated by AI analysis
        image: imageData,
        notes: "Analyzing image...",
      };
      await dbAddLiquid(newLiquid);

      // TODO: Send to AI for analysis
      console.log("Analyzing drink image...");
    } else if (cameraType === "eat") {
      const newMeal: Omit<Meal, "id" | "timestamp"> = {
        name: "Photo captured",
        ingredients: [], // Will be updated by AI analysis
        status: "analyzing",
        image: imageData,
        notes: "Analyzing image...",
      };
      await dbAddMeal(newMeal);

      // TODO: Send to AI for analysis
      console.log("Analyzing food image...");
    } else if (cameraType === "move") {
      const newStool: Omit<Stool, "id" | "timestamp"> = {
        bristolScale: 4, // Will be updated by AI analysis
        color: "brown", // Will be updated by AI analysis
        hasBlood: false, // Will be updated by AI analysis
        image: imageData,
        notes: "Analyzing image...",
      };
      await dbAddStool(newStool);

      // TODO: Send to AI for analysis
      console.log("Analyzing stool image...");
    }
  };

  const handleManualEntry = () => {
    if (cameraType === "drink") {
      setShowAddLiquid(true);
    } else if (cameraType === "eat") {
      setShowAddMeal(true);
    } else if (cameraType === "move") {
      setShowAddStool(true);
    }
  };

  const handleQuickCapture = (type: "drink" | "eat" | "move") => {
    setCameraType(type);
    setShowCameraCapture(true);
  };

  const getCameraTitle = () => {
    switch (cameraType) {
      case "drink":
        return "Capture Drink";
      case "eat":
        return "Capture Food";
      case "move":
        return "Capture Movement";
      default:
        return "Capture";
    }
  };

  // Get the active tab styling based on current view
  const getActiveTabStyle = (view: ViewType) => {
    if (currentView !== view) return "text-gray-600";

    switch (view) {
      case "liquids":
        return "bg-gradient-to-r from-blue-400 to-cyan-500 text-white shadow-lg";
      case "food":
        return "bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg";
      case "stool":
        return "bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-lg";
      case "symptoms":
        return "bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-lg";
      default:
        return "bg-white text-gray-900 shadow-sm";
    }
  };

  const getStoolTypeDescription = (bristolScale: number) => {
    const descriptions = {
      1: "Hard lumps",
      2: "Lumpy sausage",
      3: "Cracked sausage",
      4: "Smooth sausage",
      5: "Soft blobs",
      6: "Mushy consistency",
      7: "Liquid consistency",
    };
    return descriptions[bristolScale as keyof typeof descriptions] || "Unknown";
  };

  const handleEditLiquid = (liquid: Liquid) => {
    setEditingLiquid(liquid);
    setShowAddLiquid(true);
  };

  const handleEditMeal = (meal: Meal) => {
    setEditingMeal(meal);
    setShowAddMeal(true);
  };

  const handleEditSymptom = (symptom: Symptom) => {
    setEditingSymptom(symptom);
    setShowAddSymptom(true);
  };

  const handleEditStool = (stool: Stool) => {
    setEditingStool(stool);
    setShowAddStool(true);
  };

  const handleCloseMealDialog = () => {
    setShowAddMeal(false);
    setEditingMeal(null);
  };

  const handleCloseLiquidDialog = () => {
    setShowAddLiquid(false);
    setEditingLiquid(null);
  };

  const handleCloseSymptomDialog = () => {
    setShowAddSymptom(false);
    setEditingSymptom(null);
  };

  const handleCloseStoolDialog = () => {
    setShowAddStool(false);
    setEditingStool(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-100">
        <ChevronLeft className="h-6 w-6 text-gray-600" />
        <h1 className="text-xl font-semibold text-gray-900">
          Your Body Compass
        </h1>
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
                waterPercentage={waterStats?.waterPercentage || 0}
                otherPercentage={waterStats?.otherPercentage || 0}
                size={200}
                strokeWidth={12}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Entries
                </h2>
                <button className="text-gray-500 text-sm">View more</button>
              </div>
              <div className="space-y-3">
                {!recentLiquids || recentLiquids.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Droplets className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg font-medium">
                      No liquids logged yet
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      Tap the drink icon below to get started
                    </p>
                  </div>
                ) : (
                  recentLiquids.map(liquid => (
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
                          <p className="font-medium text-gray-900 capitalize">
                            {liquid.type}
                          </p>
                          <p className="text-sm text-gray-500">
                            {liquid.amount}ml
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {liquid.amount}ml
                      </span>
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
                greenCount={foodStats?.greenIngredients || 0}
                yellowCount={foodStats?.yellowIngredients || 0}
                redCount={foodStats?.redIngredients || 0}
                size={200}
                strokeWidth={12}
              />
              <div className="absolute right-0 top-0 flex flex-col items-center space-y-2">
                <VerticalProgressBar
                  percentage={foodStats?.totalOrganicPercentage || 0}
                  height={200}
                />
                <Leaf className="h-5 w-5 text-green-600" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Entries
                </h2>
                <button className="text-gray-500 text-sm">View more</button>
              </div>
              <div className="space-y-3">
                {!recentMeals || recentMeals.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Utensils className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg font-medium">
                      No foods logged yet
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      Tap the eat icon below to get started
                    </p>
                  </div>
                ) : (
                  recentMeals.map(meal => (
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
                            {meal.status === "analyzing"
                              ? "New Meal"
                              : meal.name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {meal.ingredients
                              ?.map(ing => ing.name)
                              .join(", ") || "No ingredients"}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 w-24 ml-2 space-y-1.5">
                        <MealCompositionBar
                          ingredients={meal.ingredients || []}
                        />
                        <OrganicCompositionBar
                          ingredients={meal.ingredients || []}
                        />
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
                  <p className="text-3xl font-bold text-gray-900">
                    {todaysStools?.length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Movements Today</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Entries
                </h2>
                <button className="text-gray-500 text-sm">View more</button>
              </div>
              <div className="space-y-3">
                {!recentStools || recentStools.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Atom className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg font-medium">
                      No movements logged yet
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      Tap the move icon below to get started
                    </p>
                  </div>
                ) : (
                  recentStools.map(stool => (
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
                              alt="Stool"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-lg">💩</span>
                          </div>
                        )}
                        <div className="text-left">
                          <p className="font-medium text-gray-900">
                            {getStoolTypeDescription(stool.bristolScale)}
                          </p>
                          <p className="text-sm text-gray-500 capitalize">
                            {stool.color}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {stool.bristolScale}
                        </Badge>
                        {stool.hasBlood && (
                          <Badge variant="destructive" className="text-xs">
                            Blood
                          </Badge>
                        )}
                      </div>
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
              <div className="w-48 h-48 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">
                    {todaysSymptoms?.length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Symptoms Today</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Entries
                </h2>
                <button className="text-gray-500 text-sm">View more</button>
              </div>
              <div className="space-y-3">
                {!recentSymptoms || recentSymptoms.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Activity className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg font-medium">
                      No symptoms logged yet
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      Tap the symptom icon below to get started
                    </p>
                  </div>
                ) : (
                  recentSymptoms.map(symptom => (
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
                          <p className="font-medium text-gray-900">
                            {symptom.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            Severity: {symptom.severity}/5
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {symptom.severity}/5
                      </Badge>
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="fixed bottom-20 left-0 right-0 bg-white px-4 py-4">
        <div className="bg-gray-100 rounded-full p-1 flex justify-around space-x-1">
          <button
            onClick={() => setCurrentView("liquids")}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-full transition-colors ${getActiveTabStyle("liquids")}`}
          >
            Liquids
          </button>
          <button
            onClick={() => setCurrentView("food")}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-full transition-colors ${getActiveTabStyle("food")}`}
          >
            Foods
          </button>
          <button
            onClick={() => setCurrentView("stool")}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-full transition-colors ${getActiveTabStyle("stool")}`}
          >
            Stools
          </button>
          <button
            onClick={() => setCurrentView("symptoms")}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-full transition-colors ${getActiveTabStyle("symptoms")}`}
          >
            Symptoms
          </button>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white px-4 py-4">
        <div className="flex justify-around space-x-4">
          <button
            onClick={() => setShowAddLiquid(true)}
            className="relative w-14 h-14 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Droplets className="h-6 w-6" />
            <Plus className="absolute -top-1 -right-1 h-4 w-4 bg-white text-blue-500 rounded-full" />
          </button>
          <button
            onClick={() => setShowAddMeal(true)}
            className="relative w-14 h-14 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Utensils className="h-6 w-6" />
            <Plus className="absolute -top-1 -right-1 h-4 w-4 bg-white text-green-500 rounded-full" />
          </button>
          <button
            onClick={() => setShowAddStool(true)}
            className="relative w-14 h-14 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Atom className="h-6 w-6" />
            <Plus className="absolute -top-1 -right-1 h-4 w-4 bg-white text-amber-500 rounded-full" />
          </button>
          <button
            onClick={() => setShowAddSymptom(true)}
            className="relative w-14 h-14 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Activity className="h-6 w-6" />
            <Plus className="absolute -top-1 -right-1 h-4 w-4 bg-white text-red-500 rounded-full" />
          </button>
        </div>
      </div>

      {/* Camera Capture Modal */}
      <CameraCapture
        open={showCameraCapture}
        onOpenChange={setShowCameraCapture}
        onCapture={handleCameraCapture}
        onManualEntry={handleManualEntry}
        title={getCameraTitle()}
      />

      {/* Add Dialogs */}
      <AddMealDialog
        open={showAddMeal}
        onOpenChange={setShowAddMeal}
        onAddMeal={addMeal}
        onClose={handleCloseMealDialog}
        editingMeal={editingMeal}
      />

      <AddLiquidDialog
        open={showAddLiquid}
        onOpenChange={setShowAddLiquid}
        onAddLiquid={addLiquid}
        onClose={handleCloseLiquidDialog}
        editingLiquid={editingLiquid}
      />

      <AddSymptomDialog
        open={showAddSymptom}
        onOpenChange={setShowAddSymptom}
        onAddSymptom={addSymptom}
        onClose={handleCloseSymptomDialog}
        editingSymptom={editingSymptom}
      />

      <AddStoolDialog
        open={showAddStool}
        onOpenChange={setShowAddStool}
        onAddStool={addStool}
        onClose={handleCloseStoolDialog}
        editingStool={editingStool}
      />
    </div>
  );
}
