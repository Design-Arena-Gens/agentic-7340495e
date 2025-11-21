import { getEnv } from "./env";

const GRAPH_BASE = "https://graph.facebook.com/v19.0";

interface GraphError {
  message: string;
  type: string;
  code: number;
  error_subcode?: number;
  fbtrace_id?: string;
}

interface MediaContainerResponse {
  id: string;
}

interface MediaPublishResponse {
  id: string;
}

export interface PublishedMedia {
  mediaId: string;
  permalink?: string;
}

function payloadHasError(
  payload: unknown
): payload is { error: GraphError; [key: string]: unknown } {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof (payload as { error?: unknown }).error === "object" &&
    (payload as { error?: unknown }).error !== null
  );
}

async function callGraph<T>(
  url: string,
  params: Record<string, string>
): Promise<T> {
  const { INSTAGRAM_ACCESS_TOKEN } = getEnv();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      access_token: INSTAGRAM_ACCESS_TOKEN,
      ...params
    })
  });

  const payload = (await response.json()) as unknown;

  if (!response.ok || payloadHasError(payload)) {
    const errorDetails = payloadHasError(payload) ? payload.error : undefined;
    console.error("Instagram Graph API error", {
      url,
      params,
      error: errorDetails
    });
    throw new Error(
      errorDetails?.message ?? `Graph API request failed: ${response.status}`
    );
  }

  return payload as T;
}

async function getMediaPermalink(mediaId: string): Promise<string | undefined> {
  const { INSTAGRAM_ACCESS_TOKEN } = getEnv();
  const params = new URLSearchParams({
    access_token: INSTAGRAM_ACCESS_TOKEN,
    fields: "permalink"
  });

  const response = await fetch(
    `${GRAPH_BASE}/${mediaId}?${params.toString()}`,
    { method: "GET" }
  );

  const payload = (await response.json()) as
    | { permalink?: string }
    | { error: GraphError };

  if ("error" in payload) {
    console.error("Failed to fetch media permalink", payload.error);
    return undefined;
  }

  return payload.permalink;
}

export async function publishImageToInstagram(
  imageUrl: string,
  caption: string
): Promise<PublishedMedia> {
  const { INSTAGRAM_BUSINESS_ACCOUNT_ID } = getEnv();
  const container = await callGraph<MediaContainerResponse>(
    `${GRAPH_BASE}/${INSTAGRAM_BUSINESS_ACCOUNT_ID}/media`,
    {
      image_url: imageUrl,
      caption
    }
  );

  const published = await callGraph<MediaPublishResponse>(
    `${GRAPH_BASE}/${INSTAGRAM_BUSINESS_ACCOUNT_ID}/media_publish`,
    {
      creation_id: container.id
    }
  );

  const permalink = await getMediaPermalink(published.id);

  return {
    mediaId: published.id,
    permalink
  };
}
