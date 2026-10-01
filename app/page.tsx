"use client";

import { useCallback, useEffect, useState } from "react";

type Customer = {
id: number;
name: string;
phone: string;
email: string;
city: string;
};

type FormData = Omit<Customer, "id">;
type Errors = Partial<Record<keyof FormData, string>>;

const emptyForm: FormData = {
name: "",
phone: "",
email: "",
city: "",
};

function validate(f: FormData): Errors {
const e: Errors = {};

if (f.name.trim().length < 2) {
e.name = "Name kam az kam 2 characters ka ho";
}

if (!/^[0-9+-\s]{10,15}$/.test(f.phone.trim())) {
e.phone =
"Valid phone likhein (10-15 digits, e.g. 0300-1234567)";
}

if (!/^\S+@\S+.\S+$/.test(f.email.trim())) {
e.email = "Valid email likhein";
}

if (f.city.trim().length < 2) {
e.city = "City required hai";
}

return e;
}

export default function Home() {
const [customers, setCustomers] = useState<Customer[]>([]);
const [form, setForm] = useState<FormData>(emptyForm);
const [errors, setErrors] = useState<Errors>({});
const [editingId, setEditingId] = useState<number | null>(null);
const [search, setSearch] = useState("");
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [message, setMessage] = useState("");

const loadCustomers = useCallback(async () => {
setLoading(true);

try {
  const response = await fetch("/api/customers");
  const result = await response.json();

  if (!response.ok) {
    setMessage(
      "Load error: " +
        (result.error || "Something went wrong")
    );
    setCustomers([]);
  } else {
    setCustomers(result as Customer[]);
  }
} catch {
  setMessage(
    "Load error: Server se connection nahi ho raha."
  );
  setCustomers([]);
} finally {
  setLoading(false);
}

}, []);

useEffect(() => {
const timeoutId = setTimeout(() => {
void loadCustomers();
}, 0);

return () => clearTimeout(timeoutId);

}, [loadCustomers]);

async function handleSubmit(e: React.FormEvent) {
e.preventDefault();
const validationErrors = validate(form);
setErrors(validationErrors);

if (Object.keys(validationErrors).length > 0) {
  return;
}

setSaving(true);
setMessage("");

const payload = {
  name: form.name.trim(),
  phone: form.phone.trim(),
  email: form.email.trim(),
  city: form.city.trim(),
};

try {
  const response = await fetch("/api/customers", {
    method: editingId !== null ? "PUT" : "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      editingId !== null
        ? {
            id: editingId,
            ...payload,
          }
        : payload
    ),
  });

  const result = await response.json();

  if (!response.ok) {
    setMessage(
      "Error: " +
        (result.error || "Something went wrong")
    );
  } else {
    setMessage(
      editingId !== null
        ? "Customer update ho gaya ✅"
        : "Customer add ho gaya ✅"
    );

    resetForm();
    await loadCustomers();
  }
} catch {
  setMessage(
    "Error: Server se connection nahi ho raha."
  );
} finally {
  setSaving(false);
}

}

async function handleDelete(id: number) {
if (
!confirm(
"Kya aap sach mein delete karna chahte hain?"
)
) {
return;
}
try {
  const response = await fetch("/api/customers", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
  });

  const result = await response.json();

  if (!response.ok) {
    setMessage(
      "Delete error: " +
        (result.error || "Something went wrong")
    );
  } else {
    setMessage("Customer delete ho gaya 🗑️");

    setCustomers((prev) =>
      prev.filter((customer) => customer.id !== id)
    );
  }
} catch {
  setMessage(
    "Delete error: Server se connection nahi ho raha."
  );
}

}

function handleEdit(customer: Customer) {
setEditingId(customer.id);

setForm({
  name: customer.name,
  phone: customer.phone,
  email: customer.email,
  city: customer.city,
});

setErrors({});

window.scrollTo({
  top: 0,
  behavior: "smooth",
});

}

function resetForm() {
setForm(emptyForm);
setErrors({});
setEditingId(null);
}

const query = search.trim().toLowerCase();

const filteredCustomers = customers.filter((customer) =>
[
customer.name,
customer.phone,
customer.email,
customer.city,
].some((value) =>
value.toLowerCase().includes(query)
)
);

const fields: {
key: keyof FormData;
label: string;
type: string;
}[] = [
{
key: "name",
label: "Customer Name",
type: "text",
},
{
key: "phone",
label: "Phone",
type: "tel",
},
{
key: "email",
label: "Email",
type: "email",
},
{
key: "city",
label: "City",
type: "text",
},
];

return (
  <main className="min-h-screen bg-gray-50 p-4 text-gray-900 md:p-8">
    <div className="mx-auto max-w-5xl space-y-6">

    <h1 className="text-3xl font-bold">
      Customer Management
    </h1>

    {message && (
      <div className="flex justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm">
        <span>{message}</span>

        <button
          onClick={() => setMessage("")}
          className="font-bold"
          type="button"
        >
          ×
        </button>
      </div>
    )}

    <form
      onSubmit={handleSubmit}
      noValidate
      className="grid gap-4 rounded-xl bg-white p-5 shadow md:grid-cols-2"
    >
      <h2 className="text-xl font-semibold md:col-span-2">
        {editingId !== null
          ? "Edit Customer"
          : "Add Customer"}
      </h2>

      {fields.map(({ key, label, type }) => (
        <div key={key}>
          <label className="mb-1 block text-sm font-medium">
            {label}
          </label>

          <input
            type={type}
            value={form[key]}
            onChange={(event) =>
              setForm({
                ...form,
                [key]: event.target.value,
              })
            }
            className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400 ${
              errors[key]
                ? "border-red-500"
                : "border-gray-300"
            }`}
          />

          {errors[key] && (
            <p className="mt-1 text-xs text-red-600">
              {errors[key]}
            </p>
          )}
        </div>
      ))}

      <div className="flex gap-3 md:col-span-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : editingId !== null
            ? "Update"
            : "Add Customer"}
        </button>

        {editingId !== null && (
          <button
            type="button"
            onClick={resetForm}
            className="rounded-lg border px-5 py-2 hover:bg-gray-100"
          >
            Cancel
          </button>
        )}
      </div>
    </form>

    <div className="space-y-4 rounded-xl bg-white p-5 shadow">

      <input
        placeholder="Search by name, phone, email or city..."
        value={search}
        onChange={(event) =>
          setSearch(event.target.value)
        }
        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
      />

      {loading ? (
        <p className="text-gray-500">
          Loading...
        </p>
      ) : filteredCustomers.length === 0 ? (
        <p className="text-gray-500">
          Koi customer nahi mila.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Email</th>
                <th className="p-3">City</th>
                <th className="p-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="p-3 font-medium">
                    {customer.name}
                  </td>

                  <td className="p-3">
                    {customer.phone}
                  </td>

                  <td className="p-3">
                    {customer.email}
                  </td>

                  <td className="p-3">
                    {customer.city}
                  </td>

                  <td className="space-x-2 p-3 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        handleEdit(customer)
                      }
                      className="rounded bg-amber-100 px-3 py-1 text-amber-800 hover:bg-amber-200"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(customer.id)
                      }
                      className="rounded bg-red-100 px-3 py-1 text-red-800 hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Total: {filteredCustomers.length} /{" "}
        {customers.length} customers
      </p>
    </div>
  </div>
</main>

);
}
