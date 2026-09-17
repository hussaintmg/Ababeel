import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/utils/db';
import User from '@/models/User';

let stripe;
function getStripe() {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

export async function POST(request) {
  try {
    await connectDB();

    const sig = request.headers.get('stripe-signature');
    const body = await request.text();

    console.log('=== PRODUCTION WEBHOOK RECEIVED ===');

    let event;

    try {
      event = getStripe().webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      console.log('✅ Webhook verified successfully');
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    console.log('📝 Event type:', event.type);

    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      console.log('🎉 Payment succeeded:', paymentIntent.id);

      const userId = paymentIntent.metadata?.userId;
      const amount = paymentIntent.metadata?.amount
        ? parseFloat(paymentIntent.metadata.amount)
        : (paymentIntent.amount_received || paymentIntent.amount || 0) / 100;

      if (userId) {
        const user = await User.findById(userId);
        if (user) {
          user.accountBalance = (user.accountBalance || 0) + amount;
          await user.save();
          console.log('✅ User account balance credited:', amount);
        }
      }
    }

    return NextResponse.json({ 
      received: true, 
      eventType: event.type
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}