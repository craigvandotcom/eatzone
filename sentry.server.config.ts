// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://73830bbe9d180291c32e84414d750809@o4509657245286400.ingest.de.sentry.io/4509657257082960",

  // Adjust trace sampling for production - 100% in dev, 10% in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === "development",

  // Environment configuration
  environment: process.env.NODE_ENV,

  // Privacy-first configuration for health data
  beforeSend(event, hint) {
    // Filter out sensitive health data before sending to Sentry
    if (event.extra) {
      // Remove any health-related data that might accidentally be included
      delete event.extra.ingredients;
      delete event.extra.symptoms;
      delete event.extra.stools;
      delete event.extra.liquids;
      delete event.extra.foods;
      delete event.extra.password;
      delete event.extra.email;
      delete event.extra.user;
    }

    // Remove sensitive data from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map(breadcrumb => ({
        ...breadcrumb,
        data: breadcrumb.data
          ? Object.fromEntries(
              Object.entries(breadcrumb.data).filter(
                ([key]) =>
                  !["ingredients", "symptoms", "password", "email"].includes(
                    key
                  )
              )
            )
          : undefined,
      }));
    }

    // Remove sensitive data from request data
    if (event.request?.data) {
      const data = event.request.data;
      if (typeof data === "object" && data !== null) {
        delete (data as any).ingredients;
        delete (data as any).symptoms;
        delete (data as any).password;
        delete (data as any).email;
      }
    }

    return event;
  },

  // Add tags for better filtering
  initialScope: {
    tags: {
      app: "health-tracker",
      version: "1.0.0",
      platform: "server",
    },
  },
});
