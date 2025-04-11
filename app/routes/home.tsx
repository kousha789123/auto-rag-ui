import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { Route } from "./+types/home";
import { SavedAnswers, type SavedAnswer } from "../components/SavedAnswers";
import { MarkdownDisplay } from "../components/MarkdownDisplay";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "AutoRAG UI" },
    { name: "description", content: "Ask questions to your AutoRAG!" },
  ];
}

// Define the expected API response structure
type AskApiResponse = {
  answer?: string;
};

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [savedAnswersList, setSavedAnswersList] = useState<SavedAnswer[]>([]);
  const [isSidebarLoading, setIsSidebarLoading] = useState(true);
  const [sidebarError, setSidebarError] = useState<string | null>(null);

  const [deleteError, setDeleteError] = useState<string | null>(null);

  // State for search suggestions
  const [suggestions, setSuggestions] = useState<SavedAnswer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionBoxRef = useRef<HTMLDivElement>(null); // Ref for handling clicks outside

  const navigate = useNavigate();

  const fetchSavedAnswers = useCallback(async () => {
    setIsSidebarLoading(true);
    setSidebarError(null);
    let realAnswers: SavedAnswer[] = []; // Store real answers temporarily
    try {
      const response = await fetch("/api/saved");
      type SavedListApiResponse = {
        success: boolean;
        answers?: SavedAnswer[];
        error?: string;
        details?: string;
      };
      const data: SavedListApiResponse = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(
          data.error || data.details || "Failed to fetch saved answers"
        );
      }
      realAnswers = data.answers || []; // Store fetched answers
      setSavedAnswersList(realAnswers); // Set initial real answers
    } catch (err) {
      setSidebarError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error fetching saved answers:", err);
    } finally {
      setIsSidebarLoading(false);
    }
  }, []); // Keep dependency array empty

  useEffect(() => {
    fetchSavedAnswers();
  }, [fetchSavedAnswers]);

  // Handle clicks outside the suggestion box to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionBoxRef.current &&
        !suggestionBoxRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [suggestionBoxRef]);

  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setQuestion(query);

    if (query.trim().length > 1) {
      // Start suggesting after 1 character
      const filteredSuggestions = savedAnswersList
        .filter((item) =>
          item.question.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 5); // Limit to 5 suggestions

      setSuggestions(filteredSuggestions);
      setShowSuggestions(filteredSuggestions.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (id: string) => {
    setShowSuggestions(false);
    setSuggestions([]);
    navigate(`/answer/${id}`);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question.trim()) return;
    setShowSuggestions(false); // Hide suggestions on submit

    setLoading(true);
    setError(null);
    setAnswer(null); // Clear previous answer
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: question }),
      });

      if (!response.ok) {
        let errorMessage = `API Error: ${response.statusText}`;
        try {
          // Try to get a more specific error from the body if possible
          const errorData = await response.json();
          // Type guard to safely access properties
          if (typeof errorData === "object" && errorData !== null) {
            errorMessage =
              (errorData as any).error ||
              (errorData as any).details ||
              errorMessage;
          }
        } catch (e) {
          // Ignore if body isn't JSON or empty
        }
        throw new Error(errorMessage);
      }

      // Expect simple JSON response
      const result = (await response.json()) as AskApiResponse;
      setAnswer(result.answer || "No answer found.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred."
      );
      console.error("Error fetching answer:", err); // Reverted console message
      setAnswer(null); // Clear partial answer on error
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!question || !answer) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch("/api/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question, answer }),
      });

      if (!response.ok) {
        // Try to parse error JSON, default to status text
        let errorMessage = `Failed to save: ${response.statusText}`;
        try {
          const errorData = (await response.json()) as { error?: string };
          if (errorData?.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // JSON parsing failed or no 'error' property, stick with statusText
          console.warn("Could not parse error JSON from /api/save", e);
        }
        throw new Error(errorMessage);
      }

      // Optionally handle success response if needed
      // const result = await response.json();
      setSaveSuccess(true);
      // Trigger refresh of saved answers list after successful save
      fetchSavedAnswers();
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Could not save the answer."
      );
      console.error("Error saving answer:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAnswer = async (id: string) => {
    setDeleteError(null); // Clear previous delete errors
    try {
      const response = await fetch(`/api/delete/${id}`, {
        method: "DELETE",
      });

      // Define expected response type
      type DeleteApiResponse = {
        success: boolean;
        error?: string;
        details?: string;
      };
      const result = (await response.json()) as DeleteApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || result.details || "Failed to delete answer"
        );
      }

      // Refresh the list after successful deletion
      fetchSavedAnswers();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unknown error occurred while deleting.";
      setDeleteError(errorMessage);
      console.error("Error deleting answer:", err);
      // Re-throw or handle as needed, maybe show a more prominent error
      throw err; // Re-throw so the SavedAnswers component knows it failed
    }
  };

  return (
    <div className="flex h-screen">
      {/* --- Sidebar --- */}
      <div className="flex-shrink-0 w-64 md:w-72 lg:w-80 border-r border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
        <SavedAnswers
          savedAnswers={savedAnswersList}
          isLoading={isSidebarLoading}
          error={sidebarError}
          refetchAnswers={fetchSavedAnswers}
          onDelete={handleDeleteAnswer}
        />
        {deleteError && (
          <div className="p-2 text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 m-2 rounded">
            Delete Error: {deleteError}
          </div>
        )}
      </div>

      {/* --- Main Content Area --- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 py-4 px-6 flex items-center justify-between shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            AutoRAG UI
          </h1>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-gray-50 dark:bg-slate-900">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-slate-900 dark:text-slate-100">
              Ask AutoRAG
            </h2>

            <form onSubmit={handleSubmit} className="mb-8">
              <div className="relative" ref={suggestionBoxRef}>
                <input
                  id="question-input"
                  type="text"
                  autoComplete="off"
                  className="w-full px-4 py-3 pr-20 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 ring-orange-500 placeholder-gray-500 dark:placeholder-slate-400 text-slate-900 dark:text-slate-100"
                  placeholder="Ask about your documents..."
                  value={question}
                  onChange={handleQuestionChange}
                  onFocus={() =>
                    question.trim().length > 1 &&
                    suggestions.length > 0 &&
                    setShowSuggestions(true)
                  }
                  disabled={loading}
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute inset-y-0 right-0 flex items-center justify-center px-5 text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 ring-offset-2 ring-orange-500 focus:ring-offset-white dark:focus:ring-offset-slate-700 rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                  aria-label="Submit question"
                >
                  {loading ? (
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-6 h-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                      />
                    </svg>
                  )}
                </button>

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((item) => (
                      <li
                        key={item.id}
                        className="px-4 py-2 text-sm text-slate-900 dark:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-600 cursor-pointer truncate"
                        onClick={() => handleSuggestionClick(item.id)}
                        title={item.question}
                      >
                        {item.question}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </form>

            {/* Error Display */}
            {error && (
              <div
                className="mb-6 p-4 text-sm text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-lg"
                role="alert"
              >
                <span className="font-medium">Error Asking:</span> {error}
              </div>
            )}

            {/* Answer Display Card */}
            {answer && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700 overflow-hidden max-w-none">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-slate-700">
                  <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-slate-100 not-prose">
                    Answer
                  </h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <MarkdownDisplay markdown={answer} />
                </div>
                {/* Save Section */}
                <div className="not-prose border-t border-gray-200 dark:border-slate-700 px-4 py-4 sm:px-6 bg-gray-50 dark:bg-slate-800/50">
                  {saveSuccess ? (
                    <p className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-1.5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Answer saved successfully!
                    </p>
                  ) : (
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600 hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 ring-orange-500 focus:ring-offset-gray-50 dark:focus:ring-offset-slate-800/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                    >
                      {isSaving ? (
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="-ml-1 mr-2 h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a1 1 0 011 1v7a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                        </svg>
                      )}
                      {isSaving ? "Saving..." : "Save Answer"}
                    </button>
                  )}
                  {saveError && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                      Error saving: {saveError}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
