import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@hatan/ui";
import { report } from "../lib/editorial";
export const Route = createFileRoute("/story")({ component: Story });
function Story() {
  return (
    <main className="editorial-page">
      <section className="editorial-hero page-shell">
        <p className="eyebrow">OUR STORY / EST. 2017</p>
        <h1>
          Говиос эхэлсэн.
          <br />
          <em>Ирээдүйд чиглэсэн.</em>
        </h1>
        <p className="editorial-lede">Хүн байгалийн амин хэлхээ нь байна.</p>
        <div className="wide-photo">
          <img
            src="/images/fields.webp"
            alt="Кластерын тайлан дахь тариалалтын талбай"
          />
          <span>КЛАСТЕРЫН ТОЙМ ТАЙЛАНГААС</span>
        </div>
      </section>
      <section className="editorial-body">
        <p className="eyebrow">FROM CONSERVATION TO CREATION</p>
        <h2>
          Нэг ургамлын түүх.
          <br />
          <em>Нэгэн цогц холбоо.</em>
        </h2>
        <p>
          Галтууд ХХК нь 2012 оноос хармаг жимсгэнийг хамгаалж, тариалж, генетик
          нөөцийг арвижуулах Хатан Хармаг кластер хөгжлийн хөтөлбөрийг
          хэрэгжүүлж ирсэн тухай тойм тайланд дурдсан.
        </p>
        <p>
          Хатан Хармаг ХХК 2017 онд уг хөтөлбөрийн хүрээнд байгуулагдсан. Говийн
          ургамлын орцтой цай болон хүнсний бүтээгдэхүүн хөгжүүлэх, үйлдвэрлэх,
          худалдаалах нь компанийн үйл ажиллагааны чиглэл юм.
        </p>
        <p>
          Байгалийг танин мэдэх, судлах, хамгаалах, тариалах, дараа нь үнэ
          цэнтэй бүтээгдэхүүн бүтээх. Энэ холбоо бидний түүхийн гол утга.
        </p>
        <div className="timeline-list">
          {[
            ["2012", "Хармаг хамгаалах, тариалах кластер хөтөлбөрийн эхлэл."],
            ["2014", "Амин хэлхээ байгаль сан байгуулагдсан."],
            ["2017", "Хатан Хармаг ХХК байгуулагдсан."],
            [
              "2021",
              "Тойм тайланд Говийн цэцэрлэгт хүрээлэн байгуулсан тухай дурдсан.",
            ],
          ].map(([year, text]) => (
            <div key={year}>
              <span>{year}</span>
              <p>{text}</p>
            </div>
          ))}
        </div>
        <a
          href={report}
          className="understated-link"
          target="_blank"
          rel="noreferrer"
        >
          Нийлүүлсэн эх тайланг унших (PDF) <ArrowUpRight size={17} />
        </a>
        <p className="source-note">
          Түүхэн мэдээлэл нь нийлүүлсэн тайлангаас. Өнөөгийн гүйцэтгэлийн бие
          даасан баталгаажуулалт биш.
        </p>
        <Button asChild>
          <Link to="/products">
            Бүтээгдэхүүнтэй танилцах <ArrowUpRight size={17} />
          </Link>
        </Button>
      </section>
    </main>
  );
}
