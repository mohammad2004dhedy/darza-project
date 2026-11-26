import { Link } from 'react-router'
import { buttonStyles } from '../components/ui/buttonStyles'

export default function NotFoundPage() {
  return (
    <section
      aria-labelledby="not-found-title"
      className="flex min-h-[calc(100dvh-9rem)] flex-col items-center justify-center py-6 text-center"
      dir="rtl"
    >
      <img
        src="/images/lost-deer.png"
        alt="غزال محتار لابس هودي أخضر بترولي ورافع طنطوره، قاعد تحت شجرة زيتون وحاط إيده على وجهه"
        width={1254}
        height={1254}
        className="mb-2 h-auto w-full max-w-[320px] object-contain sm:max-w-[420px]"
      />
      <span className="mb-3 text-sm font-bold tracking-[0.25em] text-text-muted" dir="ltr">
        404
      </span>
      <h1
        id="not-found-title"
        className="max-w-xl text-xl leading-relaxed font-bold text-primary sm:text-2xl"
      >
        الصفحة الي بتحاول توصللها مش موجودة،
        <br className="hidden sm:block" /> يمكن قصدك إشي ثاني؟
      </h1>
      <p className="mt-3 text-sm leading-7 text-text-muted">ولا يهمك، خلّينا نرجعك لمكان بتعرفه.</p>
      <Link to="/" className={buttonStyles('primary', 'lg', false, 'mt-6 gap-3')}>
        الرجوع للصفحة الرئيسية
        <span aria-hidden="true">←</span>
      </Link>
    </section>
  )
}
