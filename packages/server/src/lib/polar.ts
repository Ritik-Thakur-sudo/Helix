import { Polar } from "@polar-sh/sdk";

type PolarServer = "sandbox" | "production";

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }

  return value;
}

export function getPolarAccessToken() {
  return getRequiredEnv("POLAR_ACCESS_TOKEN");
}

export function getPolarProductId() {
  return getRequiredEnv("POLAR_PRODUCT_ID");
}

export function getPolarCreditsMeterId() {
  return getRequiredEnv("POLAR_CREDITS_METER_ID");
}

export function getPolarServer(): PolarServer {
  const server = process.env.POLAR_SERVER?.trim();

  if (!server) {
    return "sandbox";
  }

  if (server !== "sandbox" && server !== "production") {
    throw new Error("POLAR_SERVER must be either 'sandbox' or 'production'");
  }

  return server;
}

const polar = new Polar({
  accessToken: getPolarAccessToken(),
  server: getPolarServer(),
});

export function hasPolarStatusCode(
  error: unknown,
  statusCode: number,
): error is { statusCode: number } {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    error.statusCode === statusCode
  );
}

type CreateCheckoutUrlParams = {
  customerExternalId: string;
  requestUrl: string;
};

export async function createCheckoutUrl({
  customerExternalId,
  requestUrl,
}: CreateCheckoutUrlParams) {
  const result = await polar.checkouts.create({
    products: [getPolarProductId()],
    successUrl: new URL("/billing/success", requestUrl).toString(),
    externalCustomerId: customerExternalId,
    metadata: {
      source: "helix-cli",
    },
  });

  return result.url;
}

export async function createCustomerPortalUrl({
  customerExternalId,
  requestUrl,
}: CreateCheckoutUrlParams) {
  const result = await polar.customerSessions.create({
    externalCustomerId: customerExternalId,
    returnUrl: new URL("/billing/success", requestUrl).toString(),
  });

  return result.customerPortalUrl;
}

export async function getAvailableCreditsBalance(externalCustomerId: string) {
  try {
    const customerState = await polar.customers.getStateExternal({
      externalId: externalCustomerId,
    });

    const configuredMeterId = getPolarCreditsMeterId();

    console.log("Polar credits lookup", {
      externalCustomerId,
      configuredMeterId,
      activeMeters: customerState.activeMeters.map((meter) => ({
        meterId: meter.meterId,
        balance: meter.balance,
        consumedUnits: meter.consumedUnits,
        creditedUnits: meter.creditedUnits,
      })),
    });

    const matchingMeters = customerState.activeMeters.filter(
      (meter) => meter.meterId === configuredMeterId,
    );

    if (matchingMeters.length === 0) {
      throw new Error(
        `Polar credits meter not found. Configured meter ID: ${configuredMeterId}`,
      );
    }

    if (matchingMeters.length > 1) {
      throw new Error(
        `Expected exactly one matching Polar credits meter, found ${matchingMeters.length}`,
      );
    }

    const creditsMeter = matchingMeters[0];

    if (!creditsMeter) {
      throw new Error("Polar credits meter lookup returned no meter");
    }

    if (creditsMeter.balance < 0) {
      throw new Error(
        `Polar credits meter returned an invalid negative balance: ${creditsMeter.balance}`,
      );
    }

    return creditsMeter.balance;
  } catch (error) {
    if (hasPolarStatusCode(error, 404)) {
      return 0;
    }

    throw error;
  }
}

type IngestAiUsageParams = {
  externalCustomerId: string;
  eventId: string;
  credits: number;
};

export async function ingestAiUsage({
  externalCustomerId,
  eventId,
  credits,
}: IngestAiUsageParams) {
  if (credits <= 0) {
    return;
  }

  await polar.events.ingest({
    events: [
      {
        name: "helix_usage",
        externalId: eventId,
        externalCustomerId,
        metadata: {
          credits,
        },
      },
    ],
  });
}
