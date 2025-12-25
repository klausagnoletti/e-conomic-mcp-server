const isDebugEnabled = () =>
  process.env.ECONOMIC_DEBUG?.trim().toLowerCase() === "true";

const safeStringify = (value) => {
  const seen = new WeakSet();
  return JSON.stringify(value, (key, val) => {
    if (typeof val === "object" && val !== null) {
      if (seen.has(val)) {
        return "[Circular]";
      }
      seen.add(val);
    }
    if (typeof val === "bigint") {
      return val.toString();
    }
    return val;
  });
};

export const logEvent = (level, message, fields = {}) => {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...fields,
  };

  try {
    console.error(safeStringify(payload));
  } catch {
    console.error(
      JSON.stringify({
        level: "error",
        message: "Failed to serialize log payload.",
        timestamp: new Date().toISOString(),
      })
    );
  }
};

export const logDebug = (message, fields) => {
  if (!isDebugEnabled()) {
    return;
  }

  logEvent("debug", message, fields);
};
