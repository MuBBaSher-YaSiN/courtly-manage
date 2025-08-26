import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Settings, Save, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SystemSetting {
  key: string;
  value: any;
}

const SystemSettings = () => {
  const [settings, setSettings] = useState<Record<string, any>>({
    court_name: 'Superior Court of Justice',
    court_address: '123 Justice Avenue, Legal City, LC 12345',
    court_phone: '(555) 123-4567',
    court_email: 'contact@court.gov',
    enable_notifications: true,
    auto_assign_cases: false,
    max_file_size_mb: 10,
    session_timeout_hours: 8,
    maintenance_mode: false,
    allow_public_registration: true,
    require_email_verification: false,
    backup_frequency_hours: 24
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');

      if (error) throw error;

      // Convert array of settings to object
      const settingsObj: Record<string, any> = {};
      data?.forEach(setting => {
        settingsObj[setting.key] = setting.value;
      });
      
      setSettings(prev => ({ ...prev, ...settingsObj }));
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Info',
        description: 'Using default settings (no custom settings found)',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Convert settings object to array format for database
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key,
        value
      }));

      // Delete existing settings and insert new ones
      await supabase.from('system_settings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      const { error } = await supabase
        .from('system_settings')
        .insert(settingsArray);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'System settings updated successfully',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="w-8 h-8" />
            System Settings
          </h1>
          <p className="text-muted-foreground">Configure system-wide settings and preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSettings} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className={`w-4 h-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Court Information */}
        <Card>
          <CardHeader>
            <CardTitle>Court Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="court_name">Court Name</Label>
              <Input
                id="court_name"
                value={settings.court_name || ''}
                onChange={(e) => handleInputChange('court_name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="court_address">Court Address</Label>
              <Textarea
                id="court_address"
                value={settings.court_address || ''}
                onChange={(e) => handleInputChange('court_address', e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="court_phone">Court Phone</Label>
              <Input
                id="court_phone"
                value={settings.court_phone || ''}
                onChange={(e) => handleInputChange('court_phone', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="court_email">Court Email</Label>
              <Input
                id="court_email"
                type="email"
                value={settings.court_email || ''}
                onChange={(e) => handleInputChange('court_email', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* System Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>System Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enable_notifications">Enable Notifications</Label>
                <p className="text-sm text-muted-foreground">Send system notifications to users</p>
              </div>
              <Switch
                id="enable_notifications"
                checked={settings.enable_notifications || false}
                onCheckedChange={(checked) => handleInputChange('enable_notifications', checked)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto_assign_cases">Auto-assign Cases</Label>
                <p className="text-sm text-muted-foreground">Automatically assign cases to judges</p>
              </div>
              <Switch
                id="auto_assign_cases"
                checked={settings.auto_assign_cases || false}
                onCheckedChange={(checked) => handleInputChange('auto_assign_cases', checked)}
              />
            </div>

            <Separator />

            <div>
              <Label htmlFor="max_file_size_mb">Max File Size (MB)</Label>
              <Input
                id="max_file_size_mb"
                type="number"
                min="1"
                max="100"
                value={settings.max_file_size_mb || 10}
                onChange={(e) => handleInputChange('max_file_size_mb', parseInt(e.target.value))}
              />
            </div>
            
            <div>
              <Label htmlFor="session_timeout_hours">Session Timeout (Hours)</Label>
              <Input
                id="session_timeout_hours"
                type="number"
                min="1"
                max="24"
                value={settings.session_timeout_hours || 8}
                onChange={(e) => handleInputChange('session_timeout_hours', parseInt(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Security & Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="maintenance_mode">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">Restrict access to admins only</p>
              </div>
              <Switch
                id="maintenance_mode"
                checked={settings.maintenance_mode || false}
                onCheckedChange={(checked) => handleInputChange('maintenance_mode', checked)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="allow_public_registration">Public Registration</Label>
                <p className="text-sm text-muted-foreground">Allow public users to register</p>
              </div>
              <Switch
                id="allow_public_registration"
                checked={settings.allow_public_registration !== false}
                onCheckedChange={(checked) => handleInputChange('allow_public_registration', checked)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="require_email_verification">Email Verification</Label>
                <p className="text-sm text-muted-foreground">Require email verification for new accounts</p>
              </div>
              <Switch
                id="require_email_verification"
                checked={settings.require_email_verification || false}
                onCheckedChange={(checked) => handleInputChange('require_email_verification', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* System Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle>System Maintenance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="backup_frequency_hours">Backup Frequency (Hours)</Label>
              <Input
                id="backup_frequency_hours"
                type="number"
                min="1"
                max="168"
                value={settings.backup_frequency_hours || 24}
                onChange={(e) => handleInputChange('backup_frequency_hours', parseInt(e.target.value))}
              />
              <p className="text-sm text-muted-foreground mt-1">How often to perform system backups</p>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>System Status</Label>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Database:</span>
                  <span className="text-green-600">Connected</span>
                </div>
                <div className="flex justify-between">
                  <span>Storage:</span>
                  <span className="text-green-600">Available</span>
                </div>
                <div className="flex justify-between">
                  <span>Auth:</span>
                  <span className="text-green-600">Active</span>
                </div>
                <div className="flex justify-between">
                  <span>Notifications:</span>
                  <span className={settings.enable_notifications ? 'text-green-600' : 'text-red-600'}>
                    {settings.enable_notifications ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemSettings;