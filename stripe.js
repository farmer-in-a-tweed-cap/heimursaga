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

const createToken = async (customerId, stripeAccountId) => {
  // console.log("token");
  const token = await Stripe.tokens.create(
    {
      customer: customerId,
    },
    {
      stripeAccount: stripeAccountId,
    }
  );
  // console.log(token, ":tpek ");
  return token;
};

const attachPaymentMethod = async (stripeCustomerId, stripeAccountId) => {
  const testCardToken = "tok_visa";
  // console.log("dede");
  const paymentMethod = await Stripe.paymentMethods.create({
    type: "card",
    card: {
      token: testCardToken,
    },
  });
  // // console.log(paymentMethod, "pM");
  // const attach = await Stripe.paymentMethods.attach(paymentMethod.id, {
  //   customer: stripeCustomerId,
  // });
  // const customer = await Stripe.customers.retrieve(attach.customer); // Replace with actual customer ID

  // // console.log(attach, customer, "cust,attachcus");
  // const updateCustomer = await Stripe.customers.update(stripeCustomerId, {
  //   invoice_settings: {
  //     default_payment_method: "pm_1NjmF9FXr1UXQNSZBEGaWGFe",
  //   },
  // });
  // console.log(paymentMethod);
  const PM = await Stripe.paymentMethods.create(
    {
      customer: stripeCustomerId,
      payment_method: paymentMethod.id,
    },
    {
      stripeAccount: stripeAccountId,
    }
  );
  // console.log(PM, "updatedCust");
  // await createToken(stripeCustomerId, stripeAccountId);
  return PM;
};

const createSponserSubscription = async (
  price,
  stripeCustomerId,
  stripeAccountId
) => {
  await Stripe.customers.update(stripeCustomerId, {
    source: "tok_mastercard",
  });
  const token = await Stripe.tokens.create(
    {
      customer: stripeCustomerId,
    },
    {
      stripeAccount: stripeAccountId,
    }
  );
  // console.log(token, "token");

  const customerWithToken = await Stripe.customers.create(
    {
      source: token.id,
    },
    {
      stripeAccount: stripeAccountId,
    }
  );
  // console.log(customerWithToken, "wtone");
  //todo retrivee these products from DB
  const yearlyProduct = await Stripe.products.create(
    {
      name: "MONTHLY_SPONSER",
    },
    { stripeAccount: stripeAccountId }
  );
  const monthlyProduct = await Stripe.products.create(
    {
      name: "MONTHLY_SPONSER",
    },
    { stripeAccount: stripeAccountId }
  );

  // Create a yearly price for the connected account's product
  const yearlyPrice = await Stripe.prices.create(
    {
      unit_amount: 7000, // Amount in cents ($70.00)
      currency: "usd",
      recurring: {
        interval: "year",
        interval_count: 1,
      },
      product: yearlyProduct.id,
    },
    { stripeAccount: stripeAccountId }
  );

  // Create a monthly price for the connected account's product
  const monthlyPrice = await Stripe.prices.create(
    {
      unit_amount: 600, // Amount in cents ($6.00)
      currency: "usd",
      recurring: {
        interval: "month",
        interval_count: 1,
      },
      product: monthlyProduct.id,
    },
    { stripeAccount: stripeAccountId }
  );
  //no customer if stripecustomerId
  const subscription = await Stripe.subscriptions.create(
    {
      customer: customerWithToken.id,
      items: [
        {
          price: monthlyPrice.id,
        },
      ],
      expand: ["latest_invoice.payment_intent"],
      application_fee_percent: process.env.PLATEFORM_FEE,
    },
    {
      stripeAccount: stripeAccountId,
    }
  );
  // console.log(subscription);
  return subscription;
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
  createToken,
  attachPaymentMethod,
};
