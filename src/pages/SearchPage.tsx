import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Eye, Download, Calendar, FileText, Scale } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SearchResult {
  id: string;
  type: 'case' | 'document' | 'hearing';
  title: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Warning',
        description: 'Please enter a search term',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const results: SearchResult[] = [];

    try {
      // Search cases
      if (activeTab === 'all' || activeTab === 'cases') {
        const { data: cases, error: casesError } = await supabase
          .from('cases')
          .select('*')
          .or(`case_number.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`);

        if (casesError) throw casesError;

        cases?.forEach(case_ => {
          results.push({
            id: case_.id,
            type: 'case',
            title: `${case_.case_number} - ${case_.title}`,
            description: `${case_.type} case with ${case_.status} status`,
            metadata: {
              case_number: case_.case_number,
              type: case_.type,
              status: case_.status,
              priority: case_.priority,
              filed_at: case_.filed_at
            },
            created_at: case_.created_at
          });
        });
      }

      // Search documents
      if (activeTab === 'all' || activeTab === 'documents') {
        const { data: documents, error: docsError } = await supabase
          .from('documents')
          .select('*, cases(case_number, title)')
          .ilike('original_name', `%${searchQuery}%`);

        if (docsError) throw docsError;

        documents?.forEach(doc => {
          results.push({
            id: doc.id,
            type: 'document',
            title: doc.original_name,
            description: `Document in case ${doc.cases?.case_number || 'Unknown'} - ${doc.cases?.title || ''}`,
            metadata: {
              file_name: doc.original_name,
              mime_type: doc.mime_type,
              size: doc.size,
              uploaded_at: doc.uploaded_at,
              visibility: doc.visibility
            },
            created_at: doc.created_at
          });
        });
      }

      // Search hearings
      if (activeTab === 'all' || activeTab === 'hearings') {
        const { data: hearings, error: hearingsError } = await supabase
          .from('hearings')
          .select('*, cases(case_number, title)')
          .or(`courtroom.ilike.%${searchQuery}%,notes.ilike.%${searchQuery}%`);

        if (hearingsError) throw hearingsError;

        hearings?.forEach(hearing => {
          results.push({
            id: hearing.id,
            type: 'hearing',
            title: `Hearing in ${hearing.courtroom}`,
            description: `${hearing.cases?.case_number || 'Unknown'} - ${hearing.cases?.title || ''} on ${new Date(hearing.start_at).toLocaleDateString()}`,
            metadata: {
              courtroom: hearing.courtroom,
              start_at: hearing.start_at,
              end_at: hearing.end_at,
              status: hearing.status,
              notes: hearing.notes
            },
            created_at: hearing.created_at
          });
        });
      }

      setSearchResults(results);

      if (results.length === 0) {
        toast({
          title: 'No results',
          description: 'No matching records found for your search query',
        });
      }

    } catch (error) {
      console.error('Error searching:', error);
      toast({
        title: 'Error',
        description: 'Failed to perform search',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'case': return <Scale className="w-5 h-5 text-blue-500" />;
      case 'document': return <FileText className="w-5 h-5 text-green-500" />;
      case 'hearing': return <Calendar className="w-5 h-5 text-orange-500" />;
      default: return <Search className="w-5 h-5" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'case': return 'bg-blue-100 text-blue-800';
      case 'document': return 'bg-green-100 text-green-800';
      case 'hearing': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredResults = searchResults.filter(result => 
    activeTab === 'all' || 
    (activeTab === 'cases' && result.type === 'case') ||
    (activeTab === 'documents' && result.type === 'document') ||
    (activeTab === 'hearings' && result.type === 'hearing')
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Search className="w-8 h-8" />
          Search Court Records
        </h1>
        <p className="text-muted-foreground">Search cases, documents, and hearings</p>
      </div>

      {/* Search Input */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by case number, title, document name, courtroom..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {!loading && 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Results ({searchResults.length})</TabsTrigger>
            <TabsTrigger value="cases">
              Cases ({searchResults.filter(r => r.type === 'case').length})
            </TabsTrigger>
            <TabsTrigger value="documents">
              Documents ({searchResults.filter(r => r.type === 'document').length})
            </TabsTrigger>
            <TabsTrigger value="hearings">
              Hearings ({searchResults.filter(r => r.type === 'hearing').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredResults.map((result) => (
              <Card key={`${result.type}-${result.id}`} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getResultIcon(result.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{result.title}</h3>
                          <Badge className={getTypeBadgeColor(result.type)}>
                            {result.type.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {result.description}
                        </p>
                        
                        {/* Metadata */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
                          {Object.entries(result.metadata).slice(0, 6).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium capitalize">{key.replace('_', ' ')}:</span>{' '}
                              {typeof value === 'string' && value.includes('T') ? 
                                new Date(value).toLocaleDateString() : 
                                String(value)
                              }
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="ghost" size="sm" title="View details">
                        <Eye className="w-4 h-4" />
                      </Button>
                      {result.type === 'document' && (
                        <Button variant="ghost" size="sm" title="Download">
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}

      {/* Empty State */}
      {searchResults.length === 0 && searchQuery && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or search in a different category.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Default State */}
      {searchResults.length === 0 && !searchQuery && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Search Court Records</h3>
            <p className="text-muted-foreground mb-4">
              Enter a search term above to find cases, documents, and hearings.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-left">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  Cases
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Case numbers (e.g., CASE-001)</li>
                  <li>• Case titles</li>
                  <li>• Case types</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Documents
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Document names</li>
                  <li>• File types</li>
                  <li>• Content (if indexed)</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Hearings
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Courtroom names</li>
                  <li>• Hearing notes</li>
                  <li>• Dates and times</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SearchPage;