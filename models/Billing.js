const User = require("./User");
const stripe = require("stripe");
const Stripe = stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2020-08-27",
  maxNetworkRetries: 2,
});
const { ObjectId } = require("mongodb");
const billingCollection = require("../db").db().collection("billing");


let Billing = function (explorerId, plan, hasTrial, endDate, billingId) {
  this.explorerId = explorerId;
  this.plan = plan;
  this.hasTrial = hasTrial;
  this.endDate = endDate;
  this.billingId = billingId;
  this.errors = [];
};

Billing.createCustomer = async (username) => {
  try {
    const { _id, email } = await User.findByUsername(username);
    const customer = await Stripe.customers.create({
        email,
        name: username,
        description: "New Customer",
      });
    stripeCustomerId = customer.id;

    await billingCollection.insertOne({
      explorerId: ObjectId(_id),
      plan: "none",
      endDate: null,
      billingId: stripeCustomerId,
    });

    return stripeCustomerId;
  } catch (e) {
    console.log(e);
  }
};

Billing.getBillingDetails = async (username) => {
  try {
    const user = await User.findByUsername(username);
    if (!user) {
      throw new Error("User not found");
    }

    const billingInfo = await billingCollection.findOne({
      explorerId: user._id,
    });

    return billingInfo;
  } catch (e) {
    //console.error(e);
    return null;
  }
};

Billing.findByCustomerId = async (customerId) => {
  try {
    const billingInfo = await billingCollection.findOne({
      billingId: customerId,
    });

    return billingInfo;
  } catch (e) {
    console.error(e);
    return null;
  }
};

module.exports = Billing;
