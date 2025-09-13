import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useResultsStore } from "@/stores";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

export default function Results() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { testResults, loadResults, recentResults, totalTestsTaken, averageScore, bestScore } = useResultsStore();

  useEffect(() => {
    console.log('Results page mounted, loading results...');
    loadResults();
  }, [loadResults]);

  // Reload results when user changes
  useEffect(() => {
    if (user) {
      loadResults();
    }
  }, [user, loadResults]);

  // Force re-render when testResults change
  useEffect(() => {
    console.log('Results updated:', testResults.length, 'total results');
    console.log('Recent results:', recentResults.length);
    if (testResults.length > 0) {
      console.log('First test result:', testResults[0].testTitle, testResults[0].score, testResults[0].completedAt);
    }
    if (recentResults.length > 0) {
      console.log('First recent result:', recentResults[0].testTitle, recentResults[0].score);
    }
  }, [testResults, recentResults]);

  const handleViewDetails = (resultId: string) => {
    // TODO: Navigate to detailed results view
    console.log("Viewing details for result:", resultId);
  };

  return (
    <div>
      {/* Summary Stats */}
      {testResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card className="border-studywise-gray-200">
            <CardContent className="p-4 md:p-6 text-center">
              <div className="text-2xl md:text-3xl font-bold text-studywise-gray-900">{totalTestsTaken}</div>
              <div className="text-sm text-studywise-gray-600">Tests Taken</div>
            </CardContent>
          </Card>

          <Card className="border-studywise-gray-200">
            <CardContent className="p-4 md:p-6 text-center">
              <div className="text-2xl md:text-3xl font-bold text-studywise-gray-900">{averageScore}%</div>
              <div className="text-sm text-studywise-gray-600">Average Score</div>
            </CardContent>
          </Card>

          <Card className="border-studywise-gray-200">
            <CardContent className="p-4 md:p-6 text-center">
              <div className="text-2xl md:text-3xl font-bold text-studywise-gray-900">{bestScore}%</div>
              <div className="text-sm text-studywise-gray-600">Best Score</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results Table */}
      <Card className="shadow-sm border-studywise-gray-200 overflow-hidden" data-testid="card-results-table">
        <div className="px-6 py-4 border-b border-studywise-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-studywise-gray-900" data-testid="text-table-title">
              Recent Test Scores
            </h2>
          </div>
        </div>

        {testResults.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-studywise-gray-600 mb-4">No test results yet. Take your first test to see results here!</p>
            <Button 
              onClick={() => setLocation('/dashboard')}
              size="lg"
              className="bg-primary hover:bg-primary/90"
            >
              Create Your First Test
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="table-results">
              <thead className="bg-studywise-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-studywise-gray-500 uppercase tracking-wider">
                    Test Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-studywise-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-studywise-gray-500 uppercase tracking-wider">
                    Time Taken
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
                {recentResults.map((result) => (
                  <tr key={result.id} className="hover:bg-studywise-gray-50" data-testid={`row-result-${result.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-studywise-gray-900">{result.testTitle}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg font-semibold text-studywise-gray-900" data-testid={`text-score-${result.id}`}>
                          {result.score}%
                        </span>
                        <div className="ml-2 w-16 bg-studywise-gray-200 rounded-full h-2">
                          <div
                            className="bg-black h-2 rounded-full"
                            style={{ width: `${result.score}%` }}
                            data-testid={`progress-bar-${result.id}`}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-studywise-gray-900" data-testid={`text-time-${result.id}`}>
                      {result.timeSpent ? Math.round(result.timeSpent / 60) + ' min' : '--'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-studywise-gray-500" data-testid={`text-date-${result.id}`}>
                      {new Date(result.completedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button 
                        onClick={() => handleViewDetails(result.id)}
                        className="text-primary hover:text-blue-600"
                        data-testid={`button-view-details-${result.id}`}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
