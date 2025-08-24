import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

const mockTests = [
  {
    id: "1",
    title: "History Test 1",
    subject: "History",
    createdDate: "2024-01-15",
    questionCount: 15,
    gradient: "from-green-600 to-green-700",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=128&q=80",
    bgColor: "bg-green-100",
    textColor: "text-green-800"
  },
  {
    id: "2",
    title: "Math Test 2",
    subject: "Math",
    createdDate: "2024-01-16",
    questionCount: 20,
    gradient: "from-orange-400 to-orange-500",
    image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=128&q=80",
    bgColor: "bg-orange-100",
    textColor: "text-orange-800"
  },
  {
    id: "3",
    title: "Science Test 3",
    subject: "Science",
    createdDate: "2024-01-17",
    questionCount: 18,
    gradient: "from-green-400 to-green-500",
    image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=128&q=80",
    bgColor: "bg-green-100",
    textColor: "text-green-800"
  }
];

export default function Library() {
  const handleStartTest = (testId: string) => {
    // TODO: Navigate to test taking interface
    console.log("Starting test:", testId);
  };

  const handleCreateNew = () => {
    // TODO: Navigate to create new test flow
    console.log("Creating new test");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-studywise-gray-900 mb-2" data-testid="text-library-title">
            My Tests
          </h1>
      </div>
      
      {/* Test Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="grid-tests">
        {mockTests.map((test) => (
          <Card 
            key={test.id}
            className="shadow-sm border-studywise-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            data-testid={`card-test-${test.id}`}
          >
            <div className={`h-32 bg-gradient-to-br ${test.gradient} flex items-center justify-center`}>
              <img 
                src={test.image} 
                alt={`${test.subject} study materials`} 
                className="w-full h-full object-cover opacity-90"
                data-testid={`img-test-${test.id}`}
              />
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold text-studywise-gray-900 mb-1" data-testid={`text-test-title-${test.id}`}>
                {test.title}
              </h3>
              <p className="text-sm text-studywise-gray-500" data-testid={`text-test-date-${test.id}`}>
                Created on {test.createdDate}
              </p>
              <div className="mt-3 flex justify-between items-center">
                <span className={`text-xs ${test.bgColor} ${test.textColor} px-2 py-1 rounded-full`} data-testid={`text-question-count-${test.id}`}>
                  {test.questionCount} questions
                </span>
                <button 
                  onClick={() => handleStartTest(test.id)}
                  className="text-primary hover:text-blue-600 text-sm font-medium"
                  data-testid={`button-start-test-${test.id}`}
                >
                  Start Test
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
