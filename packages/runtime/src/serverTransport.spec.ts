import { afterEach, describe, expect, it, vi } from "vitest";
import { setRuntimeMode } from "@terajs/reactivity";
import {
  createFetchServerFunctionTransport,
  createServerFunctionRequestHandler,
  server,
  type ServerFunctionCall
} from "./index";

describe("server transport", () => {
  afterEach(() => {
    setRuntimeMode("client");
  });

  it("sends server calls through the configured fetch transport", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      return new Response(JSON.stringify({
        ok: true,
        result: {
          echoed: init?.body ? JSON.parse(String(init.body)) : null
        }
      }), {
        status: 200,
        headers: {
          "content-type": "application/json"
        }
      });
    });

    const transport = createFetchServerFunctionTransport({
      endpoint: "/_terajs/server",
      fetch: fetchMock,
      headers: {
        "x-terajs": "1"
      }
    });

    await expect(transport.invoke({ id: "getUser", args: ["42"] })).resolves.toEqual({
      echoed: {
        id: "getUser",
        args: ["42"]
      }
    });
    expect(fetchMock).toHaveBeenCalledWith("/_terajs/server", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({
        "content-type": "application/json",
        "x-terajs": "1"
      })
    }));
  });

  it("handles HTTP requests by dispatching registered server functions", async () => {
    setRuntimeMode("server");
    const getTenant = server(async (name: string, context) => {
      return `${name}:${context.request?.cookies?.tenant}:${String(context.locals?.region)}`;
    }, { id: "getTenant" });

    expect(getTenant.id).toBe("getTenant");

    const handler = createServerFunctionRequestHandler({
      context: {
        locals: {
          region: "us"
        }
      }
    });

    const response = await handler(new Request("https://terajs.local/_terajs/server", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: "tenant=docs"
      },
      body: JSON.stringify({
        id: "getTenant",
        args: ["router"]
      } satisfies ServerFunctionCall)
    }));

    await expect(response.json()).resolves.toEqual({
      ok: true,
      result: "router:docs:us"
    });
  });

  it("returns a structured not-found response for unknown server functions", async () => {
    setRuntimeMode("server");
    const handler = createServerFunctionRequestHandler();
    const response = await handler(new Request("https://terajs.local/_terajs/server", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        id: "missing",
        args: []
      } satisfies ServerFunctionCall)
    }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: {
        message: 'Unknown server function "missing".'
      }
    });
  });
});