// app/api/data/order/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const NETWORK_MAP: Record<string, string> = {
  mtn: 'MTN',
  telecel: 'TELECEL',
  at: 'AT',
};

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

  const amount = parseFloat(plan.price); // cedis, e.g. 39.00
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
      amount,
      status: 'pending',
    })
    .select()
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: 'Could not create order' }, { status: 500 });
  }

  // Initialize Paystack transaction
  const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      amount: Math.round(amount * 100), // cedis -> pesewas
      reference: `dl-${order.id}`,
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/buy-data/verify?reference=${`dl-${order.id}`}`,
      metadata: {
        order_id: order.id,
        phone_number: phoneNumber,
        network: vendorNetwork,
      },
    }),
  });

  const paystackData = await paystackRes.json();

  if (!paystackData.status) {
    await supabase
      .from('data_orders')
      .update({ status: 'failed', error_message: paystackData.message })
      .eq('id', order.id);

    return NextResponse.json({ error: 'Payment initialization failed' }, { status: 502 });
  }

  await supabase
    .from('data_orders')
    .update({ paystack_reference: paystackData.data.reference })
    .eq('id', order.id);

  return NextResponse.json({
    orderId: order.id,
    authorizationUrl: paystackData.data.authorization_url,
    reference: paystackData.data.reference,
  });
}
