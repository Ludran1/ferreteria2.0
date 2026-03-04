import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing sale insert...');
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert({
      customer_name: 'TEST PERCY',
      total: 50,
      payment_method: 'cash',
      payment_type: 'contado',
      date: new Date().toISOString(),
      document_type: 'boleta',
      document_serie: 'B002',
      document_number: 9999,
      sunat_estado: 'ACEPTADO',
    })
    .select()
    .single();

  if (saleError) {
    console.error('Sale Insert Error:', saleError);
    return;
  }
  console.log('Sale inserted:', sale.id);

  console.log('Testing sale_items insert with manual item (null product_id)...');
  const { error: itemsError } = await supabase
    .from('sale_items')
    .insert([{
      sale_id: sale.id,
      product_id: null,
      product_name: 'Item Manual',
      quantity: 1,
      price_at_sale: 50
    }]);

  if (itemsError) {
    console.error('Items Insert Error:', itemsError);
  } else {
    console.log('Items inserted successfully');
  }

  // cleanup
  await supabase.from('sales').delete().eq('id', sale.id);
  console.log('Cleanup done');
}

test();
