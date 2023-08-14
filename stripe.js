const stripe = require("stripe");
const Stripe = stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2020-08-27",
  maxNetworkRetries: 2,
});

const createCheckoutSession = async (customerID, price) => {
  if (!customerID || !price)
    throw new Error("customerId or price Id cannot be null");
  const session = await Stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer: customerID,
    line_items: [
      {
        price,
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: process.env.TRIAL_DAYS,
    },

    success_url: `${process.env.DOMAIN}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.DOMAIN}`,
  });

  return session;
};

const createBillingSession = async (customer) => {
  const session = await Stripe.billingPortal.sessions.create({
    customer,
    return_url: process.env.DOMAIN,
  });
  return session;
};

const getCustomerByID = async (id) => {
  const customer = await Stripe.customers.retrieve(id);
  return customer;
};

const addNewCustomer = async (email) => {
  const customer = await Stripe.customers.create({
    email,
    description: "New Customer",
  });

  return customer;
};

const createWebhook = (rawBody, sig) => {
  const event = Stripe.webhooks.constructEvent(
    rawBody,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );
  return event;
};

const connectBank = async (user) => {
  const createdAccount = await Stripe.accounts.create({
    type: "custom",
    business_type: "individual",
    email: user.email,
    country: user.country,
    requested_capabilities: ["card_payments", "transfers"],
    individual: {
      email: user.email,
      address: {
        country: user.country,
      },
    },
    business_profile: {
      mcc: 5962,
      name: user.username || "travelling",
      product_description: "N/A",
      url: user.url,
    },
  });
  stripeAccountId = createdAccount.id;

  const accountLink = await Stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: `${process.env.DOMAIN}/connect_bank`,
    return_url: `${process.env.DOMAIN}`,
    type: "account_onboarding",
    collect: "eventually_due",
  });
  return { url: accountLink.url, stripeAccountId };
};

const createPaymentSession = async (
  line_items,
  stripeCustomerId,
  stripeAccountId,
  percentPlateformFees
) => {
  const session = await Stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items,
    mode: "payment",
    currency: "usd",
    customer: stripeCustomerId,
    payment_intent_data: {
      transfer_data: {
        destination: stripeAccountId,
      },
      on_behalf_of: stripeAccountId,
      application_fee_amount: percentPlateformFees,
    },
    success_url: `${process.env.DOMAIN}`,
    cancel_url: `${process.env.DOMAIN}`,
  });
  return session;
};

module.exports = {
  getCustomerByID,
  addNewCustomer,
  createCheckoutSession,
  createBillingSession,
  createWebhook,
  connectBank,
  createPaymentSession,
};
