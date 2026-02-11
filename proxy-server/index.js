const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI;
const PROXY_SECRET = process.env.PROXY_SECRET || "";

let cachedClient = null;

async function getClient() {
  if (cachedClient) return cachedClient;
  cachedClient = new MongoClient(MONGODB_URI);
  await cachedClient.connect();
  return cachedClient;
}

// Simple auth middleware
app.use((req, res, next) => {
  const token = req.headers["x-proxy-secret"];
  if (PROXY_SECRET && token !== PROXY_SECRET) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
  next();
});

app.post("/query", async (req, res) => {
  try {
    const { action, collection, database, query, data, filter, update, pipeline, options } = req.body;
    const dbName = database || "zerotrustsecurity";
    const client = await getClient();
    const db = client.db(dbName);
    const coll = db.collection(collection);

    let result;

    switch (action) {
      case "find":
        result = await coll.find(query || {}, { limit: options?.limit, sort: options?.sort }).toArray();
        break;
      case "findOne":
        result = await coll.findOne(query || {});
        break;
      case "insertOne":
        result = await coll.insertOne(data);
        break;
      case "insertMany":
        result = await coll.insertMany(data);
        break;
      case "updateOne":
        result = await coll.updateOne(filter || query || {}, update || { $set: data });
        break;
      case "updateMany":
        result = await coll.updateMany(filter || query || {}, update || { $set: data });
        break;
      case "deleteOne":
        result = await coll.deleteOne(query || filter || {});
        break;
      case "deleteMany":
        result = await coll.deleteMany(query || filter || {});
        break;
      case "aggregate":
        result = await coll.aggregate(pipeline || query || []).toArray();
        break;
      case "count":
        result = await coll.countDocuments(query || {});
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("MongoDB error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// OTP log
app.post("/otp-log", (req, res) => {
  const { email, otp, type, channel } = req.body;
  console.log(`[OTP] ${type} | ${email} | code=${otp} | via=${channel || "both"}`);
  res.json({ success: true });
});

// event log - prints auth events to server console
app.post("/event-log", (req, res) => {
  const { event, user, otp, ip, location, device, policy, details } = req.body;
  const time = new Date().toLocaleString();

  let msg = `\n[${event}] ${time}`;

  if (user) msg += `\n  user: ${user.fullName || user.email} (${user.role || "user"})`;
  if (user && user.email) msg += ` <${user.email}>`;
  if (otp) msg += `\n  otp: ${otp.code} (${otp.channel || "both"})`;
  if (ip) msg += `\n  ip: ${ip}`;
  if (location) msg += `\n  location: ${location}`;
  if (device) {
    msg += `\n  device: ${device.browser || "?"}/${device.os || "?"} approved=${device.approved ? "yes" : "no"}`;
    if (device.posture) {
      const p = device.posture;
      msg += `\n  posture: os=${p.hasUpdatedOS ? "ok" : "no"} av=${p.hasAV ? "ok" : "no"} encrypt=${p.diskEncrypted ? "ok" : "no"} fw=${p.firewallOn ? "ok" : "no"}`;
    }
  }
  if (policy) {
    msg += `\n  decision: ${policy.decision} risk=${policy.riskScore}/100`;
    if (policy.reasons && policy.reasons.length) msg += ` (${policy.reasons.join(", ")})`;
  }
  if (details) msg += `\n  info: ${details}`;

  console.log(msg);
  res.json({ success: true });
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`MongoDB proxy running on port ${PORT}`));
