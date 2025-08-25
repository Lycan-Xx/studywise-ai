import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Play } from "lucide-react";
import { NotePreview } from "@/components/test/NotePreview";

const mockTests = [
  {
    id: "1",
    title: "History Test 1",
    subject: "History",
    createdDate: "2024-01-15",
    questionCount: 15,
    gradient: "from-green-600 to-green-700",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=128&q=80",
    notes: "Lorem Ipsum Text:\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.\n\nExcepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.\n\nNemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.\n\nThe text is a standard Lorem Ipsum placeholder text used in design and typography to demonstrate the visual form of a document or a typeface without relying on meaningful content. It's derived from Cicero's \"de Finibus Bonorum et Malorum\" (The Extremes of Good and Evil), written in 45 BC."
  },
  {
    id: "2",
    title: "Math Test 2",
    subject: "Math",
    createdDate: "2024-01-16",
    questionCount: 20,
    gradient: "from-orange-400 to-orange-500",
    image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=128&q=80",
    notes: "Mathematics Study Notes:\n\nAlgebra fundamentals including linear equations, quadratic formulas, and polynomial operations. Key concepts include solving for unknown variables, graphing linear functions, and understanding the relationship between algebraic expressions and their geometric representations.\n\nCalculus basics covering derivatives and integrals. The derivative represents the rate of change of a function, while integrals calculate the area under curves. These concepts are fundamental to understanding motion, optimization problems, and advanced mathematical modeling."
  },
  {
    id: "3",
    title: "Science Test 3",
    subject: "Science",
    createdDate: "2024-01-17",
    questionCount: 18,
    gradient: "from-green-400 to-green-500",
    image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=128&q=80",
    notes: "Biology and Chemistry Notes:\n\nCell structure and function: Prokaryotic vs eukaryotic cells, organelles and their functions, cell membrane transport mechanisms. The mitochondria is the powerhouse of the cell, responsible for ATP production through cellular respiration.\n\nChemical bonding: Ionic, covalent, and metallic bonds. Understanding electron configuration and how atoms interact to form compounds. The periodic table organization helps predict element properties and bonding behavior."
  }
];

export default function Library() {
  const [selectedTest, setSelectedTest] = useState<string | null>(null);

  const handleTestClick = (testId: string) => {
    setSelectedTest(testId);
  };

  const handleStartTest = (testId: string) => {
    // Start test directly from card
    setSelectedTest(testId);
  };

  const handleDeleteTest = (testId: string) => {
    // TODO: Delete test from backend/storage
    console.log("Deleting test:", testId);
  };

  // Helper function to get first few words from notes
  const getNotesPreview = (notes: string) => {
    const words = notes.split(' ').slice(0, 8).join(' ');
    return words.length < notes.length ? `${words}...` : words;
  };

  const handleSaveNotes = (testId: string, notes: string) => {
    // TODO: Save notes to backend/storage
    console.log("Saving notes for test:", testId, notes);
  };

  const selectedTestData = selectedTest ? mockTests.find(test => test.id === selectedTest) : null;

  // Show NotePreview if a test is selected
  if (selectedTestData) {
    return (
      <NotePreview
        testId={selectedTestData.id}
        title={selectedTestData.title}
        subject={selectedTestData.subject}
        initialNotes={selectedTestData.notes}
        onClose={() => setSelectedTest(null)}
        onSave={handleSaveNotes}
      />
    );
  }

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
            onClick={() => handleTestClick(test.id)}
          >
            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-studywise-gray-900 mb-2 text-lg" data-testid={`text-test-title-${test.id}`}>
                  {test.title}
                </h3>
                <p className="text-sm text-studywise-gray-600 mb-2 line-clamp-2" data-testid={`text-test-notes-${test.id}`}>
                  {getNotesPreview(test.notes)}
                </p>
                <p className="text-xs text-studywise-gray-500 mb-1" data-testid={`text-test-date-${test.id}`}>
                  Created on {test.createdDate}
                </p>
                <p className="text-xs text-studywise-gray-500" data-testid={`text-question-count-${test.id}`}>
                  {test.questionCount} questions
                </p>
              </div>

              <div className="flex gap-2 pt-4 border-t border-studywise-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTest(test.id);
                  }}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 p-2"
                  data-testid={`button-delete-test-${test.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartTest(test.id);
                  }}
                  className="flex-1 border-primary text-primary hover:bg-blue-50 hover:border-blue-600 flex items-center gap-2"
                  data-testid={`button-start-test-${test.id}`}
                >
                  <Play className="w-4 h-4" />
                  Start Test
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
