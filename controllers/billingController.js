const { ObjectId } = require("mongodb");
const User = require("../models/User");
const Stripe = require("../stripe");
const billingCollection = require("../db").db().collection("billing");
const userCollection = require("../db").db().collection("users");
const fundsCollection = require("../db").db().collection("funds");
const { consoleMsgColors } = require("../util");

const productToPriceMap = {
  monthly_exp: process.env.MONTHLY_EXPLORER,
  yearly_exp: process.env.ANNUAL_EXPLORER,
};
const status = {
  COMPLETED: "completed",
  PENDING: "pending",
};

//checkout
exports.subscribe = async function (req, res, next) {
  try {
    if (req.session.user) {
      const product = req.params.product_type;
      const customerID = req.session.user.billingId;
      if (!product || !customerID)
        throw new Error("subscription type or customerId is mandatory");

      const price = productToPriceMap[product];

      try {
        const session = await Stripe.createCheckoutSession(customerID, price);

        res.send({
          sessionId: session.id,
        });
      } catch (e) {
        console.log(e);
        res.status(400);
        return res.send({
          error: {
            message: e.message,
          },
        });
      }

      next();
    } else throw new Error("Billing Id is required for subscription");
  } catch (err) {
    console.log(consoleMsgColors.FgRed, err.message);
  }
};

//mange subscription
exports.Billing = async (req, res) => {
  const { customer } = req.params;
  const session = await Stripe.createBillingSession(customer);
  res.json({ url: session.url });
};

//connect bank
exports.ConnectBank = async (req, res) => {
  try {
    const { country, email } = req["query"];
    if (!email || !country) throw new Error("email and country is required");
    const { url } = await User.findByEmail(email);
    const { url: onBoardingUrl } = await Stripe.connectBank({
      ...req["query"],
      url,
    });

    res.json({ url: onBoardingUrl });
  } catch (e) {
    console.log(consoleMsgColors.FgRed, e.message);
  }
};

//funding
exports.funding = async (req, res) => {
  try {
    let { stripeAccountId, amount, explorer } = req.params;
    //validation
    if (!stripeAccountId)
      throw new Error("stripeAccountId is missing in params");
    if (!amount) throw new Error("amount is missing in params");
    console.log(amount, "value");

    //create customer
    let {
      username,
      billingId: stripeCustomerId = null,
      _id,
    } = req.session.user;

    if (!stripeCustomerId) {
      console.log("creating customer");
      const { email } = await User.findByUsername(username);
      const customer = await Stripe.addNewCustomer(email);
      stripeCustomerId = customer.id;

      await billingCollection.insertOne({
        explorerId: ObjectId(_id),
        plan: "none",
        endDate: null,
        billingId: stripeCustomerId,
      });

      req.session.user["billingId"] = stripeCustomerId;
    }

    const unit_amount = Math.ceil(amount * 100);
    const line_items = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `user: ${explorer}`,
            description: `Sending funds to ${explorer}`,
          },
          unit_amount: unit_amount,
        },
        quantity: 1,
      },
    ];

    const percentPlateformFees = Math.ceil(
      (process.env.PLATEFORM_FEE / 100) * amount * 100
    );

    const session = await Stripe.createPaymentSession(
      line_items,
      stripeCustomerId,
      stripeAccountId,
      percentPlateformFees
    );
    res.send({ url: session.url });
  } catch (e) {
    console.log(consoleMsgColors.FgRed, e);
    res.send(e);
  }
};

//webhook
exports.webhook = async (req, res) => {
  let event;

  try {
    event = Stripe.createWebhook(req.body, req.header("Stripe-Signature"));
  } catch (err) {
    console.log(err);
    return res.sendStatus(400);
  }

  const data = event.data.object;

  console.log(event.type, " = stripe event");
  switch (event.type) {
    case "customer.subscription.created": {
      const billing = await billingCollection.find({
        billingId: data.customer,
      });

      if (data.plan.id === productToPriceMap.monthly_exp) {
        console.log("You are talking about monthly explorer plan ");
        billing.plan = "monthly_exp";
      }

      if (data.plan.id === productToPriceMap.yearly_exp) {
        console.log("You are talking about annual explorer plan");
        billing.plan = "yearly_exp";
      }

      billing.hasTrial = true;
      billing.endDate = new Date(data.current_period_end * 1000);

      //update billing record
      await billingCollection.updateOne(
        { billingId: data.customer },
        {
          $set: {
            plan: billing.plan,
            hasTrial: billing.hasTrial,
            endDate: billing.endDate,
          },
        }
      );

      break;
    }
    case "customer.subscription.updated": {
      // started trial
      const billing = await billingCollection.find({
        billingId: data.customer,
      });

      if (data.plan.id === productToPriceMap.monthly_exp) {
        console.log("You are talking about monthly explorer plan ");
        billing.plan = "monthly_exp";
      }

      if (data.plan.id === productToPriceMap.yearly_exp) {
        console.log("You are talking about annual explorer plan");
        billing.plan = "yearly_exp";
      }

      const isOnTrial = data.status === "trialing";

      if (isOnTrial) {
        billing.hasTrial = true;
        billing.endDate = new Date(data.current_period_end * 1000);
      } else if (data.status === "active") {
        billing.hasTrial = false;
        billing.endDate = new Date(data.current_period_end * 1000);
      }

      //update billing record
      await billingCollection.updateOne(
        { billingId: data.customer },
        {
          $set: {
            plan: billing.plan,
            hasTrial: billing.hasTrial,
            endDate: billing.endDate,
          },
        }
      );

      break;
    }
    case "customer.subscription.deleted": {
      const billing = await billingCollection.findOne({
        billingId: data.customer,
      });
      // cancelled
      if (billing) {
        await User.findAndUpdateByBillingID(billing.billingId, null);

        console.log("You just canceled the subscription " + data.canceled_at);
        billing.plan = "none";
        billing.hasTrial = false;
        billing.endDate = null;

        // update billing record
        await billingCollection.updateOne(
          { billingId: data.customer },
          {
            $set: {
              plan: billing.plan,
              hasTrial: billing.hasTrial,
              endDate: billing.endDate,
            },
          }
        );
      }

      break;
    }
    case "account.updated": {
      if (
        data.individual.verification.status === "verified" &&
        data.tos_acceptance.date
      ) {
        await userCollection.updateOne(
          { email: data.email },
          { $set: { stripeAccountId: data.individual.account } }
        );
      }

      break;
    }
    case "charge.succeeded": {
      const amount = parseInt(data.amount / 100);
      console.log(data.payment_intent, " charge succeded");
      await fundsCollection.insertOne({
        stripeAccountId: data.destination,
        stripeCustomerId: data.customer,
        amount,
        plateformFeePercent: process.env.PLATEFORM_FEE,
        status: status.PENDING,
        paymentIntentId: data.payment_intent,
      });

      break;
    }
    case "checkout.session.completed": {
      if (data.payment_intent) {
        await fundsCollection.updateOne(
          {
            paymentIntentId: data.payment_intent,
          },
          {
            $set: {
              status: status.COMPLETED,
              dateOfTranfer: new Date(),
            },
          }
        );
      }

      break;
    }
    default:
  }
  res.sendStatus(200);
};
