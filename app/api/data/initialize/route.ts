import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const NETWORK_MAP: Record<string, string> = {
  mtn: 'MTN',
  telecel: 'TELECEL',
  at: 'AT',
};

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

  // Login is optional — anyone can buy data, UPSA student or not. Logged-in
  // students just get their real email attached to the order for their
  // records; guests get a placeholder, since Notify's API requires an email
  // field but we don't want to ask guests for one.
  const isGuest = !user;

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

  const orderEmail = user?.email ?? `guest-${phoneNumber.replace(/\D/g, '')}@guest.distinctionlibrary.com`;

  const apiKey = process.env.NOTIFY_API_KEY;
  const notifyUserId = process.env.NOTIFY_USER_ID;

  if (!apiKey || !notifyUserId) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const adminSupabase = createAdminClient();

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

  const planLabel = `${plan.gig_size}GB${plan.validity ? ` (${plan.validity})` : ''}`;

  const { data: priceRow, error: priceError } = await adminSupabase
    .from('data_package_prices')
    .select('selling_price')
    .eq('network', vendorNetwork)
    .eq('package_id', Number(planId))
    .single();

  if (priceError || !priceRow) {
    return NextResponse.json(
      { error: 'No price has been set for this package yet' },
      { status: 400 }
    );
  }

  const clientPrice = Number(priceRow.selling_price);

  // Guest orders use the admin client to bypass RLS, since there's no
  // logged-in session to satisfy a user-scoped insert policy.
  const orderClient = isGuest ? adminSupabase : supabase;

  const { data: order, error: orderError } = await orderClient
    .from('data_orders')
    .insert({
      user_id: user?.id ?? null,
      email: orderEmail,
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

  const notifyRequestBody = {
    email: orderEmail,
    package_id: Number(planId),
    phone_number: phoneNumber,
    network: vendorNetwork,
    client_price: clientPrice,
    user_id: Number(notifyUserId),
  };

  let notifyData: any;
  try {
    const notifyRes = await fetch(`${NOTIFY_BASE_URL}/api/reseller/initialize-payment`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(notifyRequestBody),
    });

    notifyData = await notifyRes.json();

    if (!notifyRes.ok || notifyData.status !== true) {
      console.error('Notify initialize-payment rejected:', notifyRes.status, JSON.stringify(notifyData));
      await adminSupabase
        .from('data_orders')
        .update({ status: 'failed', vendor_response: notifyData })
        .eq('id', order.id);

      return NextResponse.json({ error: 'Payment initialization failed' }, { status: 502 });
    }
  } catch (err) {
    console.error('Could not reach Notify Data API:', err);
    await adminSupabase
      .from('data_orders')
      .update({ status: 'failed' })
      .eq('id', order.id);
    return NextResponse.json({ error: 'Payment initialization failed' }, { status: 502 });
  }

  await adminSupabase
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
