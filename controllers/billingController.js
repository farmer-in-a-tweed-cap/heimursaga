const Stripe = require("../stripe");
const billingCollection = require("../db").db().collection("billing");

const productToPriceMap = {
  pro: process.env.PRODUCT_PRO,
  pro_plus: process.env.PRODUCT_PRO_PLUS,
  annual_pro: process.env.ANNUAL_PRODUCT_PRO,
  annual_pro_plus: process.env.ANNUAL_PRODUCT_PRO_PLUS,
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
        const ms =
          new Date().getTime() + 1000 * 60 * 60 * 24 * process.env.TRIAL_DAYS;
        const n = new Date(ms);

        const updatedBillingInfo = {
          $set: {
            plan: product,
            hasTrial: true,
            endDate: n,
          },
        };

        // Update the document in the collection using $set operator
        await billingCollection.updateOne(
          { billingId: customerID },
          updatedBillingInfo
        );
        req.session.user["plan"] = product;
        req.session.user["endDate"] = n;
        req.session.user["hasTrial"] = true;
        console.log(req.session.user);
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
    } else next();
    // let Customer = await Bookmark.countBookmarksById(req.params.id, req.visitorId).then((result) => {
    //     console.log(result)
    //     return result
    // })
  } catch (err) {
    console.log(err);
  }
};

exports.Billing = async (req, res) => {
  const { customer } = req.params;
  const session = await Stripe.createBillingSession(customer);
  res.json({ url: session.url });
};

//webhook
exports.webhook = async (req, res) => {
  let event;
  console.log("webhook entered");

  try {
    event = Stripe.createWebhook(req.body, req.header("Stripe-Signature"));
  } catch (err) {
    console.log(err);
    return res.sendStatus(400);
  }

  const data = event.data.object;

  console.log(event.type, data, "in webhook");
  switch (event.type) {
    case "customer.created":
      console.log(JSON.stringify(data));
      break;
    case "invoice.paid":
      break;
    case "customer.subscription.created": {
      const billing = await billingCollection.findOne({
        billingId: data.customer,
      });
      console.log(billing, "in webhook");

      if (data.plan.id === process.env.PRODUCT_PRO) {
        console.log("You are talking about pro plan ");
        billing.plan = "pro";
      }

      if (data.plan.id === process.env.PRODUCT_PRO_PLUS) {
        console.log("You are talking about pro plus plan");
        billing.plan = "pro_plus";
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
      const billing = await billingCollection.findOne({
        billingId: data.customer,
      });

      if (data.plan.id == process.env.PRODUCT_PRO) {
        console.log("You are talking about pro plan");
        billing.plan = "pro";
      }

      if (data.plan.id === process.env.PRODUCT_PRO_PLUS) {
        console.log("You are talking about pro plus product");
        billing.plan = "pro_plus";
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
    // case "customer.subscription.deleted": {
    //   const billing = await billingCollection.findOne({
    //     billingId: data.customer,
    //   });
    //   billing.plan = "none";
    //   billing.hasTrial = false;
    //   billing.endDate = null;
    //   //update billing record
    //   await billingCollection.updateOne(
    //     { billingId: data.customer },
    //     {
    //       $set: {
    //         plan: billing.plan,
    //         hasTrial: billing.hasTrial,
    //         endDate: billing.endDate,
    //       },
    //     }
    //   );
    // }
    default:
  }
  res.sendStatus(200);
};
