import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Modal } from "./Modal"; // Import the new Modal component

// Define the structure of a saved answer (can be shared)
export type SavedAnswer = {
  id: string;
  question: string;
  answer: string;
  created_at: number; // Assuming Unix timestamp
};

// Props for the SavedAnswers component
interface SavedAnswersProps {
  savedAnswers: SavedAnswer[];
  isLoading: boolean;
  error: string | null;
  refetchAnswers: () => void; // Function to trigger a refetch
  onDelete: (id: string) => void; // Function to handle delete
}

export function SavedAnswers({
  savedAnswers,
  isLoading,
  error,
  refetchAnswers,
  onDelete,
}: SavedAnswersProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // State for modal visibility
  const [idToDelete, setIdToDelete] = useState<string | null>(null); // State to store ID for modal
  const [filterText, setFilterText] = useState(""); // State for filter input

  // Fetch initial data on mount using the passed-in function
  useEffect(() => {
    refetchAnswers();
  }, [refetchAnswers]); // Rerun if refetch function identity changes (shouldn't often)

  const copyLink = (id: string) => {
    const link = `${window.location.origin}/answer/${id}`;
    navigator.clipboard
      .writeText(link)
      .then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy link: ", err);
      });
  };

  // Opens the modal and stores the ID
  const openDeleteConfirmation = (id: string) => {
    setIdToDelete(id);
    setShowDeleteModal(true);
  };

  // Closes the modal and resets state
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setIdToDelete(null);
    setDeletingId(null); // Ensure deleting spinner stops if modal is cancelled
  };

  // Handles the actual delete logic when confirmed in the modal
  const confirmDelete = async () => {
    if (!idToDelete) return;

    setDeletingId(idToDelete); // Show spinner on button
    try {
      await onDelete(idToDelete); // Call the prop function
      closeDeleteModal(); // Close modal on success
    } catch (err) {
      console.error("Deletion failed:", err);
      // Keep modal open on error? Or close and show error elsewhere?
      // For now, let's keep it open and rely on the spinner stopping
      // Parent component might show a global error message
      setDeletingId(null); // Stop spinner on error
      // Optionally: Add a state here to show error *within* the modal
    }
  };

  // Filter answers based on filterText (case-insensitive)
  const filteredAnswers = savedAnswers.filter((answer) =>
    answer.question.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <>
      <aside className="h-full p-4 flex flex-col bg-gray-50 dark:bg-slate-800 border-l border-gray-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
        <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100 flex-shrink-0">
          Saved Answers
        </h2>
        {/* Filter Input */}
        <div className="p-2 border-b border-slate-300 dark:border-slate-700">
          <input
            type="text"
            placeholder="Filter answers..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <div className="flex-grow overflow-y-auto pr-2">
          {isLoading && (
            <div className="flex justify-center items-center h-full">
              <svg
                className="animate-spin h-6 w-6 text-orange-500"
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
            </div>
          )}
          {error && (
            <div
              className="p-3 text-sm text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-lg"
              role="alert"
            >
              <span className="font-medium">Error loading:</span> {error}
            </div>
          )}
          {!isLoading &&
            !error &&
            (filteredAnswers.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm italic text-center mt-4">
                {filterText
                  ? "No matching answers found."
                  : "No answers saved yet."}
              </p>
            ) : (
              <ul className="space-y-2 pt-4">
                {filteredAnswers.map((item) => (
                  <li
                    key={item.id}
                    className="group flex items-center justify-between rounded-md bg-white dark:bg-slate-700 p-2 shadow-sm hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors duration-150"
                  >
                    <Link
                      to={`/answer/${item.id}`}
                      className="flex-grow text-sm text-blue-600 dark:text-orange-400 hover:underline truncate mr-2"
                      title={item.question}
                    >
                      {item.question}
                    </Link>
                    <div className="flex-shrink-0 flex items-center space-x-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity duration-150">
                      <button
                        onClick={() => copyLink(item.id)}
                        title="Copy share link"
                        className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 focus:outline-none focus:ring-1 ring-orange-500 rounded-md cursor-pointer"
                        disabled={!!deletingId}
                      >
                        {copiedId === item.id ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-cf-accent-green"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z"
                            />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => openDeleteConfirmation(item.id)}
                        title="Delete answer"
                        className={`p-1 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 focus:outline-none focus:ring-1 ring-red-500 rounded-md cursor-pointer ${
                          deletingId === item.id ? "opacity-50" : ""
                        }`}
                        disabled={!!deletingId}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                          />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ))}
        </div>
      </aside>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        title="Confirm Deletion"
        confirmText="Delete"
        onConfirm={confirmDelete}
        isConfirming={!!deletingId}
      >
        <p>
          Are you sure you want to delete this saved answer?{" "}
          <span className="block mt-2">This action cannot be undone.</span>
        </p>
      </Modal>
    </>
  );
}
