import {
  // json is from react-router-dom
  useLoaderData,
  useParams,
  isRouteErrorResponse,
  useRouteError,
  Link,
} from "react-router";
// Remove json/SerializeFrom imports from adapter
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { MarkdownDisplay } from "../components/MarkdownDisplay";

// Define the structure for a single answer from the API
type AnswerData = {
  id: string;
  question: string;
  answer: string;
  created_at: number;
};

// Type for the data returned by the loader
type LoaderData = {
  answer: AnswerData;
};

type ApiSingleResponse = {
  success: boolean;
  answer?: AnswerData;
  error?: string;
  details?: string;
};

// Loader function to fetch data for a specific answer
export async function clientLoader({
  params,
  request,
}: LoaderFunctionArgs): Promise<LoaderData> {
  const id = params.id;
  if (!id) {
    throw new Response("Missing answer ID", { status: 400 });
  }

  // Construct full API URL using the request's origin
  const origin = new URL(request.url).origin;
  const apiUrl = `${origin}/api/answer/${id}`;
  console.log("Fetching answer from:", apiUrl); // Log the full URL

  try {
    const response = await fetch(apiUrl);
    // Use unknown and type guard for safety
    const data = (await response.json()) as unknown;

    // Define a type guard to check the structure
    const isApiSingleResponse = (obj: unknown): obj is ApiSingleResponse => {
      return (
        typeof obj === "object" &&
        obj !== null &&
        "success" in obj &&
        typeof obj.success === "boolean" &&
        (!("answer" in obj) ||
          (typeof obj.answer === "object" && obj.answer !== null)) && // Check if answer exists and is object
        (!("error" in obj) || typeof obj.error === "string") &&
        (!("details" in obj) || typeof obj.details === "string")
      );
    };

    if (!isApiSingleResponse(data)) {
      throw new Error("Invalid API response structure");
    }

    if (!response.ok || !data.success || !data.answer) {
      throw new Response(data.error || data.details || "Answer not found", {
        status: response.status === 404 ? 404 : 500,
      });
    }

    // Return the plain object - React Router handles serialization
    return { answer: data.answer };
  } catch (error) {
    console.error(`Failed to load answer ${id}:`, error);
    if (error instanceof Response) throw error;
    throw new Response("Failed to load answer data", { status: 500 });
  }
}

export function HydrateFallback() {
  return <div>Loading...</div>;
}

// Meta function using the defined LoaderData type
// Pass the loader type directly to the MetaFunction generic
export const meta: MetaFunction<typeof clientLoader> = ({ data }) => {
  // data should now be correctly typed as LoaderData | undefined
  const questionSnippet = data?.answer?.question
    ? data.answer.question.substring(0, 50) +
      (data.answer.question.length > 50 ? "..." : "")
    : "Shared Answer";
  return [{ title: questionSnippet }];
};

// Component using the defined LoaderData type
export default function AnswerDetail() {
  const { answer } = useLoaderData() as LoaderData;

  return (
    <div>
      {" "}
      {/* Base color from body */}
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 py-4 px-6 flex items-center justify-between mb-6 shadow-sm fixed top-0 left-0 right-0 z-10">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          AutoRAG UI
        </h1>
      </header>
      <div className="pt-24 container mx-auto p-6">
        {" "}
        {/* Added container/padding here */}
        <Link
          to="/"
          className="text-orange-600 dark:text-orange-400 hover:underline mb-6 block cursor-pointer"
        >
          &larr; Back to Ask
        </Link>
        <div className="bg-white dark:bg-slate-800 shadow overflow-hidden sm:rounded-lg border border-gray-200 dark:border-slate-700 max-w-none mb-6">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-slate-700">
            <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-slate-100 not-prose">
              Saved Question
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
              {answer.question}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 shadow overflow-hidden sm:rounded-lg border border-gray-200 dark:border-slate-700 max-w-none">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-slate-700">
            <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-slate-100 not-prose">
              Saved Answer
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <MarkdownDisplay markdown={answer.answer} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Error boundary specific to this route
export function ErrorBoundary() {
  const error = useRouteError();
  const params = useParams();

  let status = 500;
  let message = "An unexpected error occurred.";

  if (isRouteErrorResponse(error)) {
    status = error.status;
    message = error.data || error.statusText;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div>
      {" "}
      {/* Base color from body */}
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 py-4 px-6 flex items-center justify-between mb-6 shadow-sm fixed top-0 left-0 right-0 z-10">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          AutoRAG UI
        </h1>
      </header>
      <div className="pt-24 container mx-auto p-6 text-center">
        <Link
          to="/"
          className="text-orange-600 dark:text-orange-400 hover:underline mb-6 block cursor-pointer"
        >
          &larr; Back to Ask
        </Link>
        <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
          Error {status}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-2">
          Could not load answer for ID: {params.id ?? "Unknown"}
        </p>
        <p className="text-red-500 dark:text-red-400 italic">{message}</p>
      </div>
    </div>
  );
}
