import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase environment variables are missing");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Get all customers
export async function GET() {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

// POST - Add customer
export async function POST(request: Request) {
  const body = await request.json();

  const { name, phone, email, city } = body;

  const { data, error } = await supabase
    .from("customers")
    .insert([
      {
        name,
        phone,
        email,
        city,
      },
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

// PUT - Update customer
export async function PUT(request: Request) {
  const body = await request.json();

  const { id, name, phone, email, city } = body;

  const { data, error } = await supabase
    .from("customers")
    .update({
      name,
      phone,
      email,
      city,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

// DELETE - Delete customer
export async function DELETE(request: Request) {
  const { id } = await request.json();

  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}