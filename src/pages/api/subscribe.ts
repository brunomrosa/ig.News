/* eslint-disable import/no-anonymous-default-export */
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { stripe } from "../../services/stripe";

import { query as q } from "faunadb";
import { fauna } from "../../services/fauna";

type User = {
  ref: {
    id: string;
  };
  data: {
    stripe_customer_id: string;
  };
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    try {
      const session = await getSession({ req });

      // poderia ser const user: User = await fauna.query(q.Get(session.user.ref.id))
      const user = await fauna.query<User>(
        q.Get(q.Match(q.Index("user_by_email"), q.Casefold(session.user.email)))
      );

      let customerId = user.data.stripe_customer_id;

      if (!customerId) {
        const stripeCustomer = await stripe.customers.create({
          email: session.user.email,
        });

        await fauna.query(
          q.Update(q.Ref(q.Collection("users"), user.ref.id), {
            data: {
              stripe_customer_id: stripeCustomer.id,
            },
          })
        );

        customerId = stripeCustomer.id;
      }

      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        billing_address_collection: "required",
        line_items: [{ price: "price_1KvSDpKNxqLC0hICJKoqtp8c", quantity: 1 }],
        mode: "subscription",
        allow_promotion_codes: true,
        cancel_url: process.env.STRIPE_SUCCESS_URL,
        success_url: process.env.STRIPE_CANCEL_URL,
      });

      return res.status(200).json({
        sessionId: checkoutSession.id,
      });
    } catch (error) {
      console.log(error);
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method not allowed");
  }
};
