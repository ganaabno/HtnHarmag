import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ArrowUpRight } from "lucide-react";
import { formatMNT, type DemoOrder } from "@hatan/commerce";
import { Button } from "@hatan/ui";
export const Route = createFileRoute("/confirmation/$orderId")({
  component: Confirmation,
});
function Confirmation() {
  const { orderId } = Route.useParams();
  let order: DemoOrder | null = null;
  try {
    const value = JSON.parse(
      sessionStorage.getItem("hatan-last-order") ?? "null",
    ) as DemoOrder | null;
    if (value?.id === orderId && value.mode === "demo") order = value;
  } catch {
    /* missing or invalid demo session */
  }
  return (
    <main className="page-shell confirmation">
      <div className="confirmation-symbol">
        <Check size={35} />
      </div>
      <p className="eyebrow">
        {order ? "DEMO ORDER CREATED" : "NO ORDER FOUND"}
      </p>
      <h1>
        {order ? (
          <>
            Баярлалаа.
            <br />
            <em>Эхлэл тавигдлаа.</em>
          </>
        ) : (
          <>
            Захиалга
            <br />
            <em>олдсонгүй.</em>
          </>
        )}
      </h1>
      {order ? (
        <>
          <p>
            Туршилтын захиалга <strong>{order.id}</strong> үүслээ.
          </p>
          <p className="confirmation-total">{formatMNT(order.total)}</p>
          <p>
            Төлбөр аваагүй. Бодит захиалга, хүргэлт болон мод тарих бүртгэл
            үүсгээгүй.
          </p>
        </>
      ) : (
        <p>
          Демо баталгаажуулалт зөвхөн захиалга хийсэн хөтчийн тухайн сессэд
          харагдана.
        </p>
      )}
      <Button asChild>
        <Link to="/products">
          Бүтээгдэхүүн рүү <ArrowUpRight size={18} />
        </Link>
      </Button>
    </main>
  );
}
