const stripe = require("stripe");
const ConnectAccountCustomer = require("./models/ConnectAccountCustomers");
const Billing = require("./models/Billing");
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

    success_url: `${process.env.DOMAIN}/user-guide`,
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

const addNewCustomer = async (email, username = "New customer") => {
  const customer = await Stripe.customers.create({
    email,
    description: username,
  });

  return customer;
};

//addNewCustomer("cnhamilton1@yahoo.com", "Christopher Hamilton");


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
      name: user.username || "traveling",
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
  unit_amount,
  token,
  stripeAccountId,
  percentPlatformFees
) => {
  const charges = await Stripe.charges.create({
    amount: unit_amount,
    currency: "usd",
    source: token,
    transfer_data: {
      destination: stripeAccountId,
    },
    on_behalf_of: stripeAccountId,
    application_fee_amount: percentPlatformFees,
  });

  return charges;
};

const createSponserSubscription = async (
  token,
  price,
  stripeCustomerId,
  stripeAccountId
) => {
  const billingDetails = await Billing.findByCustomerId(stripeCustomerId);
  const stripeAccCustomerDetails =
    await ConnectAccountCustomer.findByExpIdAndAccId(
      billingDetails.explorerId,
      stripeAccountId
    );
  let cusStripeAccId = stripeAccCustomerDetails?.customerId || null;
  if (!stripeAccCustomerDetails) {
    await Stripe.customers.update(stripeCustomerId, {
      source: token,
    });

    const accToken = await Stripe.tokens.create(
      {
        customer: stripeCustomerId,
      },
      {
        stripeAccount: stripeAccountId,
      }
    );

    const customerWithToken = await Stripe.customers.create(
      {
        source: accToken.id,
      },
      {
        stripeAccount: stripeAccountId,
      }
    );

    const ConnectAccountCustomerObj = new ConnectAccountCustomer(
      customerWithToken.id,
      billingDetails.explorerId,
      stripeAccountId
    );
    await ConnectAccountCustomerObj.createNew();
    cusStripeAccId = customerWithToken.id;
  }

  const subscription = await Stripe.subscriptions.create(
    {
      customer: cusStripeAccId,
      items: [
        {
          price,
        },
      ],
      expand: ["latest_invoice.payment_intent"],
      application_fee_percent: process.env.PLATFORM_FEE,
    },
    {
      stripeAccount: stripeAccountId,
    }
  );
  return subscription;
};

const connectAccDel = async (connAccId) => {
  const deleted = await Stripe.accounts.del(connAccId);
  return deleted;
};

const stripeAccountProductCreate = async (stripeAccountId) => {
  const yearlyProduct = await Stripe.products.create(
    {
      name: "YEARLY_SPONSER",
    },
    { stripeAccount: stripeAccountId }
  );
  const monthlyProduct = await Stripe.products.create(
    {
      name: "MONTHLY_SPONSER",
    },
    { stripeAccount: stripeAccountId }
  );

  const yearlyPrice = await Stripe.prices.create(
    {
      unit_amount: 6000,
      currency: "usd",
      recurring: {
        interval: "year",
        interval_count: 1,
      },
      product: yearlyProduct.id,
    },
    { stripeAccount: stripeAccountId }
  );

  const monthlyPrice = await Stripe.prices.create(
    {
      unit_amount: 700,
      currency: "usd",
      recurring: {
        interval: "month",
        interval_count: 1,
      },
      product: monthlyProduct.id,
    },
    { stripeAccount: stripeAccountId }
  );
  return { monthlyProductId: monthlyPrice.id, yearlyProductId: yearlyPrice.id };
};

module.exports = {
  getCustomerByID,
  addNewCustomer,
  createCheckoutSession,
  createBillingSession,
  createWebhook,
  connectBank,
  createPaymentSession,
  createSponserSubscription,
  stripeAccountProductCreate,
  connectAccDel,
};
