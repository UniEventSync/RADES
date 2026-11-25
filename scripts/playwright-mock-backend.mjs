import { createServer } from "node:http";

const events = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    society_id: "00000000-0000-4000-8000-000000000010",
    title: "Robotics Lab Night",
    description: "Build and test robots with the IBA Computing Society.",
    category: "Technology",
    subcategory: "Hackathon",
    venue: "Student Center",
    venues: ["Student Center"],
    starts_at: "2099-12-01T10:00:00+05:00",
    ends_at: "2099-12-01T12:00:00+05:00",
    status: "published",
    is_public: true,
    capacity: 80,
    price_pkr: 0,
    registration_type: "solo",
    team_min: null,
    team_max: null,
    image_url: null,
    societies: { name: "IBA Computing Society", slug: "computing", logo_url: null },
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    society_id: "00000000-0000-4000-8000-000000000011",
    title: "Campus Jazz Evening",
    description: "Live performances and an open mic for IBA students.",
    category: "Music & Arts",
    subcategory: "Open Mic",
    venue: "Auditorium",
    venues: ["Auditorium"],
    starts_at: "2099-12-02T18:00:00+05:00",
    ends_at: "2099-12-02T21:00:00+05:00",
    status: "published",
    is_public: true,
    capacity: 120,
    price_pkr: 500,
    registration_type: "solo",
    team_min: null,
    team_max: null,
    image_url: null,
    societies: { name: "IBA Arts Society", slug: "arts", logo_url: null },
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    society_id: "00000000-0000-4000-8000-000000000012",
    title: "Startup Pitch Challenge",
    description: "Present a startup idea to a panel of campus founders.",
    category: "Entrepreneurship",
    subcategory: "Startup Pitch",
    venue: "Aman CED classrooms",
    venues: ["Aman CED classrooms"],
    starts_at: "2099-12-03T14:00:00+05:00",
    ends_at: "2099-12-03T17:00:00+05:00",
    status: "published",
    is_public: true,
    capacity: 60,
    price_pkr: 1200,
    registration_type: "team",
    team_min: 2,
    team_max: 4,
    image_url: null,
    societies: { name: "IBA Entrepreneurship Society", slug: "entrepreneurship", logo_url: null },
  },
];

const server = createServer((request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "apikey, authorization, content-type, x-client-info");
  response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (request.method === "OPTIONS") {
    response.writeHead(204).end();
    return;
  }

  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
  if (url.pathname === "/health") {
    response.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ ok: true }));
    return;
  }

  if (request.method === "GET" && url.pathname === "/auth/v1/user") {
    response.writeHead(401, { "content-type": "application/json" }).end(JSON.stringify({ code: "bad_jwt", message: "No test session" }));
    return;
  }

  if (request.method === "GET" && url.pathname === "/rest/v1/events") {
    const idFilter = url.searchParams.get("id");
    const result = idFilter?.startsWith("eq.")
      ? events.filter((event) => event.id === idFilter.slice(3))
      : events;
    response.writeHead(200, {
      "content-type": "application/json",
      "content-range": `0-${Math.max(result.length - 1, 0)}/${result.length}`,
    }).end(JSON.stringify(result));
    return;
  }

  response.writeHead(404, { "content-type": "application/json" }).end(JSON.stringify({ message: "Not found" }));
});

const port = Number(process.env.PLAYWRIGHT_MOCK_PORT ?? 54500);
server.listen(port, "127.0.0.1");
