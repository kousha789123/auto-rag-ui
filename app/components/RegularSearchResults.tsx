import React from 'react';

interface Content {
  id: string;
  type: string;
  text: string;
}

interface SearchResult {
  file_id: string;
  filename: string;
  score: number;
  attributes: {
    timestamp: number;
  };
  content: Content[];
}

interface RegularSearchResultsProps {
  results: {
    object: string;
    search_query: string;
    data: SearchResult[];
  };
}

export function RegularSearchResults({ results }: RegularSearchResultsProps) {
  const handlePdfClick = (filename: string) => {
    // Use the current window location origin to ensure we hit the correct endpoint
    const baseUrl = window.location.origin;
    window.open(`${baseUrl}/api/pdf/${encodeURIComponent(filename)}`, '_blank');
  };

  if (!results?.data || !Array.isArray(results.data)) {
    return <div>No results available</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border-b border-gray-200 p-4 text-left font-medium text-gray-700">Filename</th>
            <th className="border-b border-gray-200 p-4 text-left font-medium text-gray-700">Content</th>
            <th className="border-b border-gray-200 p-4 text-left font-medium text-gray-700">Score</th>
          </tr>
        </thead>
        <tbody>
          {results.data.map((result, index) => (
            <tr 
              key={result.file_id || index}
              className="hover:bg-gray-50 transition-colors duration-150"
            >
              <td className="border-b border-gray-200 p-4">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePdfClick(result.filename);
                  }}
                  className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  {result.filename}
                </a>
              </td>
              <td className="border-b border-gray-200 p-4">
                <div className="text-gray-600">
                  {result.content[0]?.text?.substring(0, 200)}...
                </div>
              </td>
              <td className="border-b border-gray-200 p-4">
                <div className="text-gray-600">
                  {(result.score * 100).toFixed(2)}%
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}