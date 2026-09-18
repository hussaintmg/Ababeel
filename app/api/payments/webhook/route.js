import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/utils/db';
import User from '@/models/User';
import Registration from '@/models/Registration';
import { allocateRegistration } from '@/lib/training/batchAllocation';

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

    console.log('=== STRIPE WEBHOOK RECEIVED ===');

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

    // 1. Checkout Session Completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const registrationId = session.metadata?.registrationId || session.client_reference_id;

      if (registrationId) {
        const registration = await Registration.findById(registrationId);
        if (registration) {
          // Verify currency and amount if provided
          const amountReceived = (session.amount_total || 0) / 100;
          registration.paymentStatus = 'paid';
          registration.paymentMethod = 'stripe';
          registration.stripeSessionId = session.id;
          if (session.payment_intent) {
            registration.stripePaymentIntentId = session.payment_intent;
          }
          if (amountReceived > 0) {
            registration.paymentAmount = amountReceived;
          }
          if (session.currency) {
            registration.paymentCurrency = session.currency.toUpperCase();
          }

          // If student registered for an eligible current batch, attempt automatic enrollment
          if (!registration.isFutureBatch && registration.reference) {
            try {
              const alloc = await allocateRegistration(registration._id);
              if (alloc.allocated) {
                registration.batchAllocationStatus = 'allocated';
                registration.status = 'confirmed';
              } else {
                registration.batchAllocationStatus = 'awaiting_batch';
              }
            } catch (allocErr) {
              console.warn('Auto-enrollment error after Stripe payment:', allocErr.message);
            }
          } else {
            // Future-batch registration: payment is confirmed, queued for next batch
            registration.batchAllocationStatus = 'awaiting_batch';
          }

          await registration.save();
          console.log(`✅ Registration ${registrationId} confirmed via Stripe checkout`);
        }
      }
    }

    // 2. Payment Intent Succeeded
    else if (event.type === 'payment_intent.succeeded') {
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

      // Check if registration was associated directly with payment intent
      const registrationId = paymentIntent.metadata?.registrationId;
      if (registrationId) {
        const registration = await Registration.findById(registrationId);
        if (registration && registration.paymentStatus !== 'paid') {
          registration.paymentStatus = 'paid';
          registration.paymentMethod = 'stripe';
          registration.stripePaymentIntentId = paymentIntent.id;

          if (!registration.isFutureBatch && registration.reference) {
            try {
              const alloc = await allocateRegistration(registration._id);
              if (alloc.allocated) {
                registration.batchAllocationStatus = 'allocated';
                registration.status = 'confirmed';
              }
            } catch (allocErr) {
              console.warn('Auto-allocation error on payment_intent.succeeded:', allocErr.message);
            }
          }
          await registration.save();
        }
      }
    }

    // 3. Payment Failed
    else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      const registrationId = paymentIntent.metadata?.registrationId;
      if (registrationId) {
        const registration = await Registration.findById(registrationId);
        if (registration) {
          registration.paymentStatus = 'failed';
          await registration.save();
          console.log(`⚠️ Registration ${registrationId} payment marked failed`);
        }
      }
    }

    // 4. Charge Refunded
    else if (event.type === 'charge.refunded') {
      const charge = event.data.object;
      const paymentIntentId = charge.payment_intent;
      if (paymentIntentId) {
        const registration = await Registration.findOne({ stripePaymentIntentId: paymentIntentId });
        if (registration) {
          registration.paymentStatus = 'refunded';
          await registration.save();
          console.log(`🔄 Registration ${registration._id} payment marked refunded`);
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