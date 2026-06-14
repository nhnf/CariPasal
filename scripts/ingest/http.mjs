import { createHash } from "node:crypto";
import { spawn } from "node:child_process";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36";

export async function requestText(url, extraHeaders = {}) {
  return request(url, {
    method: "GET",
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      ...extraHeaders,
    },
    responseType: "text",
  });
}

export async function requestJson(url, options = {}) {
  return request(url, {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(options.headers ?? {}),
    },
    body: options.body,
    responseType: "json",
  });
}

export function sha256(input) {
  return createHash("sha256").update(input).digest("hex");
}

export function getResponseIssue(response) {
  if (!response) {
    return "Tidak ada respons dari server.";
  }

  if (isLikelyChallengePage(response)) {
    return `Halaman diblok atau challenge terdeteksi (${response.statusCode || 0}, ${response.transport}).`;
  }

  if (response.statusCode < 200 || response.statusCode >= 300) {
    return `HTTP ${response.statusCode} dari ${response.transport}.`;
  }

  return null;
}

function isLikelyChallengePage(response) {
  const sample = String(response.body ?? "")
    .slice(0, 4000)
    .toLowerCase();
  const serverHeader = String(response.headers?.server ?? "").toLowerCase();

  return (
    sample.includes("just a moment") ||
    sample.includes("cf-browser-verification") ||
    sample.includes("attention required") ||
    sample.includes("enable javascript and cookies") ||
    (response.statusCode === 403 && serverHeader.includes("cloudflare"))
  );
}

async function request(
  url,
  {
    method = "GET",
    headers = {},
    body,
    responseType = "text",
  },
) {
  const normalizedHeaders = {
    "User-Agent": USER_AGENT,
    ...headers,
  };
  const serializedBody =
    body === undefined || body === null
      ? undefined
      : typeof body === "string"
        ? body
        : JSON.stringify(body);
  const fetchAttempts = responseType === "json" ? 2 : 5;
  let lastError;

  for (let attempt = 1; attempt <= fetchAttempts; attempt += 1) {
    try {
      const response = await requestWithFetch(url, {
        method,
        headers: normalizedHeaders,
        body: serializedBody,
        responseType,
      });

      if (responseType === "json" && shouldRetryWithCurl(response)) {
        return requestWithCurlJson(url, {
          method,
          headers: normalizedHeaders,
          body: serializedBody,
          responseType,
        });
      }

      return response;
    } catch (error) {
      lastError = error;

      if (!isRetryableNetworkError(error) || attempt === fetchAttempts) {
        break;
      }

      await wait(attempt * 750);
    }
  }

  if (responseType === "json" && canUseCurl()) {
    return requestWithCurlJson(url, {
      method,
      headers: normalizedHeaders,
      body: serializedBody,
      responseType,
    });
  }

  throw decorateTransportError(url, method, lastError);
}

async function requestWithFetch(url, { method, headers, body, responseType }) {
  const response = await fetch(url, {
    method,
    headers,
    body,
    redirect: "follow",
  });
  const rawBody = await response.text();

  return {
    statusCode: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body: rawBody,
    hash: sha256(rawBody),
    data: responseType === "json" ? parseJsonBody(rawBody, url) : undefined,
    transport: "fetch",
  };
}

async function requestWithCurlJson(url, { method, headers, body, responseType }) {
  const args = ["-sS", "-L", "-X", method];

  for (const [name, value] of Object.entries(headers)) {
    args.push("-H", `${name}: ${value}`);
  }

  if (body !== undefined) {
    args.push("--data-binary", "@-");
  }

  args.push("-w", "\nTRAE_HTTP_STATUS:%{http_code}", url);

  const result = await runCurlCommand(
    process.platform === "win32" ? "curl.exe" : "curl",
    args,
    body,
  );
  const marker = "\nTRAE_HTTP_STATUS:";
  const markerIndex = result.stdout.lastIndexOf(marker);

  if (markerIndex === -1) {
    throw new Error(`Respons curl dari ${url} tidak memuat status HTTP.`);
  }

  const rawBody = result.stdout.slice(0, markerIndex);
  const statusCode = Number(result.stdout.slice(markerIndex + marker.length).trim());

  return {
    statusCode,
    headers: {},
    body: rawBody,
    hash: sha256(rawBody),
    data: responseType === "json" ? parseJsonBody(rawBody, url) : undefined,
    transport: "curl",
  };
}

function runCurlCommand(command, args, body) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: "pipe",
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(new Error(`curl gagal dijalankan: ${error.message}`));
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`curl gagal (${code}): ${stderr.trim() || "unknown error"}`));
        return;
      }

      resolve({ stdout, stderr });
    });

    if (body !== undefined) {
      child.stdin.write(body);
    }

    child.stdin.end();
  });
}

function shouldRetryWithCurl(response) {
  return canUseCurl() && isLikelyChallengePage(response);
}

function canUseCurl() {
  return process.platform === "win32" || process.platform === "linux" || process.platform === "darwin";
}

function isRetryableNetworkError(error) {
  const code =
    error && typeof error === "object" && "cause" in error && error.cause
      ? error.cause.code
      : undefined;

  return [
    "ECONNRESET",
    "ETIMEDOUT",
    "EAI_AGAIN",
    "UND_ERR_SOCKET",
    "UND_ERR_CONNECT_TIMEOUT",
  ].includes(code);
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function parseJsonBody(rawBody, url) {
  if (!rawBody) {
    return null;
  }

  try {
    return JSON.parse(rawBody);
  } catch (error) {
    throw new Error(
      `Respons JSON dari ${url} tidak valid: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  }
}

function decorateTransportError(url, method, error) {
  if (error instanceof Error) {
    return new Error(`HTTP ${method} ${url} gagal: ${error.message}`);
  }

  return new Error(`HTTP ${method} ${url} gagal.`);
}
