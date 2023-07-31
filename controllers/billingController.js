const Stripe = require("../stripe");
const billingCollection = require("../db").db().collection("billing");

const productToPriceMap = {
  explorer: process.env.EXPLORER,
  explorer_pro: process.env.EXPLORER_PRO,
};

//checkout
exports.subscribe = async function (req, res, next) {
  try {
    if (req.session.user) {
      const product = req.params.product_type;
      const customerID = req.session.user.billingId;
      console.log(customerID, product, "lol");
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
    console.log(err);
  }
};

//mange subscription
exports.Billing = async (req, res) => {
  const { customer } = req.params;
  const session = await Stripe.createBillingSession(customer);
  res.json({ url: session.url });
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

  console.log(event.type, "in webhook");
  switch (event.type) {
    case "customer.created":
      // console.log(JSON.stringify(data));
      break;
    case "invoice.paid":
      break;
    case "customer.subscription.created": {
      const billing = await billingCollection.find({
        billingId: data.customer,
      });

      if (data.plan.id === process.env.EXPLORER_PRO) {
        console.log("You are talking about explorer pro plan ");
        billing.plan = "explorer_pro";
      }

      if (data.plan.id === process.env.EXPLORER) {
        console.log("You are talking about explorer plus plan");
        billing.plan = "explorer";
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

      if (data.plan.id === process.env.EXPLORER_PRO) {
        console.log("You are talking about explorer pro plan ");
        billing.plan = "explorer_pro";
      }

      if (data.plan.id === process.env.EXPLORER) {
        console.log("You are talking about explorer plus plan");
        billing.plan = "explorer";
      }

      const isOnTrial = data.status === "trialing";

      if (isOnTrial) {
        billing.hasTrial = true;
        billing.endDate = new Date(data.current_period_end * 1000);
      } else if (data.status === "active") {
        billing.hasTrial = false;
        billing.endDate = new Date(data.current_period_end * 1000);
      }

      if (data.canceled_at) {
        // cancelled
        console.log("You just canceled the subscription" + data.canceled_at);
        billing.plan = "none";
        billing.hasTrial = false;
        billing.endDate = null;
      }
      console.log(
        "actual",
        billing.hasTrial,
        data.current_period_end,
        billing.plan
      );

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

      console.log("customer changed", JSON.stringify(data));
      break;
    }
    default:
  }
  res.sendStatus(200);
};
