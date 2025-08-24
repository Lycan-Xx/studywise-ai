import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Filter, Share } from "lucide-react";

const mockResults = [
  {
    id: "1",
    score: 85,
    timeTaken: "25 min",
    subject: "History",
    date: "2024-01-15",
    color: "text-green-600",
    bgColor: "bg-green-500",
    badgeColor: "bg-blue-100 text-blue-800"
  },
  {
    id: "2",
    score: 70,
    timeTaken: "30 min",
    subject: "Math",
    date: "2024-01-10",
    color: "text-yellow-600",
    bgColor: "bg-yellow-500",
    badgeColor: "bg-orange-100 text-orange-800"
  },
  {
    id: "3",
    score: 90,
    timeTaken: "20 min",
    subject: "Science",
    date: "2024-01-05",
    color: "text-green-600",
    bgColor: "bg-green-500",
    badgeColor: "bg-green-100 text-green-800"
  },
  {
    id: "4",
    score: 60,
    timeTaken: "40 min",
    subject: "English",
    date: "2023-12-20",
    color: "text-yellow-600",
    bgColor: "bg-yellow-500",
    badgeColor: "bg-gray-100 text-gray-800"
  },
  {
    id: "5",
    score: 75,
    timeTaken: "35 min",
    subject: "Geography",
    date: "2023-12-15",
    color: "text-green-600",
    bgColor: "bg-green-500",
    badgeColor: "bg-blue-100 text-blue-800"
  }
];

export default function Results() {
  const handleViewDetails = (resultId: string) => {
    // TODO: Navigate to detailed results view
    console.log("Viewing details for result:", resultId);
  };

  const handleExport = () => {
    // TODO: Export results functionality
    console.log("Exporting results");
  };

  const handleFilter = () => {
    // TODO: Filter results functionality
    console.log("Filtering results");
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-studywise-gray-900 mb-2" data-testid="text-results-title">
          Results
        </h1>
        <p className="text-studywise-gray-600" data-testid="text-results-subtitle">
          Track your quiz performance and identify areas for improvement
        </p>
      </div>
      
      {/* Results Table */}
      <Card className="shadow-sm border-studywise-gray-200 overflow-hidden" data-testid="card-results-table">
        <div className="px-6 py-4 border-b border-studywise-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-studywise-gray-900" data-testid="text-table-title">
              Recent Test Results
            </h2>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExport}
                className="px-3 py-1 text-sm"
                data-testid="button-export"
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleFilter}
                className="px-3 py-1 text-sm"
                data-testid="button-filter"
              >
                <Filter className="w-4 h-4 mr-1" />
                Filter
              </Button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="table-results">
            <thead className="bg-studywise-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-studywise-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-studywise-gray-500 uppercase tracking-wider">
                  Time Taken
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-studywise-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-studywise-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-studywise-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-studywise-gray-200">
              {mockResults.map((result) => (
                <tr key={result.id} className="hover:bg-studywise-gray-50" data-testid={`row-result-${result.id}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-lg font-semibold ${result.color}`} data-testid={`text-score-${result.id}`}>
                        {result.score}%
                      </span>
                      <div className="ml-2 w-16 bg-studywise-gray-200 rounded-full h-2">
                        <div 
                          className={`${result.bgColor} h-2 rounded-full`} 
                          style={{ width: `${result.score}%` }}
                          data-testid={`progress-bar-${result.id}`}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-studywise-gray-900" data-testid={`text-time-${result.id}`}>
                    {result.timeTaken}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium ${result.badgeColor} rounded-full`} data-testid={`text-subject-${result.id}`}>
                      {result.subject}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-studywise-gray-500" data-testid={`text-date-${result.id}`}>
                    {result.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button 
                      onClick={() => handleViewDetails(result.id)}
                      className="text-primary hover:text-blue-600 mr-3"
                      data-testid={`button-view-details-${result.id}`}
                    >
                      View Details
                    </button>
                    <button 
                      className="text-studywise-gray-400 hover:text-studywise-gray-600"
                      data-testid={`button-share-${result.id}`}
                    >
                      <Share className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
