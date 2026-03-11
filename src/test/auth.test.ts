import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { login, signup, getProfile, ApiError } from "@/services/api";

// ─── Helpers ──────────────────────────────────────────────────────────
const MOCK_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock";

const mockProfile = {
  uid: "550e8400-e29b-41d4-a716-446655440000",
  username: "john_doe",
  email: "john@example.com",
  disabled: false,
};

const mockTokenResponse = {
  access_token: MOCK_TOKEN,
  token_type: "bearer",
};

const mockSignupResponse = {
  message: "User signed up successfully.",
  id: "550e8400-e29b-41d4-a716-446655440000",
};

// ─── Login ────────────────────────────────────────────────────────────
describe("login()", () => {
  beforeEach(() => {
    vi.spyOn(global, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends form-encoded body to /auth/token", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockTokenResponse), { status: 200 })
    );

    await login("john_doe", "SecurePass123!");

    expect(fetch).toHaveBeenCalledOnce();
    const [url, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/auth/token");
    expect(options.method).toBe("POST");
    // Content-Type must be form-encoded (not JSON) for OAuth2 compatibility
    const headers = options.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
    // Body must be URLSearchParams
    expect(options.body).toBeInstanceOf(URLSearchParams);
    const body = options.body as URLSearchParams;
    expect(body.get("username")).toBe("john_doe");
    expect(body.get("password")).toBe("SecurePass123!");
  });

  it("returns access_token and token_type on success", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockTokenResponse), { status: 200 })
    );

    const result = await login("john_doe", "SecurePass123!");
    expect(result.access_token).toBe(MOCK_TOKEN);
    expect(result.token_type).toBe("bearer");
  });

  it("throws ApiError with AUTHENTICATION_ERROR on invalid credentials", async () => {
    const errorBody = {
      error: {
        code: "AUTHENTICATION_ERROR",
        message: "Invalid credentials",
        request_id: "req-123",
      },
    };
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(errorBody), { status: 401 })
    );

    const err = await login("john_doe", "WrongPassword").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(401);
    expect(err.code).toBe("AUTHENTICATION_ERROR");
    expect(err.message).toBe("Invalid credentials");
  });

  it("throws a generic error when the network fails", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(login("john_doe", "SecurePass123!")).rejects.toThrow(
      "Failed to fetch"
    );
  });

  it("throws ApiError on 404 (user not found)", async () => {
    const errorBody = {
      error: { code: "NOT_FOUND", message: "User not found" },
    };
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(errorBody), { status: 404 })
    );

    await expect(login("ghost", "pass")).rejects.toMatchObject({
      status: 404,
      code: "NOT_FOUND",
    });
  });
});

// ─── Signup ───────────────────────────────────────────────────────────
describe("signup()", () => {
  beforeEach(() => {
    vi.spyOn(global, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends JSON body to /users/signup", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockSignupResponse), { status: 200 })
    );

    await signup({ username: "john_doe", email: "john@example.com", password: "SecurePass123!" });

    expect(fetch).toHaveBeenCalledOnce();
    const [url, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/users/signup");
    expect(options.method).toBe("POST");
    const headers = options.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/json");
    const body = JSON.parse(options.body as string);
    expect(body.username).toBe("john_doe");
    expect(body.email).toBe("john@example.com");
    expect(body.password).toBe("SecurePass123!");
  });

  it("returns message and id on success", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockSignupResponse), { status: 200 })
    );

    const result = await signup({
      username: "john_doe",
      email: "john@example.com",
      password: "SecurePass123!",
    });
    expect(result.message).toBe("User signed up successfully.");
    expect(result.id).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("throws ApiError on 422 (duplicate user)", async () => {
    const errorBody = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Username already exists",
      },
    };
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(errorBody), { status: 422 })
    );

    await expect(
      signup({ username: "existing", email: "x@x.com", password: "Abcd1!aaa" })
    ).rejects.toMatchObject({ status: 422, code: "VALIDATION_ERROR" });
  });
});

// ─── getProfile ───────────────────────────────────────────────────────
describe("getProfile()", () => {
  beforeEach(() => {
    vi.spyOn(global, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends Bearer token to /users/me", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockProfile), { status: 200 })
    );

    await getProfile(MOCK_TOKEN);

    const [url, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/users/me");
    const headers = options.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe(`Bearer ${MOCK_TOKEN}`);
  });

  it("returns user profile on success", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockProfile), { status: 200 })
    );

    const profile = await getProfile(MOCK_TOKEN);
    expect(profile.uid).toBe(mockProfile.uid);
    expect(profile.username).toBe("john_doe");
    expect(profile.email).toBe("john@example.com");
    expect(profile.disabled).toBe(false);
  });

  it("throws ApiError with status 401 on expired token", async () => {
    const errorBody = {
      error: { code: "AUTHENTICATION_ERROR", message: "Token expired" },
    };
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(errorBody), { status: 401 })
    );

    await expect(getProfile("expired-token")).rejects.toMatchObject({
      status: 401,
    });
  });
});

// ─── ApiError ─────────────────────────────────────────────────────────
describe("ApiError", () => {
  it("parses structured error body correctly", () => {
    const body = {
      error: {
        code: "TEST_CODE",
        message: "Test message",
        request_id: "req-abc",
        detail: "Technical detail",
        context: { key: "value" },
      },
    };
    const err = new ApiError(400, body);
    expect(err.message).toBe("Test message");
    expect(err.code).toBe("TEST_CODE");
    expect(err.requestId).toBe("req-abc");
    expect(err.detail).toBe("Technical detail");
    expect(err.status).toBe(400);
  });

  it("uses fallback values for missing fields", () => {
    const err = new ApiError(500, {});
    expect(err.message).toBe("Request failed");
    expect(err.code).toBe("UNKNOWN");
    expect(err.status).toBe(500);
  });

  it("handles non-JSON error body gracefully", () => {
    const err = new ApiError(503, null);
    expect(err.message).toBe("Request failed");
    expect(err.code).toBe("UNKNOWN");
  });
});
