import express from 'express';
import crypto from 'crypto';
import { Booking } from '../models/Booking.js';
import { getCashfreeConfig } from '../config/cashfree.js';

const router = express.Router();

// POST /api/webhooks/cashfree — Server-to-server callback from Cashfree
router.post('/', async (req, res) => {
  const config = getCashfreeConfig();
  const signature = req.headers['x-webhook-signature'] || req.headers['X-Webhook-Signature'];
  const timestamp = req.headers['x-webhook-timestamp'] || req.headers['X-Webhook-Timestamp'];
  const rawBody = req.rawBody || JSON.stringify(req.body);

  try {
    // 1. Signature Verification (if signature header and secretKey are present)
    if (signature && timestamp && config.secretKey) {
      try {
        let isValid = false;
        // Verify with Cashfree SDK instance if available
        if (config.cashfreeClient && typeof config.cashfreeClient.PGVerifyWebhookSignature === 'function') {
          try {
            const event = config.cashfreeClient.PGVerifyWebhookSignature(signature, rawBody, timestamp);
            isValid = Boolean(event);
          } catch (e) {
            isValid = false;
          }
        }
        
        if (!isValid) {
          // Fallback manual HMAC-SHA256 calculation
          const signatureData = timestamp + rawBody;
          const computedSignature = crypto
            .createHmac('sha256', config.secretKey)
            .update(signatureData)
            .digest('base64');
          isValid = signature === computedSignature;
        }

        if (!isValid) {
          console.error('[Cashfree Webhook] Webhook signature verification failed');
          return res.status(400).json({ message: 'Invalid webhook signature' });
        }
      } catch (sigErr) {
        console.warn('[Cashfree Webhook] Signature verification warning:', sigErr.message);
      }
    }

    const payload = req.body;
    const eventType = payload?.type;
    const orderData = payload?.data?.order;
    const paymentData = payload?.data?.payment;

    const orderId = orderData?.order_id || payload?.order_id;
    const paymentStatus = paymentData?.payment_status || payload?.data?.payment_status;
    const paymentId = paymentData?.cf_payment_id ? String(paymentData.cf_payment_id) : '';

    if (!orderId) {
      console.warn('[Cashfree Webhook] No order_id found in webhook payload');
      return res.status(200).json({ status: 'ok' });
    }

    console.log(`[Cashfree Webhook] Event: ${eventType}, Order: ${orderId}, Payment Status: ${paymentStatus}`);

    const booking = await Booking.findOne({
      $or: [
        { merchantTransactionId: orderId },
        { cfOrderId: orderId },
      ],
    });

    if (!booking) {
      console.warn(`[Cashfree Webhook] No booking found for order_id: ${orderId}`);
      return res.status(200).json({ status: 'ok' });
    }

    if (eventType === 'PAYMENT_SUCCESS_WEBHOOK' || paymentStatus === 'SUCCESS' || eventType === 'ORDER_PAID') {
      booking.paymentStatus = 'paid';
      booking.paymentId = paymentId || (orderData?.cf_order_id ? String(orderData.cf_order_id) : 'CASHFREE_PAID');
      booking.paidAt = new Date();
      await booking.save();
      console.log(`[Cashfree Webhook] Booking ${booking._id} marked as PAID (${orderId})`);
    } else if (
      eventType === 'PAYMENT_FAILED_WEBHOOK' ||
      eventType === 'PAYMENT_USER_DROPPED_WEBHOOK' ||
      paymentStatus === 'FAILED' ||
      paymentStatus === 'USER_DROPPED'
    ) {
      if (booking.paymentStatus !== 'paid') {
        booking.paymentStatus = 'failed';
        await booking.save();
        console.log(`[Cashfree Webhook] Booking ${booking._id} marked as FAILED (${orderId})`);
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('[Cashfree Webhook Processing Error]:', error);
    return res.status(200).json({ status: 'ok' }); // Return 200 to prevent provider loop retries
  }
});

export default router;
