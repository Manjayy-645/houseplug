import { execFileSync, spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import http from "node:http";
import { resolve } from "node:path";
const captureLabel = process.env.HOUSEPLUG_CAPTURE_LABEL;
const appDir = resolve(process.env.HOUSEPLUG_CAPTURE_APP_DIR || process.cwd());
const legacyCapture = Boolean(
  captureLabel && process.env.HOUSEPLUG_CAPTURE_LEGACY === "true",
);
import { createHmac, randomUUID } from "node:crypto";
const suffix = randomUUID().slice(0, 8),
  pg = `houseplug-qa-pg-${suffix}`,
  api = `houseplug-qa-api-${suffix}`,
  network = `houseplug-qa-${suffix}`;
const jwtSecret = "local-development-jwt-secret-at-least-32-characters",
  port = captureLabel
    ? Number(process.env.HOUSEPLUG_CAPTURE_APP_PORT || 3100)
    : 3100,
  gatewayPort = captureLabel
    ? Number(process.env.HOUSEPLUG_CAPTURE_GATEWAY_PORT || 54421)
    : 54421,
  apiPort = captureLabel
    ? Number(process.env.HOUSEPLUG_CAPTURE_API_PORT || 54423)
    : 54423;
const docker = (args, input) =>
  execFileSync("docker", ["--host=unix:///var/run/docker.sock", ...args], {
    input,
    stdio: input ? ["pipe", "pipe", "pipe"] : "pipe",
    encoding: "utf8",
  });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let server, gateway;
const token = (role, sub) => {
  const b = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
  const s =
    b({ alg: "HS256", typ: "JWT" }) +
    "." +
    b({
      role,
      sub,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
  return (
    s + "." + createHmac("sha256", jwtSecret).update(s).digest("base64url")
  );
};
const roles = {
  student: "10000000-0000-4000-8000-000000000001",
  other: "10000000-0000-4000-8000-000000000002",
  agent: "10000000-0000-4000-8000-000000000003",
  admin: "10000000-0000-4000-8000-000000000004",
};
const sessions = Object.fromEntries(
  Object.entries(roles).map(([r, id]) => [
    r,
    {
      access_token: token("authenticated", id),
      refresh_token: "local-test-refresh",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      expires_in: 3600,
      token_type: "bearer",
      user: {
        id,
        email: r + "@example.invalid",
        app_metadata: { provider: "email" },
        user_metadata: {},
      },
    },
  ]),
);
const migrations = [
  "20261111020101_houseplug_profile_and_internal_function_security.sql",
  "20261111215630_housing_truth_and_conversion.sql",
  "20261111215644_payment_fulfilment_recovery.sql",
  "20261112164925_allow_legacy_assistance_requests.sql",
];
try {
  docker(["network", "create", network]);
  docker([
    "run",
    "-d",
    "--name",
    pg,
    "--network",
    network,
    "-e",
    "POSTGRES_PASSWORD=local-test-only",
    "postgres:17-alpine@sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac",
  ]);
  for (let n = 0; n < 60; n++) {
    try {
      docker(["exec", pg, "pg_isready", "-U", "postgres"]);
      break;
    } catch {
      await wait(500);
    }
  }
  for (const file of [
    "tests/fixtures/base-schema.sql",
    "supabase/migrations/020_real_time_tracking.sql",
    "supabase/migrations/038_activity_events.sql",
    ...(legacyCapture ? [] : migrations.map((m) => "supabase/migrations/" + m)),
    legacyCapture
      ? "tests/fixtures/visual-original-seed.sql"
      : "tests/fixtures/e2e-seed.sql",
  ])
    docker(
      [
        "exec",
        "-i",
        pg,
        "psql",
        "-q",
        "-U",
        "postgres",
        "-v",
        "ON_ERROR_STOP=1",
        "--single-transaction",
      ],
      readFileSync(file),
    );
  docker([
    "run",
    "-d",
    "--name",
    api,
    "--network",
    network,
    "-p",
    `127.0.0.1:${apiPort}:3000`,
    "-e",
    `PGRST_DB_URI=postgres://postgres:local-test-only@${pg}:5432/postgres`,
    "-e",
    "PGRST_DB_ANON_ROLE=anon",
    "-e",
    `PGRST_JWT_SECRET=${jwtSecret}`,
    "postgrest/postgrest:v12.2.3@sha256:729bf65c733b73f5b52777f0e4b853f22ed73aa67a22d38269d289779b0a8401",
  ]);
  gateway = http.createServer((req, res) => {
    if (req.url.startsWith("/rest/v1")) {
      const u = new URL(req.url, `http://127.0.0.1:${apiPort}`);
      const up = http.request(
        {
          hostname: "127.0.0.1",
          port: apiPort,
          path: u.pathname.replace(/^\/rest\/v1/, "") + u.search,
          method: req.method,
          headers: { ...req.headers, host: `127.0.0.1:${apiPort}` },
        },
        (r) => {
          res.writeHead(r.statusCode, r.headers);
          r.pipe(res);
        },
      );
      up.on("error", () => {
        res.writeHead(503);
        res.end();
      });
      req.pipe(up);
      return;
    }
    if (req.url === "/auth/v1/user") {
      try {
        const [h, p, s] = req.headers.authorization
          .replace("Bearer ", "")
          .split(".");
        if (
          s !==
          createHmac("sha256", jwtSecret)
            .update(h + "." + p)
            .digest("base64url")
        )
          throw Error();
        const v = JSON.parse(Buffer.from(p, "base64url"));
        if (!Object.values(roles).includes(v.sub) || v.exp * 1000 < Date.now())
          throw Error();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            id: v.sub,
            email: "fixture@example.invalid",
            aud: "authenticated",
            role: "authenticated",
            app_metadata: { provider: "email" },
            user_metadata: {},
            created_at: "2026-01-01T00:00:00Z",
          }),
        );
        return;
      } catch {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end('{"message":"No test session"}');
        return;
      }
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise((r) => gateway.listen(gatewayPort, "127.0.0.1", r));
  const env = {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${gatewayPort}`,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: token("anon"),
    SUPABASE_SERVICE_ROLE_KEY: token("service_role"),
    HOUSING_REQUESTS_ENABLED: "true",
    HOUSING_REQUEST_HASH_KEY: "local-testing-only-key",
    HOUSING_NOTIFICATIONS_ENABLED: "false",
    HOUSING_RETENTION_ENABLED: "false",
    HOUSING_ANALYTICS_ENABLED: "true",
    RESEND_API_KEY: "",
    PAYSTACK_SECRET_KEY: "",
    VERCEL_ENV: "",
    PLAYWRIGHT_BASE_URL: `http://127.0.0.1:${port}`,
    HOUSEPLUG_TEST_SESSIONS: JSON.stringify(sessions),
  };
  if (!env.CHROMIUM_PATH && existsSync("/usr/bin/chromium"))
    env.CHROMIUM_PATH = "/usr/bin/chromium";
  const buildCode = await new Promise((resolve) => {
    const p = spawn("npm", ["run", "build"], {
      cwd: appDir,
      env,
      stdio: "inherit",
    });
    p.on("exit", resolve);
  });
  if (buildCode !== 0) throw Error("Production build failed");
  server = spawn(
    process.execPath,
    [
      resolve(appDir, "node_modules/next/dist/bin/next"),
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    { cwd: appDir, env, stdio: "inherit" },
  );
  let ready = false;
  for (let n = 0; n < 60; n++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}`);
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {}
    await wait(500);
  }
  if (!ready) throw Error("Local app did not become ready");
  const commands = captureLabel
    ? [
        ["scripts/capture-home.mjs"],
        ...(captureLabel === "restored"
          ? [["node_modules/@playwright/test/cli.js", "test"]]
          : []),
      ]
    : [["node_modules/@playwright/test/cli.js", "test"]];
  for (const args of commands) {
    const code = await new Promise((resolve) => {
      const p = spawn(process.execPath, args, { env, stdio: "inherit" });
      p.on("exit", resolve);
    });
    if (code !== 0) throw Error("Browser verification failed");
  }
  console.log("Local browser/API/Postgres verification passed");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  server?.kill("SIGTERM");
  gateway?.close();
  for (const name of [api, pg])
    try {
      docker(["rm", "-f", name]);
    } catch {}
  try {
    docker(["network", "rm", network]);
  } catch {}
}
