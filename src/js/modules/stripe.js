const stripe = require("stripe");
const Stripe = stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2020-08-27",
});

export default class Subscription {
  constructor() {
    this.explorerProPlus = document.querySelector("#explorer-pro-plus");
    this.explorerPro = document.querySelector("#explorer-pro");
    this.events();
  }

  events() {
    this.explorerProPlus.addEventListener("click", (e) => {
      e.preventDefault();
      this.createCheckoutSession();
    });
    this.explorerPro.addEventListener("click", (e) => {
      e.preventDefault();
      this.createCheckoutSession();
    });

    
  }

  createCheckoutSession = async (customerID, price) => {
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

  createBillingSession = async (customer) => {
    const session = await Stripe.billingPortal.sessions.create({
      customer,
      return_url: process.env.DOMAIN,
    });
    return session;
  };

  getCustomerByID = async (id) => {
    const customer = await Stripe.customers.retrieve(id);
    return customer;
  };

  addNewCustomer = async (email) => {
    const customer = await Stripe.customers.create({
      email,
      description: "New Customer",
    });

    return customer;
  };

  createWebhook = (rawBody, sig) => {
    const event = Stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    return event;
  };
}
