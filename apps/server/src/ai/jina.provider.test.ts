import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { jinaProvider } from "./jina.provider.js";

vi.mock("../config/env.js", () => ({
  env: {
    JINA_API_KEY: "test-jina-key",
    JINA_CHAT_MODEL: "jina-vlm",
    JINA_EMBED_MODEL: "jina-embeddings-v5-text-small",
  },
}));

const request = vi.fn();
beforeEach(() => {
  request.mockReset();
  vi.stubGlobal("fetch", request);
});
afterEach(() => vi.unstubAllGlobals());

describe("Jina provider routing", () => {
  it("keeps embeddings on the Search Foundation endpoint", async () => {
    request.mockResolvedValue(new Response(JSON.stringify({ data: [{ embedding: [0.1, 0.2] }] })));

    expect(await jinaProvider.embed(["hospital policy"])).toEqual([[0.1, 0.2]]);
    expect(request.mock.calls[0][0]).toBe("https://api.jina.ai/v1/embeddings");
    expect(JSON.parse(request.mock.calls[0][1].body).model).toBe("jina-embeddings-v5-text-small");
  });

  it("sends structured text generation to the VLM endpoint", async () => {
    request.mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: '{"answer":"See the visiting policy."}' } }],
          usage: { prompt_tokens: 10, completion_tokens: 8 },
        }),
      ),
    );

    const answer = await jinaProvider.generate({
      prompt: "What are visiting hours?",
      system: "Answer only from the supplied policy.",
      schema: z.object({ answer: z.string() }),
    });

    expect(answer).toEqual({ answer: "See the visiting policy." });
    expect(request.mock.calls[0][0]).toBe("https://api-beta-vlm.jina.ai/v1/chat/completions");
    const body = JSON.parse(request.mock.calls[0][1].body);
    expect(body.model).toBe("jina-vlm");
    expect(body.messages).toHaveLength(1);
    expect(body.messages[0].role).toBe("user");
    expect(body.messages[0].content).toContain("Answer only from the supplied policy.");
    expect(jinaProvider.lastUsage().tokensUsed).toBe(18);
  });

  it("rejects generated programs rather than treating them as an answer", async () => {
    request.mockResolvedValue(
      new Response(
        JSON.stringify({ choices: [{ message: { content: '```python\nprint("answer")\n```' } }] }),
      ),
    );

    await expect(
      jinaProvider.generate({
        prompt: "What are visiting hours?",
        schema: z.object({ answer: z.string() }),
      }),
    ).rejects.toMatchObject({ statusCode: 502 });
  });
});
