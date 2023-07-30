const stripe = require("stripe");
const Stripe = stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2020-08-27",
});
