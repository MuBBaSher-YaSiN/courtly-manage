import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface BreadcrumbItem {
  name: string;
  path: string;
  icon?: React.ComponentType<any>;
}

export function Breadcrumbs() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(segment => segment !== '');

  const breadcrumbItems: BreadcrumbItem[] = [
    { name: 'Home', path: '/', icon: Home }
  ];

  let currentPath = '';
  pathSegments.forEach(segment => {
    currentPath += `/${segment}`;
    const name = segment.charAt(0).toUpperCase() + segment.slice(1);
    breadcrumbItems.push({ name, path: currentPath });
  });

  if (breadcrumbItems.length === 1) return null;

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
      {breadcrumbItems.map((item, index) => (
        <div key={item.path} className="flex items-center space-x-2">
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          <Link
            to={item.path}
            className={`flex items-center space-x-1 hover:text-foreground ${
              index === breadcrumbItems.length - 1 ? 'text-foreground font-medium' : ''
            }`}
          >
            {index === 0 && item.icon && <item.icon className="h-4 w-4" />}
            <span>{item.name}</span>
          </Link>
        </div>
      ))}
    </nav>
  );
}