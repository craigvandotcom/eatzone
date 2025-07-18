"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  Download,
  Upload,
  Trash2,
  LogOut,
  Moon,
  Sun,
  Info,
  TestTube,
  Database,
  User,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  exportAllData,
  importAllData,
  clearAllData,
  resetDatabase,
  addFood,
} from "@/lib/db";
import { useAuth } from "@/features/auth/components/auth-provider";
import { AuthGuard } from "@/features/auth/components/auth-guard";

function SettingsPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isResettingDatabase, setIsResettingDatabase] = useState(false);
  const [isAddingTest, setIsAddingTest] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = await exportAllData();

      // Create a downloadable JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `health-tracker-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported successfully",
        description: `Exported ${data.foods.length} foods and ${data.symptoms.length} symptoms.`,
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export failed",
        description:
          "There was an error exporting your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate the data structure
      if (!data.foods || !data.symptoms) {
        throw new Error("Invalid backup file format");
      }

      await importAllData(data);

      toast({
        title: "Data imported successfully",
        description: `Imported ${data.foods.length} foods and ${data.symptoms.length} symptoms.`,
      });
    } catch (error) {
      console.error("Import failed:", error);
      toast({
        title: "Import failed",
        description:
          "There was an error importing your data. Please check the file format and try again.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      // Reset the file input
      event.target.value = "";
    }
  };

  const handleClearAllData = async () => {
    setIsClearing(true);
    try {
      await clearAllData();
      toast({
        title: "All data cleared",
        description:
          "All your health tracking data has been permanently deleted.",
      });
    } catch (error) {
      console.error("Clear failed:", error);
      toast({
        title: "Clear failed",
        description: "There was an error clearing your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleDatabaseReset = async () => {
    setIsResettingDatabase(true);
    try {
      await resetDatabase();
      toast({
        title: "Database reset successfully",
        description:
          "Your database has been reset. You can now use the app normally.",
      });
      // Refresh the page to ensure clean state
      window.location.reload();
    } catch (error) {
      console.error("Database reset failed:", error);
      toast({
        title: "Database reset failed",
        description:
          "There was an error resetting your database. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResettingDatabase(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleAddTestData = async () => {
    setIsAddingTest(true);
    try {
      // Add a test food with organic and non-organic ingredients
      await addFood({
        name: "Test Organic Meal",
        ingredients: [
          {
            name: "organic spinach",
            isOrganic: true,
            zone: "green",
            foodGroup: "vegetable",
            cookingMethod: "raw",
          },
          {
            name: "organic quinoa",
            isOrganic: true,
            zone: "green",
            foodGroup: "grain",
            cookingMethod: "steamed",
          },
          {
            name: "salmon",
            isOrganic: false,
            zone: "green",
            foodGroup: "protein",
            cookingMethod: "grilled",
          },
        ],
        status: "processed",
        notes: "Test data to verify organic tracking",
      });

      toast({
        title: "Test data added",
        description:
          "Added a test meal with 2/3 organic ingredients to verify the organic tracking works.",
      });
    } catch (error) {
      console.error("Failed to add test data:", error);
      toast({
        title: "Test data failed",
        description: "There was an error adding test data.",
        variant: "destructive",
      });
    } finally {
      setIsAddingTest(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-100">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <div className="w-6" /> {/* Spacer */}
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Your account details and privacy information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <p className="text-sm text-gray-900">
                {user?.email || "Loading..."}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Account Created</Label>
              <p className="text-sm text-gray-600">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "Loading..."}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Last Login</Label>
              <p className="text-sm text-gray-600">
                {user?.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>

            <Separator />

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                Privacy Reminder
              </h4>
              <p className="text-xs text-blue-700">
                Your account and all health data are stored locally on this
                device only. Regular data exports are your only backup method.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Data Management
            </CardTitle>
            <CardDescription>
              Export, import, or delete your health tracking data. This is the
              only way to back up your data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Export Data</Label>
              <p className="text-sm text-gray-600">
                Download all your data as a JSON file. This is your primary
                backup method.
              </p>
              <Button
                onClick={handleExportData}
                disabled={isExporting}
                className="w-full"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Exporting..." : "Export All Data"}
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Import Data</Label>
              <p className="text-sm text-gray-600">
                Upload a previously exported JSON file to restore your data.
                This will replace all current data.
              </p>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={isImporting}
                />
                <Button
                  disabled={isImporting}
                  className="w-full"
                  variant="outline"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isImporting ? "Importing..." : "Import Data"}
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-red-600">Danger Zone</Label>
              <p className="text-sm text-gray-600">
                Permanently delete all your health tracking data. This cannot be
                undone.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full"
                    disabled={isClearing}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete All Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      all your foods and symptoms data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearAllData}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete Everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        {/* Database Reset */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Reset
            </CardTitle>
            <CardDescription>
              Reset your database if you&apos;re experiencing issues after an app
              update.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  When to use this:
                </h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  <li>• Getting database errors after an app update</li>
                  <li>• &quot;Primary key&quot; or &quot;schema&quot; related errors</li>
                  <li>• App won&apos;t load due to database issues</li>
                </ul>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-900/20"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Reset Database
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Database?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will reset your database to fix any migration or
                      schema issues. All your health data will be permanently
                      deleted. Make sure to export your data first if you want
                      to keep it.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDatabaseReset}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {isResettingDatabase ? "Resetting..." : "Reset Database"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        {/* Debug Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Debug Tools
            </CardTitle>
            <CardDescription>
              Tools for testing and debugging the organic tracking system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleAddTestData}
              disabled={isAddingTest}
              className="w-full"
              variant="outline"
            >
              <TestTube className="h-4 w-4 mr-2" />
              {isAddingTest ? "Adding..." : "Add Test Organic Food"}
            </Button>
            <p className="text-sm text-gray-600">
              This will add a test meal with 2/3 organic ingredients to help you
              verify the organic tracking bars are working.
            </p>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {theme === "dark" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
              Appearance
            </CardTitle>
            <CardDescription>
              Customize the look and feel of the app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dark Mode</Label>
                <p className="text-sm text-gray-600">
                  Switch between light and dark themes.
                </p>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={checked =>
                  setTheme(checked ? "dark" : "light")
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5" />
              Account Actions
            </CardTitle>
            <CardDescription>Sign out of your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Logging out...
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to log out? You&apos;ll need to sign
                    in again to access your health data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout}>
                    Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ProtectedSettingsPage() {
  return (
    <AuthGuard>
      <SettingsPage />
    </AuthGuard>
  );
}
