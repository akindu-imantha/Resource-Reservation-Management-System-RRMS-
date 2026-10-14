import Head from "next/head";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarCheck2,
  Check,
  ChevronRight,
  Clock3,
  Laptop2,
  MapPin,
  Monitor,
  UsersRound,
} from "lucide-react";
import SiteFooter from "../components/layout/SiteFooter";
import SiteHeader from "../components/layout/SiteHeader";
import styles from "./index.module.css";

const benefits = [
  {
    icon: CalendarCheck2,
    title: "Book with confidence",
    description:
      "See what is available before you ask. Choose a time that works and send your reservation in seconds.",
  },
  {
    icon: UsersRound,
    title: "Keep everyone in sync",
    description:
      "Give your team one clear place to check upcoming bookings, changes, and availability.",
  },
  {
    icon: Clock3,
    title: "Make better use of every space",
    description:
      "Spend less time coordinating and more time getting good work done together.",
  },
];

const resourceTypes = [
  { icon: UsersRound, label: "Meeting rooms", detail: "Find a room for every conversation" },
  { icon: Laptop2, label: "Equipment", detail: "Reserve the tools your work needs" },
  { icon: Monitor, label: "Shared spaces", detail: "Make a place for focused work" },
];

const week = [
  { day: "MON", date: "12", active: false },
  { day: "TUE", date: "13", active: true },
  { day: "WED", date: "14", active: false },
  { day: "THU", date: "15", active: false },
  { day: "FRI", date: "16", active: false },
];

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Roomly — Make room for what matters</title>
        <meta
          name="description"
          content="Find and reserve the rooms, equipment, and shared spaces your team needs."
        />
        <meta name="theme-color" content="#f7f8f5" />
      </Head>

      <main className={styles.site}>
        <SiteHeader />

        <section className={styles.hero} id="top">
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              THE SPACE TO DO YOUR BEST WORK
            </div>
            <h1>
              Make room for
              <br />
              <span>what matters.</span>
            </h1>
            <p className={styles.heroText}>
              The rooms, equipment, and shared spaces your team needs — easy to
              find, simple to reserve, all in one place.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.primaryButton} href="#resources">
                Find your space <ArrowRight size={17} />
              </a>
              <a className={styles.textButton} href="#how-it-works">
                See how it works <ArrowDownRight size={17} />
              </a>
            </div>
            <div className={styles.trustNote}>
              <span className={styles.avatarStack} aria-hidden="true">
                <span>J</span>
                <span>M</span>
                <span>A</span>
                <span>+</span>
              </span>
              <span>Less back-and-forth. More work that moves you forward.</span>
            </div>
          </div>

          <div className={styles.heroVisual} aria-label="Resource availability preview">
            <div className={styles.visualGlow} />
            <div className={styles.bookingCard}>
              <div className={styles.cardTopline}>
                <div>
                  <span className={styles.cardKicker}>YOUR TEAM, AT A GLANCE</span>
                  <h2>Good morning, Alex</h2>
                </div>
                <button className={styles.moreButton} type="button" aria-label="More options">
                  ···
                </button>
              </div>

              <div className={styles.weekHeader}>
                <span>This week</span>
                <button type="button" aria-label="Show next week">
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className={styles.weekStrip}>
                {week.map((item) => (
                  <div
                    className={`${styles.day} ${item.active ? styles.activeDay : ""}`}
                    key={item.day}
                  >
                    <span>{item.day}</span>
                    <strong>{item.date}</strong>
                  </div>
                ))}
              </div>

              <div className={styles.bookingSummary}>
                <div className={styles.summaryHeading}>
                  <span>UP NEXT</span>
                  <span className={styles.todayLabel}>TODAY · TUESDAY 13</span>
                </div>
                <div className={styles.bookingItem}>
                  <div className={styles.bookingTime}>10:30</div>
                  <div className={styles.bookingLine} />
                  <div className={styles.bookingDetails}>
                    <div className={styles.bookingTitleRow}>
                      <strong>Huddle Room 02</strong>
                      <span className={styles.confirmed}><Check size={12} /> Confirmed</span>
                    </div>
                    <span><MapPin size={13} /> North wing · 4 people</span>
                  </div>
                </div>
                <div className={styles.bookingItem}>
                  <div className={styles.bookingTime}>13:00</div>
                  <div className={`${styles.bookingLine} ${styles.secondLine}`} />
                  <div className={styles.bookingDetails}>
                    <div className={styles.bookingTitleRow}>
                      <strong>Projector · Epson 01</strong>
                      <span className={styles.pending}>Awaiting approval</span>
                    </div>
                    <span><MapPin size={13} /> Equipment desk</span>
                  </div>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <span className={styles.onlineDot} /> Everything your team needs, in sync
                <ArrowUpRight size={15} />
              </div>
            </div>

            <div className={styles.floatingNote}>
              <span className={styles.floatingIcon}><Check size={16} /></span>
              <span><strong>You’re all set</strong><small>Your room is confirmed</small></span>
            </div>
            <div className={styles.floatingNumber}>
              <span>12</span>
              <small>spaces<br />available</small>
            </div>
          </div>
          <div className={styles.heroDecoration} aria-hidden="true">✳</div>
        </section>

        <section className={styles.resourceSection} id="resources">
          <div className={styles.sectionIntro}>
            <span className={styles.sectionEyebrow}>YOUR WORKDAY, MADE EASIER</span>
            <h2>Everything you need.<br /><span>Right where you need it.</span></h2>
          </div>
          <div className={styles.resourceGrid}>
            {resourceTypes.map(({ icon: Icon, label, detail }, index) => (
              <a className={styles.resourceCard} href="#how-it-works" key={label}>
                <span className={`${styles.resourceIcon} ${index === 1 ? styles.resourceIconMint : ""}`}>
                  <Icon size={21} strokeWidth={1.8} />
                </span>
                <span className={styles.resourceCardText}>
                  <strong>{label}</strong>
                  <small>{detail}</small>
                </span>
                <ArrowUpRight className={styles.resourceArrow} size={17} />
              </a>
            ))}
          </div>
        </section>

        <section className={styles.benefitsSection} id="benefits">
          <div className={styles.benefitsHeading}>
            <div>
              <span className={styles.sectionEyebrow}>A BETTER WAY TO GET TOGETHER</span>
              <h2>Small details.<br /><span>Big difference.</span></h2>
            </div>
            <p>
              Good work happens when people have the right space and tools.
              Roomly makes getting them feel effortless.
            </p>
          </div>
          <div className={styles.benefitsGrid}>
            {benefits.map(({ icon: Icon, title, description }, index) => (
              <article className={styles.benefitCard} key={title}>
                <span className={styles.benefitNumber}>0{index + 1}</span>
                <span className={styles.benefitIcon}><Icon size={21} strokeWidth={1.8} /></span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.howSection} id="how-it-works">
          <div className={styles.howCopy}>
            <span className={styles.sectionEyebrow}>THREE STEPS. THAT’S IT.</span>
            <h2>Your next great<br /><span>workday starts here.</span></h2>
            <p>Find the right resource, pick a time, and get on with what you do best.</p>
            <a className={styles.primaryButton} href="#top">Get started <ArrowRight size={17} /></a>
          </div>
          <div className={styles.steps}>
            <div className={styles.step}>
              <span className={styles.stepNumber}>01</span>
              <div><h3>Find what fits</h3><p>Browse spaces and equipment by type, time, or capacity.</p></div>
              <span className={styles.stepCheck}><Check size={16} /></span>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>02</span>
              <div><h3>Choose your time</h3><p>Check availability and pick a slot that works for everyone.</p></div>
              <span className={styles.stepCheck}><Check size={16} /></span>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>03</span>
              <div><h3>You’re good to go</h3><p>Send your request and keep your plans together in one place.</p></div>
              <span className={styles.stepCheck}><Check size={16} /></span>
            </div>
          </div>
        </section>
        <SiteFooter />
      </main>
    </>
  );
}
