/* eslint-disable import/no-anonymous-default-export */
import {NextApiRequest, NextApiResponse} from 'next'
import { Readable } from 'stream'
import Stripe from 'stripe';
import { stripe } from '../../services/stripe';

const buffer = async (readable: Readable) => {
  const chunks = [];

  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
}

export const config = {
  api: {
    bodyParser: false,
  }
}

const relevantEvents = new Set(['checkout.session.completed'])


export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
   
  
  if(req.method === 'POST') {

  const buff = await buffer(req);
    
  const secret = req.headers['stripe-signature']

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buff, secret, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const {type} = event;

  if(relevantEvents.has(type)) {
    //do something
  }

  console.log('evento recebido', event)
  return res.json({received: true})
  } else {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method not allowed')
  }
} catch (error) {
    console.log(error)
}
}