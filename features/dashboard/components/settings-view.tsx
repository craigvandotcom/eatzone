'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { User, Download, Upload, Trash2, LogOut, TestTube } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useToast } from '@/components/ui/use-toast';
import { exportAllData, importAllData, clearAllData, addFood } from '@/lib/db';
import { logger } from '@/lib/utils/logger';

interface SettingsViewProps {
  user?: any;
  isExporting: boolean;
  setIsExporting: (value: boolean) => void;
  isImporting: boolean;
  setIsImporting: (value: boolean) => void;
  isClearing: boolean;
  setIsClearing: (value: boolean) => void;
  isAddingTest: boolean;
  setIsAddingTest: (value: boolean) => void;
  isLoggingOut: boolean;
  handleLogout: () => void;
}

export function SettingsView({
  user,
  isExporting,
  setIsExporting,
  isImporting,
  setIsImporting,
  isClearing,
  setIsClearing,
  isAddingTest,
  setIsAddingTest,
  isLoggingOut,
  handleLogout,
}: SettingsViewProps) {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = await exportAllData();

      // Create a downloadable JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `health-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Data exported successfully',
        description: `Exported ${data.foods.length} foods and ${data.symptoms.length} symptoms.`,
      });
    } catch (error) {
      logger.error('Export failed', error);
      toast({
        title: 'Export failed',
        description:
          'There was an error exporting your data. Please try again.',
        variant: 'destructive',
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

      await importAllData(data);

      toast({
        title: 'Data imported successfully',
        description: `Imported ${data.foods?.length || 0} foods and ${
          data.symptoms?.length || 0
        } symptoms.`,
      });

      // Clear the file input
      event.target.value = '';
    } catch (error) {
      logger.error('Import failed', error);
      toast({
        title: 'Import failed',
        description:
          'There was an error importing your data. Please check the file format.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClearAllData = async () => {
    setIsClearing(true);
    try {
      await clearAllData();
      toast({
        title: 'All data cleared',
        description: 'Your health tracking data has been permanently deleted.',
      });
    } catch (error) {
      logger.error('Clear data failed', error);
      toast({
        title: 'Clear data failed',
        description: 'There was an error clearing your data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleAddTestData = async () => {
    setIsAddingTest(true);
    try {
      // Add a test food with organic and non-organic ingredients
      await addFood({
        name: 'Test Organic Meal',
        ingredients: [
          {
            name: 'organic spinach',
            organic: true,
            zone: 'green',
            group: 'Leafy Greens',
            category: 'Vegetables',
          },
          {
            name: 'organic quinoa',
            organic: true,
            zone: 'green',
            group: 'Pseudo-Grains',
            category: 'Grains & Starches',
          },
          {
            name: 'salmon',
            organic: false,
            zone: 'green',
            group: 'Wild-Caught Seafood',
            category: 'Proteins',
          },
        ],
        status: 'processed',
        notes: 'Test data to verify organic tracking',
      });

      toast({
        title: 'Test data added',
        description:
          'Added a test meal with 2/3 organic ingredients to verify the organic tracking works.',
      });
    } catch (error) {
      logger.error('Failed to add test data', error);
      toast({
        title: 'Test data failed',
        description: 'There was an error adding test data.',
        variant: 'destructive',
      });
    } finally {
      setIsAddingTest(false);
    }
  };

  return (
    <div className="space-y-6">
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
          <div className="grid grid-cols-1 gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Email</p>
              <p className="text-sm text-muted-foreground">
                {user?.email || 'Not available'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Account Created
              </p>
              <p className="text-sm text-muted-foreground">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Last Login</p>
              <p className="text-sm text-muted-foreground">N/A</p>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Privacy Reminder
            </h4>
            <p className="text-xs text-blue-700">
              Your account and all health data are stored securely with
              Supabase. Regular data exports are recommended for backup
              purposes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Export, import, or delete your health tracking data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-medium text-foreground">Export Data</p>
            <p className="text-sm text-muted-foreground mb-3">
              Download all your data as a JSON file. This is your primary backup
              method.
            </p>
            <Button
              onClick={handleExportData}
              disabled={isExporting}
              className="w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export All Data'}
            </Button>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Import Data</p>
            <p className="text-sm text-muted-foreground mb-3">
              Upload a previously exported JSON file to restore your data.
            </p>
            <div className="flex gap-2">
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
                id="import-file"
              />
              <label htmlFor="import-file">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>Choose File</span>
                </Button>
              </label>
              <Button
                onClick={() => document.getElementById('import-file')?.click()}
                disabled={isImporting}
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isImporting ? 'Importing...' : 'Import Data'}
              </Button>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Danger Zone</p>
            <p className="text-sm text-muted-foreground mb-3">
              Permanently delete all your health tracking data. This cannot be
              undone.
            </p>
            <Button
              onClick={handleClearAllData}
              disabled={isClearing}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isClearing ? 'Deleting...' : 'Delete All Data'}
            </Button>
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
            Development tools for testing functionality.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground">Test Data</p>
            <p className="text-sm text-muted-foreground mb-3">
              Add sample data to test the organic ingredient tracking feature.
            </p>
            <Button
              onClick={handleAddTestData}
              disabled={isAddingTest}
              variant="outline"
            >
              <TestTube className="h-4 w-4 mr-2" />
              {isAddingTest ? 'Adding...' : 'Add Test Data'}
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="dark-mode"
              checked={theme === 'dark'}
              onCheckedChange={checked => setTheme(checked ? 'dark' : 'light')}
            />
            <Label htmlFor="dark-mode" className="text-sm">
              Dark mode
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Account Actions
          </CardTitle>
          <CardDescription>Sign out of your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleLogout}
            disabled={isLoggingOut}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
