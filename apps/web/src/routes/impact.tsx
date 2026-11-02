import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Sprout, FileText, CircleCheck } from "lucide-react";
import { report, brochure } from "../lib/editorial";
export const Route = createFileRoute("/impact")({ component: Impact });
function Impact() {
  return (
    <main className="editorial-page impact-page">
      <section className="editorial-hero page-shell">
        <p className="eyebrow">PLANTING A SHARED FUTURE</p>
        <h1>
          Нэг Сэргээнээ —<br />
          <em>Нэг мод.</em>
        </h1>
        <p className="editorial-lede">Таны сонголт байгальд үнэ цэн бүтээнэ.</p>
        <div className="impact-documentary">
          <img
            src="/images/planting.webp"
            alt="Төслийн талбайд тарьцтай ажиллаж буй хүн, кластерын тайлангаас"
          />
          <div>
            <Sprout size={42} strokeWidth={1} />
            <h2>
              Амлалтыг
              <br />
              <em>бодит ажлаар.</em>
            </h2>
            <p>
              Энэ уриа нь Сэргээнээний нийлүүлсэн танилцуулгад байгаа кампанит
              ажлын зорилго. Бид зорилго, тайлагнасан ажил, баталгаажсан үр дүнг
              ялгаж харуулна.
            </p>
          </div>
        </div>
      </section>
      <section className="editorial-body">
        <h2>
          Ил тод байх нь
          <br />
          <em>эхний алхам.</em>
        </h2>
        <div className="transparency-list">
          <article>
            <Sprout />
            <h3>Кампанит ажлын амлалт</h3>
            <p>
              “Нэг Сэргээнээ уухад нэг мод ургана” гэсэн уриа бүтээгдэхүүний
              танилцуулгад бий. Энэ нь энэхүү сайтын захиалга бүрээр
              баталгаажсан тариалалт үүсэж байна гэсэн утга биш.
            </p>
          </article>
          <article>
            <FileText />
            <h3>Тайланд дурдсан ажил</h3>
            <p>
              Кластерын баримтад хармаг хамгаалах, тариалах судалгаа,
              туршилтууд, Амин хэлхээ байгаль сангийн үйл ажиллагаа болон Говь
              Бүрд агро-ойжуулалтын төслийн тухай дурдсан.
            </p>
          </article>
          <article>
            <CircleCheck />
            <h3>Одоогийн баталгаажуулалт</h3>
            <p>
              Захиалга бүрийг тариалсан модтой тулгасан бүртгэл, амьдралтын
              хувь, хараат бус баталгаажуулалт нийлүүлэгдээгүй. Иймээс
              “баталгаажсан нийт мод” гэсэн тоо гаргаагүй.
            </p>
          </article>
        </div>
        <p>
          Нүүр хуудасны ургамал ургах дүрслэл нь байгаль хамгаалах хүсэл,
          зорилгыг бэлгэдэнэ. Анимац тоглох нь мод таригдсаны нотолгоо биш. Демо
          худалдан авалт нь тариалалтын бодит бүртгэл үүсгэхгүй.
        </p>
        <div className="source-links">
          <a href={brochure} target="_blank" rel="noreferrer">
            Сэргээнээний танилцуулга <ArrowUpRight size={17} />
          </a>
          <a href={report} target="_blank" rel="noreferrer">
            Кластерын тойм тайлан <ArrowUpRight size={17} />
          </a>
        </div>
      </section>
    </main>
  );
}
