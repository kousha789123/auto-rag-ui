import { createRequestHandler } from "react-router";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const reactRouterHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);

    // API Route Handling
    if (url.pathname.startsWith("/api/")) {
      // Handle /api/ask endpoint
      if (url.pathname === "/api/ask" && request.method === "POST") {
        try {
          const { query } = (await request.json()) as { query?: string };
          console.log("Received /api/ask request with query:", query);

          if (!query || typeof query !== "string") {
            return Response.json(
              { error: "Invalid query provided" },
              { status: 400 }
            );
          }

          // --- IMPORTANT: Replace "my-autorag" with your actual AutoRAG instance name ---
          const autoRagInstanceName = "my-autorag";
          console.log("Using AutoRAG instance:", autoRagInstanceName);
          // ---------------------------------------------------------------------------

          const aiResponse = await env.AI.autorag(autoRagInstanceName).aiSearch(
            {
              query: query,
              // Optional: Add other parameters like model, rewrite_query etc. if needed
              // model: "@cf/meta/llama-3.1-8b-instruct",
              // rewrite_query: true,
            } // Removed stream: true and type casts
          );
          console.log(
            "Full response from AI.autorag.aiSearch:",
            JSON.stringify(aiResponse, null, 2)
          );

          // Extract the response text directly based on logs
          let answer: string | undefined | null = null;
          if (
            aiResponse &&
            typeof aiResponse === "object" &&
            "response" in aiResponse &&
            typeof aiResponse.response === "string"
          ) {
            answer = aiResponse.response;
          }
          console.log("Extracted answer:", answer);

          return Response.json({
            answer: answer ?? "No specific answer generated.",
          });
        } catch (error) {
          console.error("Error inside /api/ask handler:", error);
          console.error("Error processing /api/ask:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Internal Server Error";
          return Response.json(
            { error: "Failed to process request", details: errorMessage },
            { status: 500 }
          );
        }
      }

      // Handle /api/save endpoint
      else if (url.pathname === "/api/save" && request.method === "POST") {
        try {
          const { question, answer } = (await request.json()) as {
            question?: string;
            answer?: string;
          };

          if (
            !question ||
            typeof question !== "string" ||
            !answer ||
            typeof answer !== "string"
          ) {
            return Response.json(
              { error: "Invalid question or answer provided" },
              { status: 400 }
            );
          }

          const id = crypto.randomUUID(); // Generate unique ID
          const db = env.DB;

          const stmt = db.prepare(
            "INSERT INTO saved_answers (id, question, answer) VALUES (?, ?, ?)"
            // Note: created_at uses DEFAULT value from schema
          );

          await stmt.bind(id, question, answer).run();

          // Return success response with the new ID
          return Response.json({ success: true, id: id }, { status: 201 });
        } catch (error) {
          console.error("Error processing /api/save:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Internal Server Error";
          // Check for potential unique constraint violation (e.g., duplicate ID, unlikely with UUID)
          if (errorMessage.includes("UNIQUE constraint failed")) {
            return Response.json(
              { error: "Database constraint error.", details: errorMessage },
              { status: 409 }
            ); // Conflict
          }
          return Response.json(
            { error: "Failed to save answer", details: errorMessage },
            { status: 500 }
          );
        }
      }

      // Handle /api/saved endpoint
      else if (url.pathname === "/api/saved" && request.method === "GET") {
        try {
          const db = env.DB;
          const stmt = db.prepare(
            "SELECT id, question, answer, created_at FROM saved_answers ORDER BY created_at DESC"
          );
          const { results } = await stmt.all();

          return Response.json({ success: true, answers: results ?? [] });
        } catch (error) {
          console.error("Error processing /api/saved:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Internal Server Error";
          return Response.json(
            { error: "Failed to fetch saved answers", details: errorMessage },
            { status: 500 }
          );
        }
      }

      // Handle /api/answer/:id endpoint
      else if (
        url.pathname.startsWith("/api/answer/") &&
        request.method === "GET"
      ) {
        let requestedId: string | undefined;
        try {
          requestedId = url.pathname.split("/")[3]; // Extract ID from /api/answer/{id}
          console.log(`Received /api/answer request for ID: ${requestedId}`); // Log ID

          if (!requestedId || typeof requestedId !== "string") {
            return Response.json(
              { error: "Invalid or missing ID" },
              { status: 400 }
            );
          }

          const db = env.DB;
          const stmt = db.prepare(
            "SELECT id, question, answer, created_at FROM saved_answers WHERE id = ?"
          );

          const answerData = await stmt.bind(requestedId).first();
          console.log(
            `DB result for ID ${requestedId}:`,
            JSON.stringify(answerData, null, 2)
          ); // Log DB result

          if (!answerData) {
            console.log(`Answer not found in DB for ID: ${requestedId}`); // Log not found case
            return Response.json(
              { error: "Answer not found" },
              { status: 404 }
            );
          }

          // Log success case
          console.log(`Found answer data for ID: ${requestedId}`);
          return Response.json({ success: true, answer: answerData });
        } catch (error) {
          console.error(
            `Error processing /api/answer/${requestedId ?? "unknown"}:`,
            error
          );
          const errorMessage =
            error instanceof Error ? error.message : "Internal Server Error";
          return Response.json(
            { error: "Failed to fetch answer", details: errorMessage },
            { status: 500 }
          );
        }
      }

      // Handle /api/delete/:id endpoint (NEW)
      else if (
        url.pathname.startsWith("/api/delete/") &&
        request.method === "DELETE"
      ) {
        let requestedId: string | undefined;
        try {
          requestedId = url.pathname.split("/")[3]; // Extract ID from /api/delete/{id}
          console.log(`Received /api/delete request for ID: ${requestedId}`);

          if (!requestedId || typeof requestedId !== "string") {
            return Response.json(
              { success: false, error: "Invalid or missing ID" },
              { status: 400 }
            );
          }

          const db = env.DB;
          const stmt = db.prepare("DELETE FROM saved_answers WHERE id = ?");

          // Execute the delete operation
          const info = await stmt.bind(requestedId).run();

          // D1 run() result includes meta like changes and success
          console.log(
            `Delete result for ID ${requestedId}:`,
            JSON.stringify(info, null, 2)
          );

          if (!info.success) {
            // This usually indicates a DB-level error, not just "not found"
            console.error(
              `D1 Delete failed for ID ${requestedId}:`,
              info.meta?.last_row_id,
              info.meta?.changes
            ); // Log potential meta info
            throw new Error("Database operation failed during delete.");
          }

          // Check if any row was actually deleted (optional, but good practice)
          if (info.meta?.changes === 0) {
            console.log(`No answer found with ID ${requestedId} to delete.`);
            // You could return 404 here, but often DELETE is idempotent
            // Returning success even if nothing was deleted is common.
            // return Response.json({ success: false, error: "Answer not found" }, { status: 404 });
          }

          console.log(
            `Successfully processed delete request for ID: ${requestedId}`
          );
          return Response.json({ success: true }); // Return simple success
        } catch (error) {
          console.error(
            `Error processing /api/delete/${requestedId ?? "unknown"}:`,
            error
          );
          const errorMessage =
            error instanceof Error ? error.message : "Internal Server Error";
          return Response.json(
            {
              success: false,
              error: "Failed to delete answer",
              details: errorMessage,
            },
            { status: 500 }
          );
        }
      }

      // Handle other /api/ routes
      return Response.json(
        { error: "API endpoint not found" },
        { status: 404 }
      );
    }

    // Non-API requests: Pass to React Router handler
    return reactRouterHandler(request, {
      cloudflare: { env, ctx },
    });
  },
} satisfies ExportedHandler<Env>;
