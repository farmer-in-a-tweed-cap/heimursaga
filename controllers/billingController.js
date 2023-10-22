const User = require("../models/User");
const Stripe = require("../stripe");
const billingCollection = require("../db").db().collection("billing");
const userCollection = require("../db").db().collection("users");

const Billing = require("../models/Billing");
const ConnectAccountCustomer = require("../models/ConnectAccountCustomers");
const Sponsor = require("../models/Sponsors");
const Funds = require("../models/Funds");

const productToPriceMap = {
  monthly_exp: process.env.MONTHLY_EXPLORER,
  yearly_exp: process.env.ANNUAL_EXPLORER,
};
const status = {
  COMPLETED: "completed",
  CHARGE_SUCCESS: "charge-succeed",
};

//checkout
exports.subscribe = async function (req, res, next) {
  try {
    if (req.session.user) {
      const product = req.params.priceId;
      let customerID = req.session.user.billingId;
      if (!product) throw new Error("subscription type is required");

      if (!customerID) {
        customerID = await Billing.createCustomer(req.session.user.username);
        req.session.user.billingId = customerID;
      }

      const price = productToPriceMap[product];

      try {
        const session = await Stripe.createCheckoutSession(customerID, price);
        req.flash("success", `Welcome, ${req.session.user.username}!`);
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
  } catch (e) {
    console.log(e.message);
    res.status(500).send({ error: e });
  }
};

//mange subscription
exports.Billing = async (req, res) => {
  try {
    const { customer } = req.params;
    const session = await Stripe.createBillingSession(customer);
    res.json({ url: session.url });
  } catch (e) {
    console.log(e);
    res.status(500).send({ error: e });
  }
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
    console.log(e.message);
    res.status(500).send({ error: e });
  }
};

//funding
exports.funding = async (req, res) => {
  try {
    let { stripeAccountId, amount, token } = req.params;
    //validation
    if (!stripeAccountId)
      throw new Error("stripeAccountId is missing in params");
    if (!amount) throw new Error("amount is missing in params");
    let { _id } = req.session.user;

    const unit_amount = Math.ceil(amount * 100);

    const percentPlateformFees = Math.ceil(
      (process.env.PLATEFORM_FEE / 100) * amount * 100
    );

    const charges = await Stripe.createPaymentSession(
      unit_amount,
      token,
      stripeAccountId,
      percentPlateformFees
    );
    await Funds.create(charges, _id);
    res.send(charges);
  } catch (e) {
    console.log(e);
    res.status(500).send({ error: e });
  }
};

//sponser
exports.sponser = async (req, res) => {
  try {
    let { stripeAccountId, priceId, cardToken } = req.params;
    //validation
    if (!stripeAccountId)
      throw new Error("stripeAccountId is missing in params");
    if (!priceId) throw new Error("PriceId is missing in params");
    if (!cardToken) throw new Error("CardToken is missing in params");

    let { username, billingId: stripeCustomerId = null } = req.session.user;
    //create customer
    if (!stripeCustomerId) {
      console.log("customer created!");
      stripeCustomerId = await Billing.createCustomer(username);
      req.session.user["billingId"] = stripeCustomerId;
    }

    const price = priceId;
    const subscription = await Stripe.createSponserSubscription(
      cardToken,
      price,
      stripeCustomerId,
      stripeAccountId
    );

    res.json({ success: true, subscription: subscription });
  } catch (e) {
    console.log(e);
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
      const response = await ConnectAccountCustomer.findByCustomerId(
        data.customer
      );
      const custExpId = response?.cusExpId || null;
      const stripAccId = response?.stripeAccountId || null;
      if (custExpId && stripAccId) {
        await Sponsor.create(response._id, data.plan.id, false, null);
      }

      const billing = await billingCollection
        .find({
          billingId: data.customer,
        })
        .toArray();

      //false if subs to connect account
      if (billing.length) {
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
      }

      break;
    }
    case "customer.subscription.updated": {
      // started trial

      const billing = await billingCollection
        .find({
          billingId: data.customer,
        })
        .toArray();

      const existingCustomer = await ConnectAccountCustomer.findByCustomerId(
        data.customerId
      );
      if (!existingCustomer) {
        const newCustomer = new ConnectAccountCustomer({
          customerId: data.customerId,
          cusExpId: data.cusExpId,
          stripeAccountId: data.stripeAccountId,
        });
        newCustomer.createNew();
      }

      // if (billing.length) {
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
      // }

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
        const { monthlyProductId, yearlyProductId } =
          await Stripe.stripeAccountProductCreate(data.individual.account);

        await userCollection.updateOne(
          { email: data.email },
          {
            $set: {
              stripeAccountId: data.individual.account,
              products: { monthlyProductId, yearlyProductId },
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

//billingDetails
exports.billingDetails = async (req, res) => {
  try {
    if (!req.session?.user?.username) {
      res.send({ billing: null });
      return;
    }
    const billingDetails = await Billing.getBillingDetails(
      req.session.user.username
    );

    res.send({ billing: billingDetails });
  } catch (e) {
    console.log(e);
    res.status(500).send({ error: e });
  }
};
