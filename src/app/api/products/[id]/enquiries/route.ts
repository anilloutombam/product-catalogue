import { submitEnquiry } from "@/server/enquiries";

export const runtime = "nodejs";

const maximumBodyBytes = 16_384;

class BodyTooLargeError extends Error {}

async function readBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError("Request body is missing.");

  const decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0;
  let text = "";
  try {
    for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
      size += chunk.value.byteLength;
      if (size > maximumBodyBytes) {
        void reader.cancel().catch(() => {});
        throw new BodyTooLargeError();
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally {
    reader.releaseLock();
  }
}

function errorResponse(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    return errorResponse(415, "UNSUPPORTED_MEDIA_TYPE", "Send the enquiry as JSON.");
  }

  let input;
  try {
    input = await readBody(request);
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      return errorResponse(413, "ENQUIRY_TOO_LARGE", "Shorten your message and try again.");
    }
    return errorResponse(400, "INVALID_JSON", "The enquiry could not be read. Please try again.");
  }

  const { id } = await params;
  const { status, body } = await submitEnquiry(id, input);
  return Response.json(body, { status });
}
