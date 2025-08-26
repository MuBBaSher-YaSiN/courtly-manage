import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale, Users, Shield, Clock } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Court Management System</h1>
          <p className="text-xl text-muted-foreground">
            Streamlining justice with modern technology
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="w-5 h-5" />
                Case Management
              </CardTitle>
              <CardDescription>
                Comprehensive tools for managing legal cases from filing to resolution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li>• Digital case filing and tracking</li>
                <li>• Document management and storage</li>
                <li>• Automated workflow processing</li>
                <li>• Real-time case status updates</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Multi-Role Access
              </CardTitle>
              <CardDescription>
                Role-based access for different court personnel and users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li>• Judge dashboard and case assignments</li>
                <li>• Attorney case management tools</li>
                <li>• Clerk administrative functions</li>
                <li>• Public access to case information</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security & Privacy
              </CardTitle>
              <CardDescription>
                Enterprise-grade security protecting sensitive legal data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li>• Row-level security policies</li>
                <li>• Encrypted document storage</li>
                <li>• Audit trails and logging</li>
                <li>• Role-based access control</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Scheduling & Notifications
              </CardTitle>
              <CardDescription>
                Efficient court scheduling and communication systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li>• Automated hearing scheduling</li>
                <li>• Real-time notifications</li>
                <li>• Calendar integration</li>
                <li>• Reminder systems</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>About This System</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Our Court Management System is designed to modernize judicial operations by providing 
              a comprehensive digital platform for managing court cases, schedules, documents, and 
              communications. Built with modern web technologies and following best practices for 
              security and accessibility.
            </p>
            <p className="text-muted-foreground">
              The system supports multiple user roles including judges, attorneys, court clerks, 
              and public users, each with appropriate access levels and functionality tailored to 
              their specific needs in the judicial process.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AboutPage;