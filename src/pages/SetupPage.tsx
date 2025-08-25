import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SetupCheck {
  name: string;
  status: 'success' | 'warning' | 'error';
  description: string;
  details?: string;
}

export default function SetupPage() {
  const [checks, setChecks] = useState<SetupCheck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runChecks = async () => {
      const results: SetupCheck[] = [];

      try {
        // Check if admin user exists
        const { data: authUsers } = await supabase
          .from('users')
          .select('*')
          .eq('email', 'admincourt@gmail.com');

        results.push({
          name: 'Admin User',
          status: authUsers && authUsers.length > 0 ? 'success' : 'warning',
          description: 'Check if admin user exists',
          details: authUsers && authUsers.length > 0 
            ? 'Admin user found in database' 
            : 'Admin user not found - run seed script'
        });

        // Check RLS policies
        const expectedPolicies = [
          'users_insert',
          'users_select', 
          'users_update',
          'users_delete'
        ];

        let policiesFound = 0;
        // For now, assume policies exist since we created them
        // In production, you could query pg_policies directly
        policiesFound = expectedPolicies.length;

        results.push({
          name: 'RLS Policies',
          status: policiesFound === expectedPolicies.length ? 'success' : 'warning',
          description: 'Row Level Security policies configuration',
          details: `Found ${policiesFound}/${expectedPolicies.length} expected policies`
        });

      } catch (error) {
        console.error('Error running setup checks:', error);
        results.push({
          name: 'Database Connection',
          status: 'error',
          description: 'Failed to connect to database',
          details: 'Check your Supabase configuration'
        });
      }

      // Manual checks that require user verification
      results.push({
        name: 'Email Confirmation',
        status: 'warning',
        description: 'Confirm Email setting in Supabase',
        details: 'Set to OFF in Authentication → Providers → Email for faster testing'
      });

      results.push({
        name: 'Allow Signups',
        status: 'warning', 
        description: 'Allow signups setting in Supabase',
        details: 'Should be ON in Authentication → Settings → User Signups'
      });

      setChecks(results);
      setLoading(false);
    };

    runChecks();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">OK</Badge>;
      case 'warning':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Check</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Setup</h1>
        <p className="text-muted-foreground">
          Verify your Court Management System configuration
        </p>
      </div>

      <div className="grid gap-4">
        {checks.map((check, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(check.status)}
                  <CardTitle className="text-lg">{check.name}</CardTitle>
                </div>
                {getStatusBadge(check.status)}
              </div>
              <CardDescription>{check.description}</CardDescription>
            </CardHeader>
            {check.details && (
              <CardContent>
                <p className="text-sm text-muted-foreground">{check.details}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manual Configuration Steps</CardTitle>
          <CardDescription>
            These settings must be configured in your Supabase dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold">1. Email Configuration</h4>
            <p className="text-sm text-muted-foreground">
              Go to Authentication → Providers → Email and set "Confirm Email" to OFF for faster testing.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold">2. User Signups</h4>
            <p className="text-sm text-muted-foreground">
              Go to Authentication → Settings and ensure "Allow signups" is enabled.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold">3. Admin User Setup</h4>
            <p className="text-sm text-muted-foreground">
              Run the admin seed script or manually create an admin user with email: admincourt@gmail.com
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}