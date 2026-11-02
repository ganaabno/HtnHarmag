import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import {
  useCart,
  products,
  cartTotal,
  formatMNT,
  checkoutSchema,
  commerce,
} from "@hatan/commerce";
import { Button } from "@hatan/ui";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
export const Route = createFileRoute("/checkout")({ component: Checkout });
function Checkout() {
  const { lines, clear } = useCart();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      consent: false,
    },
    validators: { onSubmit: checkoutSchema },
    onSubmit: async ({ value }) => {
      setError("");
      try {
        const order = await commerce.createOrder(value, lines);
        clear();
        await navigate({
          to: "/confirmation/$orderId",
          params: { orderId: order.id },
        });
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Түр алдаа гарлаа. Дахин оролдоно уу.",
        );
      }
    },
  });
  if (!lines.length)
    return (
      <main className="page-shell checkout-empty">
        <p className="eyebrow">YOUR LITTLE GOBI</p>
        <h1>
          Сагсаа эхлээд
          <br />
          <em>дүүргээрэй.</em>
        </h1>
        <p>Захиалга үүсгэхэд дор хаяж нэг бүтээгдэхүүн хэрэгтэй.</p>
        <Button asChild>
          <Link to="/products">
            Бүтээгдэхүүн үзэх <ArrowRight size={18} />
          </Link>
        </Button>
      </main>
    );
  return (
    <main className="page-shell checkout-page">
      <Link to="/products" className="understated-link">
        <ArrowLeft size={16} /> Дэлгүүр рүү буцах
      </Link>
      <p className="eyebrow">ONE STEP CLOSER</p>
      <h1>
        Таны жижигхэн
        <br />
        <em>говийн багц.</em>
      </h1>
      <p className="demo-notice">
        <ShieldCheck size={18} /> Демо захиалга. Төлбөр авахгүй, мэдээллийг
        серверт илгээхгүй.
      </p>
      <div className="checkout-layout">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
          className="checkout-form"
        >
          <h2>Холбоо барих мэдээлэл</h2>
          {(["name", "email", "phone", "address"] as const).map((name) => (
            <form.Field key={name} name={name}>
              {(field) => (
                <div className="form-field">
                  <label htmlFor={name}>
                    {
                      {
                        name: "Таны нэр",
                        email: "И-мэйл",
                        phone: "Утасны дугаар",
                        address: "Хүргэлтийн хаяг",
                      }[name]
                    }
                  </label>
                  <input
                    id={name}
                    name={name}
                    type={
                      name === "email"
                        ? "email"
                        : name === "phone"
                          ? "tel"
                          : "text"
                    }
                    autoComplete={
                      name === "address"
                        ? "street-address"
                        : name === "phone"
                          ? "tel"
                          : name
                    }
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={field.state.meta.errors.length > 0}
                    aria-describedby={`${name}-error`}
                  />
                  <span id={`${name}-error`} className="field-error">
                    {field.state.meta.errors.map((e) => e?.message).join(" ")}
                  </span>
                </div>
              )}
            </form.Field>
          ))}
          <form.Field name="consent">
            {(field) => (
              <div className="form-field">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={field.state.value}
                    onChange={(e) => field.handleChange(e.target.checked)}
                  />
                  Бодит худалдан авалт биш, туршилтын захиалга болохыг ойлгож
                  байна.
                </label>
                <span className="field-error">
                  {field.state.meta.errors.map((e) => e?.message).join(" ")}
                </span>
              </div>
            )}
          </form.Field>
          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(busy) => (
              <Button type="submit" disabled={busy}>
                {busy ? "Үүсгэж байна…" : "Демо захиалга баталгаажуулах"}{" "}
                <ArrowRight size={17} />
              </Button>
            )}
          </form.Subscribe>
          <p className="source-note">
            Картын мэдээлэл шаардлагагүй.{" "}
            <Link to="/privacy">Нууцлал ба демо нөхцөл</Link>
          </p>
        </form>
        <aside className="order-summary">
          <p className="eyebrow">ORDER SUMMARY</p>
          <h2>Захиалгын тойм</h2>
          {lines.map((l) => {
            const p = products.find((p) => p.id === l.productId)!;
            return (
              <div key={p.id} className="summary-line">
                <img src={p.image} alt={p.title} />
                <div>
                  <h3>{p.title}</h3>
                  <p>
                    {p.variant.label} × {l.quantity}
                  </p>
                </div>
                <strong>{formatMNT(p.price! * l.quantity)}</strong>
              </div>
            );
          })}
          <dl>
            <div>
              <dt>Бүтээгдэхүүн</dt>
              <dd>{formatMNT(cartTotal(lines))}</dd>
            </div>
            <div>
              <dt>Хүргэлт</dt>
              <dd>Демо · тооцоогүй</dd>
            </div>
            <div className="summary-total">
              <dt>Нийт</dt>
              <dd>{formatMNT(cartTotal(lines))}</dd>
            </div>
          </dl>
          <small>Үнийн саналын лавлах дүн. Төлөх бодит нэхэмжлэх биш.</small>
        </aside>
      </div>
    </main>
  );
}
