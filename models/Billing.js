const { consoleMsgColors } = require("../util");
const User = require("./User");
const Stripe = require('../stripe');
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
    const customer = await Stripe.addNewCustomer(email);
    stripeCustomerId = customer.id;

    await billingCollection.insertOne({
      explorerId: ObjectId(_id),
      plan: "none",
      endDate: null,
      billingId: stripeCustomerId,
    });

    return stripeCustomerId;
  } catch (e) {
    console.log(consoleMsgColors.FgRed, e);
  }
};

module.exports = Billing;
