"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  Utensils,
  Activity,
  Plus,
  Leaf,
  Settings,
  BarChart3,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { CameraCapture } from "@/features/camera/components/camera-capture";
import { MetallicButton } from "@/components/ui/metallic-button";
import { FoodCategoryProgress } from "@/features/foods/components/food-category-progress";
import { FoodCompositionBar } from "@/features/foods/components/food-composition-bar";
import { OrganicCompositionBar } from "@/features/foods/components/organic-composition-bar";
import { VerticalProgressBar } from "@/features/foods/components/vertical-progress-bar";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { getZoneBgClass, getZoneTextClass } from "@/lib/utils/zone-colors";

// Import types
import { Food, Symptom } from "@/lib/types";

// Import custom hooks
import {
  useTodaysSymptoms,
  useRecentFoods,
  useRecentSymptoms,
  useFoodStats,
} from "@/lib/hooks";

type ViewType = "food" | "symptoms";

function Dashboard() {
  // Use custom hooks for reactive data binding
  const todaysSymptoms = useTodaysSymptoms();
  const recentFoods = useRecentFoods();
  const recentSymptoms = useRecentSymptoms();
  const foodStats = useFoodStats();
  const router = useRouter();
  const isMobile = useIsMobile();

  // View state
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>("food");

  const handleCameraCapture = async (imageData: string) => {
    // Store the image data temporarily in sessionStorage for the add food page
    sessionStorage.setItem("pendingFoodImage", imageData);
    router.push("/app/foods/add");
  };

  const handleManualEntry = () => {
    router.push("/app/foods/add");
  };

  const handleQuickCapture = () => {
    setShowCameraCapture(true);
  };

  // Get the active tab styling based on current view
  const getActiveTabStyle = (view: ViewType) => {
    if (currentView !== view)
      return "text-gray-600 hover:text-gray-800 hover:bg-white/30";

    switch (view) {
      case "food":
        return "bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-green-400/25";
      case "symptoms":
        return "bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-lg shadow-red-400/25";
      default:
        return "bg-white text-gray-900 shadow-sm";
    }
  };

  const handleEditFood = (food: Food) => {
    router.push(`/app/foods/edit/${food.id}`);
  };

  const handleEditSymptom = (symptom: Symptom) => {
    router.push(`/app/symptoms/edit/${symptom.id}`);
  };

  const handleAddSymptom = () => {
    router.push("/app/symptoms/add");
  };

  // Desktop sidebar navigation
  const DesktopSidebar = () => (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <h2 className="text-lg font-semibold text-sidebar-foreground">
          Body Compass
        </h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={currentView === "food"}
                onClick={() => setCurrentView("food")}
              >
                <Utensils className="h-4 w-4" />
                <span>Foods</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={currentView === "symptoms"}
                onClick={() => setCurrentView("symptoms")}
              >
                <Activity className="h-4 w-4" />
                <span>Symptoms</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => router.push("/app/insights")}>
                <BarChart3 className="h-4 w-4" />
                <span>Insights</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => router.push("/settings")}>
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );

  const getTopGlowStyle = (view: ViewType) => {
    switch (view) {
      case "food":
        return "shadow-[0_-4px_20px_rgba(34,197,94,0.15)]";
      case "symptoms":
        return "shadow-[0_-4px_20px_rgba(239,68,68,0.15)]";
      default:
        return "";
    }
  };

  return (
    <div
      className={`flex bg-gray-50 ${isMobile ? "mobile-container h-[100dvh]" : "h-[100dvh]"}`}
    >
      {/* Desktop Sidebar */}
      {!isMobile && (
        <SidebarProvider>
          <DesktopSidebar />
        </SidebarProvider>
      )}

      {/* Main Content Wrapper */}
      <div className="flex flex-1 flex-col min-h-0">
        {/* Header - Mobile Only */}
        {isMobile && (
          <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-100 z-10 flex-shrink-0">
            <ChevronLeft className="h-6 w-6 text-gray-600" />
            <h1 className="text-xl font-semibold text-gray-900">
              Your Body Compass
            </h1>
            <button
              onClick={() => router.push("/settings")}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Settings className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        )}

        {/* Scrollable Content Area */}
        <div
          className={`flex-1 overflow-y-auto overflow-x-hidden ${isMobile ? "main-content-mobile" : ""}`}
        >
          <div className="px-4 py-6 space-y-6 max-w-full">
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
                    isFromToday={foodStats?.isFromToday ?? true}
                  />
                  <div className="absolute right-0 top-0 flex flex-col items-center space-y-2">
                    <VerticalProgressBar
                      percentage={foodStats?.totalOrganicPercentage || 0}
                      height={200}
                    />
                    <Leaf className={`h-5 w-5 ${getZoneTextClass("green")}`} />
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
                    {!recentFoods || recentFoods.length === 0 ? (
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
                      <div className="space-y-3 overflow-hidden">
                        {recentFoods.map(food => (
                          <button
                            key={food.id}
                            onClick={() => handleEditFood(food)}
                            className="w-full flex items-center justify-between py-3 hover:bg-gray-50 rounded-lg transition-colors overflow-hidden"
                          >
                            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                              {food.image ? (
                                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                                  <Image
                                    src={food.image || "/placeholder.svg"}
                                    alt={food.name}
                                    className="w-full h-full object-cover"
                                    width={48}
                                    height={48}
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white text-lg">🍽️</span>
                                </div>
                              )}
                              <div className="text-left flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">
                                  {food.status === "analyzing"
                                    ? "New Food"
                                    : food.name}
                                </p>
                                <p className="text-sm text-gray-500 truncate">
                                  {food.ingredients
                                    ?.map(ing => ing.name)
                                    .join(", ") || "No ingredients"}
                                </p>
                              </div>
                            </div>
                            <div className="flex-shrink-0 w-16 sm:w-20 md:w-24 ml-1 sm:ml-2 space-y-1.5">
                              <FoodCompositionBar
                                ingredients={food.ingredients || []}
                              />
                              <OrganicCompositionBar
                                ingredients={food.ingredients || []}
                              />
                            </div>
                          </button>
                        ))}
                      </div>
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
        </div>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <>
            {/* Unified Background Container */}
            <div
              className={`fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-50/95 via-white/95 to-white/80 backdrop-blur-md ${getTopGlowStyle(currentView)} safe-area-pb z-50`}
            >
              {/* Tab Navigation */}
              <div className="px-4 py-4">
                <div className="bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 rounded-full p-1 flex justify-around space-x-1 shadow-[0_-2px_8px_rgba(0,0,0,0.06),0_2px_4px_rgba(0,0,0,0.04)] border border-slate-200/40">
                  <button
                    onClick={() => setCurrentView("food")}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-full transition-colors min-h-[44px] ${getActiveTabStyle("food")}`}
                  >
                    Foods
                  </button>
                  <button
                    onClick={() => setCurrentView("symptoms")}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-full transition-colors min-h-[44px] ${getActiveTabStyle("symptoms")}`}
                  >
                    Symptoms
                  </button>
                </div>
              </div>

              {/* Floating Action Buttons */}
              <div className="px-4 pt-1 pb-6">
                <div className="flex justify-around space-x-4">
                  <div className="relative">
                    <MetallicButton
                      accent="food"
                      size="lg"
                      onClick={handleQuickCapture}
                      className="group min-h-[44px] min-w-[44px]"
                    >
                      <Utensils
                        className={`h-6 w-6 text-gray-600 group-hover:${getZoneTextClass("green")} transition-colors`}
                      />
                    </MetallicButton>
                    <div
                      className={`absolute -top-1 -right-1 w-5 h-5 ${getZoneBgClass("green")} rounded-full flex items-center justify-center shadow-lg`}
                    >
                      <Plus className="h-3 w-3 text-white" />
                    </div>
                  </div>

                  <div className="relative">
                    <MetallicButton
                      accent="symptom"
                      size="lg"
                      onClick={handleAddSymptom}
                      className="group min-h-[44px] min-w-[44px]"
                    >
                      <Activity
                        className={`h-6 w-6 text-gray-600 group-hover:${getZoneTextClass("red")} transition-colors`}
                      />
                    </MetallicButton>
                    <div
                      className={`absolute -top-1 -right-1 w-5 h-5 ${getZoneBgClass("red")} rounded-full flex items-center justify-center shadow-lg`}
                    >
                      <Plus className="h-3 w-3 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Camera Capture Modal */}
      <CameraCapture
        open={showCameraCapture}
        onOpenChange={setShowCameraCapture}
        onCapture={handleCameraCapture}
        onManualEntry={handleManualEntry}
        title="Capture Food"
      />
    </div>
  );
}

export default function ProtectedDashboard() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  );
}
