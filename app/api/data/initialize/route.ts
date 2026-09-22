// app/api/data/initialize/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const NETWORK_MAP: Record<string, string> = {
  mtn: 'MTN',
  telecel: 'TELECEL',
  at: 'AT',
};

const NOTIFY_BASE_URL = 'https://onlinesmsnotifygh.com';
const MARKUP = 0.4; // flat GHS 0.40 markup per plan

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { phoneNumber, network, planId } = (await request.json()) as {
    phoneNumber: string;
    network: string;
    planId: string;
  };

  if (!phoneNumber || !network || !planId) {
    return NextResponse.json(
      { error: 'phoneNumber, network, and planId are required' },
      { status: 400 }
    );
  }

  const vendorNetwork = NETWORK_MAP[network.toLowerCase()];
  if (!vendorNetwork) {
    return NextResponse.json({ error: 'Invalid network' }, { status: 400 });
  }

  const phoneRegex = /^(0[2-9]\d{8}|\+233[2-9]\d{8})$/;
  if (!phoneRegex.test(phoneNumber)) {
    return NextResponse.json({ error: 'Invalid Ghana phone number' }, { status: 400 });
  }

  // Re-fetch plans server-side — never trust a client-sent price
  const plansRes = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/data/plans?network=${network}`
  );
  if (!plansRes.ok) {
    return NextResponse.json(
      { error: 'Could not verify plan — vendor plans lookup failed' },
      { status: 502 }
    );
  }
  const plansData = await plansRes.json();
  const plan = plansData.data?.find((p: any) => String(p.package_id) === String(planId));
  if (!plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 400 });
  }

  const wholesalePrice = parseFloat(plan.price); // cedis, e.g. 39.00
  const clientPrice = Number((wholesalePrice + MARKUP).toFixed(2)); // what the buyer actually pays
  const planLabel = `${plan.gig_size}GB${plan.validity ? ` (${plan.validity})` : ''}`;

  // Create the pending order row FIRST
  const { data: order, error: orderError } = await supabase
    .from('data_orders')
    .insert({
      user_id: user.id,
      network: vendorNetwork,
      phone_number: phoneNumber,
      plan_id: String(planId),
      plan_label: planLabel,
      amount: clientPrice,
      status: 'pending',
    })
    .select()
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: 'Could not create order' }, { status: 500 });
  }

  // Hand off to Notify's Pay & Order flow. Notify — not us — talks to Paystack,
  // handles the webhook, fulfills the order, and routes our profit share to
  // the Paystack subaccount already registered against our reseller account.
  // We never touch a Paystack key here.
  const apiKey = process.env.NOTIFY_API_KEY;
  const userId = process.env.NOTIFY_USER_ID; // numeric Reseller User ID (763)

  if (!apiKey || !userId) {
    await supabase
      .from('data_orders')
      .update({ status: 'failed', error_message: 'Server misconfigured: missing Notify credentials' })
      .eq('id', order.id);
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  let notifyData: any;
  try {
    const notifyRes = await fetch(`${NOTIFY_BASE_URL}/api/reseller/initialize-payment`, {
      method: 'POST',
      headers: {
        // This Notify endpoint uses Bearer auth, unlike /plans which uses x-api-key.
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        package_id: Number(planId),
        phone_number: phoneNumber,
        network: vendorNetwork,
        client_price: clientPrice,
        user_id: Number(userId),
        type: 'inline', // popup on-site, no page redirect
      }),
    });

    notifyData = await notifyRes.json();

    if (!notifyRes.ok || notifyData.status !== true) {
      console.error('Notify initialize-payment rejected:', notifyRes.status, JSON.stringify(notifyData));
      await supabase
        .from('data_orders')
        .update({ status: 'failed', error_message: notifyData.message ?? 'Notify initialize-payment failed' })
        .eq('id', order.id);

      return NextResponse.json({ error: 'Payment initialization failed' }, { status: 502 });
    }
  } catch (err) {
    await supabase
      .from('data_orders')
      .update({ status: 'failed', error_message: 'Could not reach Notify Data API' })
      .eq('id', order.id);
    return NextResponse.json({ error: 'Payment initialization failed' }, { status: 502 });
  }

  await supabase
    .from('data_orders')
    .update({ paystack_reference: notifyData.reference })
    .eq('id', order.id);

  return NextResponse.json({
    orderId: order.id,
    authorizationUrl: notifyData.authorization_url,
    reference: notifyData.reference,
  });
}
