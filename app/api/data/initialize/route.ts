import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Notify Data's own format (used for their API calls and the data_markup_rules table)
const NETWORK_MAP: Record<string, string> = {
  mtn: 'MTN',
  telecel: 'TELECEL',
  at: 'AT',
};

// data_orders' check constraint expects these exact capitalizations —
// different from Notify's own format above.
const DATA_ORDERS_NETWORK: Record<string, string> = {
  MTN: 'MTN',
  TELECEL: 'Telecel',
  AT: 'AirtelTigo',
};

const NOTIFY_BASE_URL = 'https://onlinesmsnotifygh.com';

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

  const apiKey = process.env.NOTIFY_API_KEY;
  const notifyUserId = process.env.NOTIFY_USER_ID;

  if (!apiKey || !notifyUserId) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const adminSupabase = createAdminClient();

  // 1. Fetch the real wholesale price directly from Notify — never trust a
  //    client-sent price.
  const plansUrl = new URL(`${NOTIFY_BASE_URL}/api/reseller/plans`);
  plansUrl.searchParams.set('network', network.toLowerCase());

  const plansRes = await fetch(plansUrl.toString(), {
    headers: { 'x-api-key': apiKey, Accept: 'application/json' },
    cache: 'no-store',
  });
  const plansData = await plansRes.json();

  if (!plansRes.ok || plansData.status !== 'success') {
    return NextResponse.json(
      { error: 'Could not verify plan — vendor plans lookup failed' },
      { status: 502 }
    );
  }

  const plan = plansData.data?.find((p: any) => String(p.package_id) === String(planId));
  if (!plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 400 });
  }

  const wholesalePrice = parseFloat(plan.price);
  const planLabel = `${plan.gig_size}GB${plan.validity ? ` (${plan.validity})` : ''}`;

  // 2. Look up this network's markup from Supabase — editable any time from
  //    the data_markup_rules table, no code change or redeploy needed.
  const { data: markupRow, error: markupError } = await adminSupabase
    .from('data_markup_rules')
    .select('markup')
    .eq('network', vendorNetwork)
    .single();

  if (markupError || !markupRow) {
    return NextResponse.json(
      { error: 'No markup rule configured for this network' },
      { status: 500 }
    );
  }

  const clientPrice = Number((wholesalePrice + Number(markupRow.markup)).toFixed(2));

  // 3. Create the pending order row FIRST, before calling Notify.
  const { data: order, error: orderError } = await supabase
    .from('data_orders')
    .insert({
      user_id: user.id,
      email: user.email,
      network: DATA_ORDERS_NETWORK[vendorNetwork],
      phone_number: phoneNumber,
      plan_id: String(planId),
      plan_label: planLabel,
      amount: clientPrice,
      status: 'pending',
    })
    .select()
    .single();

  if (orderError || !order) {
    console.error('Could not create data_orders row:', orderError);
    return NextResponse.json({ error: 'Could not create order' }, { status: 500 });
  }

  // 4. Hand off to Notify's Pay & Order flow. Notify — not us — talks to
  //    Paystack, handles the webhook, fulfills the order, and routes our
  //    profit share to the Paystack subaccount already registered against
  //    our reseller account. We never touch a Paystack key here.
  //
  //    Only the fields in Notify's documented schema — confirmed via live
  //    testing that this endpoint uses x-api-key (not Bearer), and that an
  //    unrecognized "type" field breaks the request.
  let notifyData: any;
  try {
    const notifyRes = await fetch(`${NOTIFY_BASE_URL}/api/reseller/initialize-payment`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        package_id: Number(planId),
        phone_number: phoneNumber,
        network: vendorNetwork,
        client_price: clientPrice,
        user_id: Number(notifyUserId),
      }),
    });

    notifyData = await notifyRes.json();

    if (!notifyRes.ok || notifyData.status !== true) {
      console.error('Notify initialize-payment rejected:', notifyRes.status, JSON.stringify(notifyData));
      await supabase
        .from('data_orders')
        .update({ status: 'failed', vendor_response: notifyData })
        .eq('id', order.id);

      return NextResponse.json({ error: 'Payment initialization failed' }, { status: 502 });
    }
  } catch (err) {
    console.error('Could not reach Notify Data API:', err);
    await supabase
      .from('data_orders')
      .update({ status: 'failed' })
      .eq('id', order.id);
    return NextResponse.json({ error: 'Payment initialization failed' }, { status: 502 });
  }

  await supabase
    .from('data_orders')
    .update({ paystack_reference: notifyData.reference })
    .eq('id', order.id);

  return NextResponse.json({
    orderId: order.id,
    clientPrice,
    authorizationUrl: notifyData.authorization_url,
    reference: notifyData.reference,
  });
}
